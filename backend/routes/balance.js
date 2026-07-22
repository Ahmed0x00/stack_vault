const express = require('express');
const { query, queryOne } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { centsToDollars } = require('../config/pricing');

const router = express.Router();

// GET /api/balance — Get balance & transaction history
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT balance, deposit_address FROM users WHERE id = ?', [req.user.id]);
    const transactions = await query(
      'SELECT id, type, amount, tx_hash, description, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );

    const formattedTx = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: centsToDollars(t.amount),
      isCredit: t.amount > 0,
      description: t.description,
      txHash: t.tx_hash,
      status: t.status,
      createdAt: t.created_at,
    }));

    res.json({
      balance: centsToDollars(user ? user.balance : 0),
      balanceCents: user ? user.balance : 0,
      depositAddress: user ? user.deposit_address : null,
      transactions: formattedTx,
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// GET /api/balance/deposit-info — Get USDT deposit address & Binance Pay details
router.get('/deposit-info', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne('SELECT deposit_address FROM users WHERE id = ?', [req.user.id]);
    const binancePayId = process.env.BINANCE_PAY_ID || '1120547012';

    res.json({
      usdt: {
        address: user ? user.deposit_address : null,
        network: 'BEP20 (Binance Smart Chain)',
        token: 'USDT',
        confirmationsRequired: 15,
        note: 'Funds will be automatically credited to your balance after 15 block confirmations.',
      },
      binancePay: {
        payId: binancePayId,
        note: 'Send USDT/BUSD via Binance Pay ID, then contact support with your payment receipt.',
      },
    });
  } catch (error) {
    console.error('Get deposit info error:', error);
    res.status(500).json({ error: 'Failed to load deposit information' });
  }
});

module.exports = router;
