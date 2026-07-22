const express = require('express');
const prodseller = require('../services/prodseller');
const { getSellPriceCents, dollarsToCents, centsToDollars } = require('../config/pricing');

const router = express.Router();

// Category mapping helper for beautiful UI filtering
function categorizeProduct(name = '') {
  const n = name.toLowerCase();
  if (n.includes('chatgpt') || n.includes('grok') || n.includes('gemini') || n.includes('ai') || n.includes('claude')) {
    return { id: 'ai', name: 'AI Subscriptions' };
  }
  if (n.includes('office') || n.includes('windows') || n.includes('key') || n.includes('license')) {
    return { id: 'software', name: 'Software Keys' };
  }
  if (n.includes('prime') || n.includes('netflix') || n.includes('spotify') || n.includes('disney')) {
    return { id: 'streaming', name: 'Streaming' };
  }
  if (n.includes('canva') || n.includes('capcut') || n.includes('adobe') || n.includes('edit')) {
    return { id: 'design', name: 'Design & Editing' };
  }
  if (n.includes('coursera') || n.includes('udemy') || n.includes('learn') || n.includes('skill')) {
    return { id: 'learning', name: 'Learning' };
  }
  if (n.includes('email') || n.includes('outlook') || n.includes('hotmail') || n.includes('gmail')) {
    return { id: 'emails', name: 'Bulk Emails' };
  }
  return { id: 'general', name: 'Digital Services' };
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const rawProducts = await prodseller.getProducts();
    
    if (!rawProducts) {
      return res.status(502).json({ error: 'Failed to fetch products from supplier API' });
    }

    const processedProducts = rawProducts.map((p) => {
      const costDollars = p.price || 0;
      const costCents = dollarsToCents(costDollars);
      const sellCents = getSellPriceCents(costCents);
      const category = categorizeProduct(p.name);
      
      const stock = p.stock !== undefined ? p.stock : (p.inStock ? 10 : 0);
      const inStock = p.inStock !== undefined ? Boolean(p.inStock) : stock > 0;

      return {
        id: String(p.id),
        name: p.name,
        category: category.id,
        categoryName: category.name,
        costPrice: parseFloat(centsToDollars(costCents)),
        price: parseFloat(centsToDollars(sellCents)),
        priceCents: sellCents,
        stock: stock,
        inStock: inStock,
        description: p.description || 'Premium digital subscription key with instant delivery.',
      };
    });

    res.json({ products: processedProducts });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await prodseller.getProduct(req.params.id);
    if (!p) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const costDollars = p.price || 0;
    const costCents = dollarsToCents(costDollars);
    const sellCents = getSellPriceCents(costCents);
    const category = categorizeProduct(p.name);

    const stock = p.stock !== undefined ? p.stock : (p.inStock ? 10 : 0);
    const inStock = p.inStock !== undefined ? Boolean(p.inStock) : stock > 0;

    res.json({
      product: {
        id: String(p.id),
        name: p.name,
        category: category.id,
        categoryName: category.name,
        price: parseFloat(centsToDollars(sellCents)),
        priceCents: sellCents,
        stock: stock,
        inStock: inStock,
        description: p.description || 'Premium digital subscription key with instant delivery.',
      },
    });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    res.status(500).json({ error: 'Failed to load product detail' });
  }
});

module.exports = router;
