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
router.post('/link-telegram', authenticateToken, async (req, res) => {
  try {
    const { telegram_id } = req.body;
    if (!telegram_id) {
      return res.status(400).json({ error: 'Telegram ID is required' });
    }
    await query('UPDATE users SET telegram_id = ? WHERE id = ?', [telegram_id, req.user.id]);
    res.json({ message: 'Telegram account linked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link Telegram account' });
  }
});

module.exports = router;
