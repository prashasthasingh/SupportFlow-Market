const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Shop = require('../models/Shop');
const { auth, sellerOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/shops — create shop (seller only)
router.post('/', auth, sellerOnly, async (req, res) => {
  try {
    const { name, marketName, description } = req.body;
    if (!name || !marketName) {
      return res.status(400).json({ message: 'Shop name and market name are required' });
    }
    // One shop per seller
    const existing = await Shop.findOne({ ownerId: req.user.id });
    if (existing) {
      return res.status(409).json({ message: 'You already have a shop', shop: existing });
    }
    const qrToken = uuidv4();
    const shop = await Shop.create({ ownerId: req.user.id, name, marketName, description, qrToken });
    res.status(201).json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/shops/my — get seller's own shop
router.get('/my', auth, sellerOnly, async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user.id });
    if (!shop) return res.status(404).json({ message: 'No shop found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/shops/by-id/:id — look up shop by its MongoDB _id (public)
router.get('/by-id/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('ownerId', 'name');
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/shops/:qrToken — look up shop by QR token (public)
router.get('/:qrToken', async (req, res) => {
  try {
    const shop = await Shop.findOne({ qrToken: req.params.qrToken }).populate('ownerId', 'name');
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
