const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Follow = require('../models/Follow');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

const router = express.Router();

// All admin routes require auth + adminOnly
router.use(auth, adminOnly);

// GET /api/admin/overview
router.get('/overview', async (req, res) => {
  try {
    // Basic counts
    const [totalShops, totalBuyers, totalOrders, orderAgg] = await Promise.all([
      Shop.countDocuments(),
      User.countDocuments({ role: 'buyer' }),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, totalValue: { $sum: '$totalAmount' } } }]),
    ]);

    const totalOrderValue = orderAgg[0]?.totalValue || 0;

    // Shops table: name, market, productCount, orderCount, lastProductUpdate
    const shops = await Shop.find().lean();
    const shopIds = shops.map((s) => s._id);

    const [productCounts, orderCounts, lastProducts] = await Promise.all([
      Product.aggregate([
        { $match: { shopId: { $in: shopIds } } },
        { $group: { _id: '$shopId', count: { $sum: 1 }, lastUpdated: { $max: '$updatedAt' } } },
      ]),
      Order.aggregate([
        { $match: { shopId: { $in: shopIds } } },
        { $group: { _id: '$shopId', count: { $sum: 1 } } },
      ]),
    ]);

    const productMap = Object.fromEntries(productCounts.map((p) => [p._id.toString(), p]));
    const orderMap = Object.fromEntries(orderCounts.map((o) => [o._id.toString(), o.count]));

    const shopsTable = shops.map((s) => ({
      _id: s._id,
      name: s.name,
      marketName: s.marketName,
      productCount: productMap[s._id.toString()]?.count || 0,
      orderCount: orderMap[s._id.toString()] || 0,
      lastProductUpdate: productMap[s._id.toString()]?.lastUpdated || null,
    }));

    // Funnel: total follows → buyers with ≥1 order → buyers with ≥2 orders
    const [totalFollows, buyersWithOrders] = await Promise.all([
      Follow.countDocuments(),
      Order.aggregate([
        { $group: { _id: '$buyerId', count: { $sum: 1 } } },
      ]),
    ]);

    const buyersWithAtLeastOne = buyersWithOrders.length;
    const buyersWithAtLeastTwo = buyersWithOrders.filter((b) => b.count >= 2).length;

    // Order volume over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const orderVolume = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          value: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      stats: { totalShops, totalBuyers, totalOrders, totalOrderValue },
      shopsTable,
      funnel: { totalFollows, buyersWithAtLeastOne, buyersWithAtLeastTwo },
      orderVolume,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
