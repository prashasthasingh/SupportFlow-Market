const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
}, { timestamps: true });

// Prevent duplicate follows
followSchema.index({ buyerId: 1, shopId: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);
