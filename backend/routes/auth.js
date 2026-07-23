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

// ─── Telegram OpenID Connect (OIDC) Auth ───
const crypto = require('crypto');
const axios = require('axios');

const TG_CLIENT_ID = process.env.TELEGRAM_CLIENT_ID || '8725563030';
const TG_CLIENT_SECRET = process.env.TELEGRAM_CLIENT_SECRET || '';
const TG_REDIRECT_URI = 'https://decohomz.com/sv-api/auth/telegram-callback';
const FRONTEND_URL = 'https://stackvault.shop';

// GET /api/auth/telegram-redirect
// Initiates the Telegram OIDC login flow
router.get('/telegram-redirect', (req, res) => {
  const mode = req.query.mode || 'login'; // 'login' or 'link'
  const userToken = req.query.token || ''; // JWT for link mode

  // Create a signed state token for CSRF protection
  const state = jwt.sign(
    { mode, userToken, ts: Date.now() },
    JWT_SECRET,
    { expiresIn: '10m' }
  );

  const nonce = crypto.randomBytes(16).toString('hex');

  const authUrl = `https://oauth.telegram.org/auth?` +
    `client_id=${TG_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(TG_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=openid` +
    `&state=${encodeURIComponent(state)}` +
    `&nonce=${nonce}`;

  res.redirect(authUrl);
});

// GET /api/auth/telegram-callback
// Handles the OIDC callback from Telegram
router.get('/telegram-callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/login.html?tg_error=${encodeURIComponent('Missing authorization code')}`);
    }

    // Verify state token
    let stateData;
    try {
      stateData = jwt.verify(decodeURIComponent(state), JWT_SECRET);
    } catch (e) {
      return res.redirect(`${FRONTEND_URL}/login.html?tg_error=${encodeURIComponent('Invalid or expired state')}`);
    }

    // Exchange authorization code for tokens
    const tokenRes = await axios.post('https://oauth.telegram.org/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: TG_REDIRECT_URI,
        client_id: TG_CLIENT_ID,
        client_secret: TG_CLIENT_SECRET,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { id_token } = tokenRes.data;

    if (!id_token) {
      return res.redirect(`${FRONTEND_URL}/login.html?tg_error=${encodeURIComponent('No ID token received from Telegram')}`);
    }

    // Decode the ID token (trusted — received directly from Telegram over HTTPS with our client_secret)
    const decoded = jwt.decode(id_token);

    if (!decoded || !decoded.sub) {
      return res.redirect(`${FRONTEND_URL}/login.html?tg_error=${encodeURIComponent('Invalid ID token')}`);
    }

    const tgId = Number(decoded.sub);
    const tgUsername = decoded.username || decoded.first_name || `tg_${tgId}`;

    // ─── LINK MODE: Link Telegram to existing account ───
    if (stateData.mode === 'link' && stateData.userToken) {
      try {
        const userData = jwt.verify(stateData.userToken, JWT_SECRET);

        // Check if this Telegram ID is already linked to another user
        const existing = await queryOne('SELECT id FROM users WHERE telegram_id = ? AND id != ?', [tgId, userData.id]);
        if (existing) {
          return res.redirect(`${FRONTEND_URL}/my_account.html?tg_error=${encodeURIComponent('This Telegram account is already linked to another user')}`);
        }

        await query('UPDATE users SET telegram_id = ? WHERE id = ?', [tgId, userData.id]);
        return res.redirect(`${FRONTEND_URL}/my_account.html?tg_linked=1`);
      } catch (e) {
        return res.redirect(`${FRONTEND_URL}/login.html?tg_error=${encodeURIComponent('Session expired, please log in again')}`);
      }
    }

    // ─── LOGIN MODE: Find or create user ───
    let user = await queryOne('SELECT * FROM users WHERE telegram_id = ?', [tgId]);

    if (!user) {
      const email = `${tgId}@telegram.stackvault.shop`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      const result = await query(
        'INSERT INTO users (email, username, password_hash, telegram_id, balance) VALUES (?, ?, ?, ?, 0)',
        [email, tgUsername, passwordHash, tgId]
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

    const redirectUrl = `${FRONTEND_URL}/login.html?tg_token=${encodeURIComponent(token)}&tg_user=${encodeURIComponent(JSON.stringify(safeUser))}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Telegram OIDC callback error:', error.response?.data || error.message || error);
    return res.redirect(`${FRONTEND_URL}/login.html?tg_error=${encodeURIComponent('Telegram authentication failed')}`);
  }
});

// POST /api/auth/link-telegram (legacy manual ID entry fallback)
router.post('/link-telegram', authenticateToken, async (req, res) => {
  try {
    const telegramData = req.body;
    const tgId = telegramData.id || telegramData.telegram_id;
    if (!tgId) {
      return res.status(400).json({ error: 'Telegram ID is required' });
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

