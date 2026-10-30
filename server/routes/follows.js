const express = require('express');
const Follow = require('../models/Follow');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { auth, buyerOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/follows — buyer follows a shop
router.post('/', auth, buyerOnly, async (req, res) => {
  try {
    const { shopId } = req.body;
    if (!shopId) return res.status(400).json({ message: 'shopId required' });
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const follow = await Follow.create({ buyerId: req.user.id, shopId });
    res.status(201).json(follow);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Already following this shop' });
    }
    res.status(500).json({ message: err.message });
  }
});

// GET /api/follows/my-shops — buyer's followed shops with latest product
router.get('/my-shops', auth, buyerOnly, async (req, res) => {
  try {
    const follows = await Follow.find({ buyerId: req.user.id })
      .populate('shopId')
      .sort({ createdAt: -1 });

    const shopsWithProducts = await Promise.all(
      follows.map(async (f) => {
        if (!f.shopId) return null;
        const latestProducts = await Product.find({ shopId: f.shopId._id })
          .sort({ createdAt: -1 })
          .limit(4);
        return { shop: f.shopId, products: latestProducts, followedAt: f.createdAt };
      })
    );

    res.json(shopsWithProducts.filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/follows/check/:shopId — check if buyer follows a shop
router.get('/check/:shopId', auth, buyerOnly, async (req, res) => {
  try {
    const follow = await Follow.findOne({ buyerId: req.user.id, shopId: req.params.shopId });
    res.json({ following: !!follow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
