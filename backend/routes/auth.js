const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { getDepositAddress } = require('../services/wallet');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (email, username, password_hash, balance) VALUES (?, ?, ?, 0)',
      [email.toLowerCase().trim(), username.trim(), passwordHash]
    );

    const userId = result.insertId;

    // Derive deterministic BSC deposit address
    let depositAddress = null;
    try {
      const masterSecret = process.env.DEPOSIT_MASTER_SECRET || '16e459d4b07f3fbd7fa3ef7e0c5bb0970a56e31ae662f9a2fe9faf919c5d3089';
      depositAddress = getDepositAddress(userId, masterSecret);
      await query('UPDATE users SET deposit_address = ? WHERE id = ?', [depositAddress, userId]);
    } catch (err) {
      console.error('Error generating deposit address:', err);
    }

    // Check if this user is admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@stackvault.com';
    if (email.toLowerCase().trim() === adminEmail.toLowerCase()) {
      await query("UPDATE users SET role = 'admin' WHERE id = ?", [userId]);
    }

    const user = await queryOne('SELECT id, email, username, balance, deposit_address, role, created_at FROM users WHERE id = ?', [userId]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Ensure deposit address is generated if missing
    if (!user.deposit_address) {
      try {
        const masterSecret = process.env.DEPOSIT_MASTER_SECRET || '16e459d4b07f3fbd7fa3ef7e0c5bb0970a56e31ae662f9a2fe9faf919c5d3089';
        user.deposit_address = getDepositAddress(user.id, masterSecret);
        await query('UPDATE users SET deposit_address = ? WHERE id = ?', [user.deposit_address, user.id]);
      } catch (e) {}
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: user.balance,
      deposit_address: user.deposit_address,
      telegram_id: user.telegram_id,
      role: user.role,
      created_at: user.created_at,
    };

    res.json({
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/link-telegram
const crypto = require('crypto');

function verifyTelegramAuth(data, botToken) {
  if (!data || !data.hash || !data.id) return false;
  if (!botToken) {
    console.warn('TELEGRAM_BOT_TOKEN is not set in environment variables');
    return false;
  }
  const { hash, ...userData } = data;
  const dataCheckArr = [];
  Object.keys(userData)
    .sort()
    .forEach((key) => {
      if (userData[key] !== undefined && userData[key] !== null) {
        dataCheckArr.push(`${key}=${userData[key]}`);
      }
    });
  const dataCheckString = dataCheckArr.join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const nowSec = Math.floor(Date.now() / 1000);
  const isFresh = userData.auth_date && (nowSec - Number(userData.auth_date) < 86400);

  return computedHash.toLowerCase() === hash.toLowerCase() && isFresh;
}

// POST /api/auth/telegram-login
router.post('/telegram-login', async (req, res) => {
  try {
    const telegramData = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!telegramData || !telegramData.id) {
      return res.status(400).json({ error: 'Telegram authentication data required' });
    }

    if (telegramData.hash && botToken) {
      const isValid = verifyTelegramAuth(telegramData, botToken);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid or expired Telegram authentication signature' });
      }
    }

    const tgId = Number(telegramData.id);
    let user = await queryOne('SELECT * FROM users WHERE telegram_id = ?', [tgId]);

    if (!user) {
      const username = telegramData.username || telegramData.first_name || `tg_${tgId}`;
      const email = `${tgId}@telegram.stackvault.xyz`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const result = await query(
        'INSERT INTO users (email, username, password_hash, telegram_id, balance) VALUES (?, ?, ?, ?, 0)',
        [email, username, passwordHash, tgId]
      );
      const userId = result.insertId;

      try {
        const masterSecret = process.env.DEPOSIT_MASTER_SECRET || '16e459d4b07f3fbd7fa3ef7e0c5bb0970a56e31ae662f9a2fe9faf919c5d3089';
        const depositAddress = getDepositAddress(userId, masterSecret);
        await query('UPDATE users SET deposit_address = ? WHERE id = ?', [depositAddress, userId]);
      } catch (err) {}

      user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    } else {
      if (!user.deposit_address) {
        try {
          const masterSecret = process.env.DEPOSIT_MASTER_SECRET || '16e459d4b07f3fbd7fa3ef7e0c5bb0970a56e31ae662f9a2fe9faf919c5d3089';
          user.deposit_address = getDepositAddress(user.id, masterSecret);
          await query('UPDATE users SET deposit_address = ? WHERE id = ?', [user.deposit_address, user.id]);
        } catch (e) {}
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: user.balance,
      deposit_address: user.deposit_address,
      telegram_id: user.telegram_id,
      role: user.role,
      created_at: user.created_at,
    };

    res.json({
      message: 'Telegram login successful',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({ error: 'Server error during Telegram login' });
  }
});

// GET /api/auth/telegram-callback (data-auth-url redirect mode)
router.get('/telegram-callback', async (req, res) => {
  try {
    const telegramData = req.query;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!telegramData || !telegramData.id) {
      return res.redirect('https://stackvault.shop/login.html?error=missing_telegram_data');
    }

    if (telegramData.hash && botToken) {
      const isValid = verifyTelegramAuth(telegramData, botToken);
      if (!isValid) {
        return res.redirect('https://stackvault.shop/login.html?error=invalid_telegram_signature');
      }
    }

    const tgId = Number(telegramData.id);
    let user = await queryOne('SELECT * FROM users WHERE telegram_id = ?', [tgId]);

    if (!user) {
      const username = telegramData.username || telegramData.first_name || `tg_${tgId}`;
      const email = `${tgId}@telegram.stackvault.xyz`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const result = await query(
        'INSERT INTO users (email, username, password_hash, telegram_id, balance) VALUES (?, ?, ?, ?, 0)',
        [email, username, passwordHash, tgId]
      );
      const userId = result.insertId;

      try {
        const masterSecret = process.env.DEPOSIT_MASTER_SECRET || '16e459d4b07f3fbd7fa3ef7e0c5bb0970a56e31ae662f9a2fe9faf919c5d3089';
        const depositAddress = getDepositAddress(userId, masterSecret);
        await query('UPDATE users SET deposit_address = ? WHERE id = ?', [depositAddress, userId]);
      } catch (err) {}

      user = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    } else {
      if (!user.deposit_address) {
        try {
          const masterSecret = process.env.DEPOSIT_MASTER_SECRET || '16e459d4b07f3fbd7fa3ef7e0c5bb0970a56e31ae662f9a2fe9faf919c5d3089';
          user.deposit_address = getDepositAddress(user.id, masterSecret);
          await query('UPDATE users SET deposit_address = ? WHERE id = ?', [user.deposit_address, user.id]);
        } catch (e) {}
      }
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      balance: user.balance,
      deposit_address: user.deposit_address,
      telegram_id: user.telegram_id,
      role: user.role,
      created_at: user.created_at,
    };

    const redirectUrl = `https://stackvault.shop/login.html?tg_token=${encodeURIComponent(token)}&tg_user=${encodeURIComponent(JSON.stringify(safeUser))}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Telegram callback error:', error);
    return res.redirect('https://stackvault.shop/login.html?error=server_error');
  }
});

// POST /api/auth/link-telegram
router.post('/link-telegram', authenticateToken, async (req, res) => {
  try {
    const telegramData = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const tgId = telegramData.id || telegramData.telegram_id;
    if (!tgId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }

    if (telegramData.hash && botToken) {
      const isValid = verifyTelegramAuth(telegramData, botToken);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid or expired Telegram signature' });
      }
    }

    const existing = await queryOne('SELECT id FROM users WHERE telegram_id = ? AND id != ?', [Number(tgId), req.user.id]);
    if (existing) {
      return res.status(400).json({ error: 'This Telegram account is already linked to another user' });
    }

    await query('UPDATE users SET telegram_id = ? WHERE id = ?', [Number(tgId), req.user.id]);
    res.json({ message: 'Telegram account linked successfully', telegram_id: Number(tgId) });
  } catch (error) {
    console.error('Link Telegram error:', error);
    res.status(500).json({ error: 'Failed to link Telegram account' });
  }
});

module.exports = router;
