const express = require('express');
const Review = require('../models/Review');
const Order = require('../models/Order');
const { auth, buyerOnly } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews — buyer submits review on a delivered order
router.post('/', auth, buyerOnly, async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    if (!orderId || !rating) {
      return res.status(400).json({ message: 'orderId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify order belongs to buyer and is delivered
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (String(order.buyerId) !== req.user.id) {
      return res.status(403).json({ message: 'Not your order' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only review delivered orders' });
    }

    const review = await Review.create({
      buyerId: req.user.id,
      shopId: order.shopId,
      orderId,
      rating: Number(rating),
      comment: comment || '',
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this order' });
    }
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/shop/:shopId — public, returns reviews + avg rating
router.get('/shop/:shopId', async (req, res) => {
  try {
    const reviews = await Review.find({ shopId: req.params.shopId })
      .populate('buyerId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    const avgRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({ reviews, avgRating: Number(avgRating), count: reviews.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/order/:orderId — check if buyer already reviewed this order
router.get('/order/:orderId', auth, buyerOnly, async (req, res) => {
  try {
    const review = await Review.findOne({ orderId: req.params.orderId, buyerId: req.user.id });
    res.json({ review: review || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
