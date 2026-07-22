const express = require('express');
const prodseller = require('../services/prodseller');
const { query, queryOne } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { dollarsToCents, centsToDollars } = require('../config/pricing');

const router = express.Router();

// Apply auth & admin checks to all admin routes
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats — Overall business statistics
router.get('/stats', async (req, res) => {
  try {
    const userCount = await queryOne('SELECT COUNT(*) as count FROM users');
    const orderCount = await queryOne("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
    const profitSum = await queryOne("SELECT COALESCE(SUM(profit), 0) as totalProfit FROM orders WHERE status = 'completed'");
    const revenueSum = await queryOne("SELECT COALESCE(SUM(sell_price), 0) as totalRevenue FROM orders WHERE status = 'completed'");

    // Fetch supplier API balance
    const apiBalance = await prodseller.getBalance();

    res.json({
      stats: {
        totalUsers: userCount ? userCount.count : 0,
        totalOrders: orderCount ? orderCount.count : 0,
        totalProfit: centsToDollars(profitSum ? profitSum.totalProfit : 0),
        totalRevenue: centsToDollars(revenueSum ? revenueSum.totalRevenue : 0),
        supplierApi: {
          balance: apiBalance ? apiBalance.balance : 'N/A',
          membership: apiBalance ? apiBalance.membership : 'N/A',
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin stats' });
  }
});

// GET /api/admin/users — List registered users
router.get('/users', async (req, res) => {
  try {
    const users = await query('SELECT id, email, username, balance, deposit_address, role, telegram_id, created_at FROM users ORDER BY created_at DESC LIMIT 100');
    const formatted = users.map((u) => ({
      ...u,
      balanceDollars: centsToDollars(u.balance),
    }));
    res.json({ users: formatted });
  } catch (error) {
    console.error('Admin list users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// POST /api/admin/add-balance — Credit user balance
router.post('/add-balance', async (req, res) => {
  try {
    const { userId, amountDollars, description } = req.body;
    if (!userId || !amountDollars || parseFloat(amountDollars) <= 0) {
      return res.status(400).json({ error: 'Valid userId and positive amountDollars are required' });
    }

    const amountCents = dollarsToCents(amountDollars);

    const user = await queryOne('SELECT id, username, balance FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await query('UPDATE users SET balance = balance + ? WHERE id = ?', [amountCents, userId]);

    await query(
      `INSERT INTO transactions (user_id, type, amount, description, status)
       VALUES (?, 'admin_credit', ?, ?, 'completed')`,
      [userId, amountCents, description || 'Manual credit by admin']
    );

    const updatedUser = await queryOne('SELECT balance FROM users WHERE id = ?', [userId]);

    res.json({
      message: `Successfully added $${parseFloat(amountDollars).toFixed(2)} to ${user.username}`,
      newBalance: centsToDollars(updatedUser.balance),
    });
  } catch (error) {
    console.error('Admin add balance error:', error);
    res.status(500).json({ error: 'Failed to add balance' });
  }
});

module.exports = router;
