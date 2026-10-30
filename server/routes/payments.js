const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const { auth, buyerOnly } = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/verify — called by frontend after Razorpay checkout success
// Verifies signature client-side style (no webhook required for test mode demo)
router.post('/verify', auth, buyerOnly, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      // Mark as failed
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Mark order as paid
    const order = await Order.findByIdAndUpdate(
      orderId,
      { paymentStatus: 'paid', razorpayPaymentId: razorpay_payment_id },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Notify seller of payment
    const io = req.app.get('io');
    if (io) {
      io.to(`seller_${order.shopId}`).emit('order_paid', {
        orderId: order._id,
        paymentStatus: 'paid',
      });
    }

    res.json({ message: 'Payment verified', order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/payments/webhook — Razorpay server-side webhook (optional for production)
// Must be registered in Razorpay dashboard with your server's public URL
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');
      if (signature !== expectedSig) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === 'payment.captured') {
      const paymentId = event.payload.payment.entity.id;
      const rzpOrderId = event.payload.payment.entity.order_id;

      await Order.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId },
        { paymentStatus: 'paid', razorpayPaymentId: paymentId }
      );
    }

    if (event.event === 'payment.failed') {
      const rzpOrderId = event.payload.payment.entity.order_id;
      await Order.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId },
        { paymentStatus: 'failed' }
      );
    }

    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
