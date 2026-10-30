const express = require('express');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const { auth, sellerOnly, buyerOnly } = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/orders — buyer places an order
router.post('/', auth, buyerOnly, async (req, res) => {
  try {
    const { shopId, items, note } = req.body;
    if (!shopId || !items || !items.length) {
      return res.status(400).json({ message: 'shopId and items are required' });
    }
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create Razorpay order (amount in paise)
    let razorpayOrderId = '';
    try {
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // paise
        currency: 'INR',
        receipt: `sfm_${Date.now()}`,
      });
      razorpayOrderId = rzpOrder.id;
    } catch (rzpErr) {
      console.warn('[Razorpay] Order creation failed:', rzpErr.message);
      // Continue without payment if Razorpay not configured
    }

    const order = await Order.create({
      buyerId: req.user.id,
      shopId,
      items,
      totalAmount,
      note: note || '',
      razorpayOrderId,
      paymentStatus: razorpayOrderId ? 'pending' : 'pending',
    });

    // Notify seller in real time
    const io = req.app.get('io');
    if (io) {
      io.to(`seller_${shopId}`).emit('new_order', order);
    }

    res.status(201).json({
      order,
      razorpayOrderId,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/seller — seller's incoming orders
router.get('/seller', auth, sellerOnly, async (req, res) => {
  try {
    const shop = await Shop.findOne({ ownerId: req.user.id });
    if (!shop) return res.status(404).json({ message: 'No shop found' });
    const orders = await Order.find({ shopId: shop._id })
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/buyer — buyer's own orders
router.get('/buyer', auth, buyerOnly, async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.user.id })
      .populate('shopId', 'name marketName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/status — seller updates order status
router.patch('/:id/status', auth, sellerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['accepted', 'packed', 'dispatched', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const shop = await Shop.findOne({ ownerId: req.user.id });
    if (!shop || String(order.shopId) !== String(shop._id)) {
      return res.status(403).json({ message: 'Not your order' });
    }

    order.status = status;
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`order_${order._id}`).emit('order_status_updated', {
        orderId: order._id,
        status: order.status,
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
