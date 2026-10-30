const express = require('express');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Follow = require('../models/Follow');
const upload = require('../middleware/upload');
const { auth, sellerOnly, buyerOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/products — add product (seller only)
router.post('/', auth, sellerOnly, upload.single('photo'), async (req, res) => {
  try {
    const { title, price, sizes, description, inStock } = req.body;
    if (!title || !price) {
      return res.status(400).json({ message: 'Title and price are required' });
    }
    const shop = await Shop.findOne({ ownerId: req.user.id });
    if (!shop) return res.status(404).json({ message: 'Create your shop first' });

    const photoUrl = req.file
      ? `/uploads/${req.file.filename}`
      : '';

    const sizesArr = sizes
      ? (Array.isArray(sizes) ? sizes : sizes.split(',').map(s => s.trim()).filter(Boolean))
      : [];

    const product = await Product.create({
      shopId: shop._id,
      title,
      price: parseFloat(price),
      sizes: sizesArr,
      photoUrl,
      description,
      inStock: inStock !== 'false',
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/shop/:shopId — list products for a shop (public)
router.get('/shop/:shopId', async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.params.shopId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/search?q=... — search within buyer's followed shops only
router.get('/search', auth, buyerOnly, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    // Get shopIds the buyer follows
    const follows = await Follow.find({ buyerId: req.user.id }).select('shopId');
    const shopIds = follows.map((f) => f.shopId);
    if (!shopIds.length) return res.json([]);

    // Text search within followed shops only
    const results = await Product.find({
      shopId: { $in: shopIds },
      inStock: true,
      title: { $regex: q.trim(), $options: 'i' },
    })
      .populate('shopId', 'name marketName')
      .limit(30)
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/products/:id — update product or toggle inStock (seller only)
router.patch('/:id', auth, sellerOnly, upload.single('photo'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shopId');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (String(product.shopId.ownerId) !== req.user.id) {
      return res.status(403).json({ message: 'Not your product' });
    }
    const updates = {};
    if (req.body.inStock !== undefined) updates.inStock = req.body.inStock === 'true' || req.body.inStock === true;
    if (req.body.title) updates.title = req.body.title;
    if (req.body.price) updates.price = parseFloat(req.body.price);
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.sizes) {
      updates.sizes = Array.isArray(req.body.sizes)
        ? req.body.sizes
        : req.body.sizes.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (req.file) updates.photoUrl = `/uploads/${req.file.filename}`;

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id — delete product (seller only)
router.delete('/:id', auth, sellerOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('shopId');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (String(product.shopId.ownerId) !== req.user.id) {
      return res.status(403).json({ message: 'Not your product' });
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
