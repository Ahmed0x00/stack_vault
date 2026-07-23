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

const DUMMY_PRODUCT = {
  id: 'dummy-free-test',
  name: 'Free Test Key',
  category: 'general',
  categoryName: 'Digital Services',
  costPrice: 0,
  price: 0,
  priceCents: 0,
  stock: 999,
  inStock: true,
  description: 'A free dummy product to test the purchasing flow without spending balance.'
};

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const rawProducts = await prodseller.getProducts();
    
    if (!rawProducts) {
      return res.status(502).json({ error: 'Failed to fetch products from supplier API' });
    }

    // Fetch details for all products concurrently to get actual stock
    const detailedProducts = await Promise.all(
      rawProducts.map(async (p) => {
        const detail = await prodseller.getProduct(p.id);
        return { ...p, stock: detail ? detail.stock : (p.inStock ? 10 : 0) };
      })
    );

    const processedProducts = detailedProducts.map((p) => {
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

    processedProducts.unshift(DUMMY_PRODUCT);

    res.json({ products: processedProducts });
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id === 'dummy-free-test') {
      return res.json({ product: DUMMY_PRODUCT });
    }

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
