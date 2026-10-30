const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 500 },
}, { timestamps: true });

// Ensure one review per order
reviewSchema.index({ orderId: 1 }, { unique: true });
reviewSchema.index({ shopId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
