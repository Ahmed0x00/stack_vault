const express = require('express');
const crypto = require('crypto');
const prodseller = require('../services/prodseller');
const { query, queryOne } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { getSellPriceCents, dollarsToCents, centsToDollars } = require('../config/pricing');

const router = express.Router();

// MAX units per purchase
const MAX_QUANTITY = 50;

// POST /api/orders — Place order using account balance
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body;

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1 || qty > MAX_QUANTITY) {
    return res.status(400).json({ error: `Quantity must be between 1 and ${MAX_QUANTITY}` });
  }

  try {
    // Fetch product details
    const product = await prodseller.getProduct(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    const costCents = dollarsToCents(product.price || 0);
    const sellCents = getSellPriceCents(costCents);

    const totalCostCents = costCents * qty;
    const totalSellCents = sellCents * qty;
    const totalProfitCents = totalSellCents - totalCostCents;

    // Check user balance
    const user = await queryOne('SELECT balance FROM users WHERE id = ?', [userId]);
    if (!user || user.balance < totalSellCents) {
      const requiredDollars = centsToDollars(totalSellCents);
      const userDollars = centsToDollars(user ? user.balance : 0);
      const neededDollars = centsToDollars(totalSellCents - (user ? user.balance : 0));

      return res.status(402).json({
        error: 'Insufficient account balance',
        required: requiredDollars,
        currentBalance: userDollars,
        needed: neededDollars,
      });
    }

    // Atomically deduct balance
    const updateRes = await query(
      'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?',
      [totalSellCents, userId, totalSellCents]
    );

    if (updateRes.affectedRows === 0 && updateRes.changes === 0) {
      return res.status(402).json({ error: 'Insufficient funds or concurrent transaction' });
    }

    // Call ProdSeller API
    const idempotencyKey = `web_${userId}_${crypto.randomBytes(4).toString('hex')}`;
    const apiResult = await prodseller.createOrder(productId, qty, idempotencyKey);

    if (!apiResult || apiResult.error) {
      // REFUND if API call failed
      await query('UPDATE users SET balance = balance + ? WHERE id = ?', [totalSellCents, userId]);
      const errMsg = apiResult?.error || 'Supplier failed to fulfill order';
      return res.status(502).json({ error: `Order failed: ${errMsg}. Your balance has been fully refunded.` });
    }

    // Extract keys
    let keysList = [];
    if (apiResult.deliveredKeys && Array.isArray(apiResult.deliveredKeys)) {
      keysList = apiResult.deliveredKeys;
    } else if (apiResult.deliveredKey) {
      keysList = [apiResult.deliveredKey];
    } else {
      keysList = ['(Pending automated delivery)'];
    }

    const keysText = keysList.join('\n');
    const apiOrderId = String(apiResult.orderId || 'N/A');

    // Record order in DB
    const orderRecord = await query(
      `INSERT INTO orders 
        (user_id, product_id, product_name, api_order_id, cost_price, sell_price, profit, delivered_key, quantity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')`,
      [userId, String(productId), product.name, apiOrderId, totalCostCents, totalSellCents, totalProfitCents, keysText, qty]
    );

    // Record transaction
    await query(
      `INSERT INTO transactions (user_id, type, amount, description, status)
       VALUES (?, 'purchase', ?, ?, 'completed')`,
      [userId, -totalSellCents, `Purchased ${product.name} x${qty}`]
    );

    // Get fresh balance
    const freshUser = await queryOne('SELECT balance FROM users WHERE id = ?', [userId]);

    res.status(201).json({
      message: 'Order completed successfully!',
      order: {
        id: orderRecord.insertId,
        productName: product.name,
        quantity: qty,
        totalCharged: centsToDollars(totalSellCents),
        keys: keysList,
        apiOrderId: apiOrderId,
        date: new Date().toISOString(),
      },
      newBalance: centsToDollars(freshUser.balance),
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Internal error processing purchase' });
  }
});

// GET /api/orders — List user's past orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orders = await query(
      `SELECT id, product_name, sell_price, delivered_key, quantity, status, created_at, api_order_id
       FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );

    const formatted = orders.map((o) => {
      const keysList = (o.delivered_key || '').split('\n').filter((k) => k.trim());
      return {
        id: o.id,
        productName: o.product_name,
        quantity: o.quantity || 1,
        totalPaid: centsToDollars(o.sell_price),
        keys: keysList,
        apiOrderId: o.api_order_id,
        status: o.status,
        createdAt: o.created_at,
      };
    });

    res.json({ orders: formatted });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to retrieve order history' });
  }
});

// GET /api/orders/:id/download — Download key file for an order
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const order = await queryOne(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    const keysList = (order.delivered_key || '').split('\n').filter((k) => k.trim());
    const productNameSafe = (order.product_name || 'Product').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `StackVault_${productNameSafe}_#${order.id}.txt`;

    let fileContent = `StackVault — Official Order Receipt\n`;
    fileContent += `${'='.repeat(45)}\n`;
    fileContent += `Product  : ${order.product_name}\n`;
    fileContent += `Quantity : ${order.quantity}\n`;
    fileContent += `Order ID : #${order.id}\n`;
    fileContent += `Total    : $${centsToDollars(order.sell_price)} USD\n`;
    fileContent += `Date     : ${new Date(order.created_at).toLocaleString()}\n`;
    fileContent += `${'='.repeat(45)}\n\n`;
    fileContent += `Your License Keys / Credentials:\n`;
    fileContent += `${'-'.repeat(45)}\n`;
    keysList.forEach((k, i) => {
      fileContent += `${i + 1}. ${k}\n`;
    });
    fileContent += `${'-'.repeat(45)}\n\nThank you for choosing StackVault!\nWebsite: https://stackvault.xyz\nSupport: https://t.me/stackvault_bot\n`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileContent);

  } catch (error) {
    console.error('Download keys error:', error);
    res.status(500).json({ error: 'Failed to generate key file' });
  }
});

module.exports = router;
