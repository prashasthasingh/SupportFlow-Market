const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  sizes: [{ type: String }],
  photoUrl: { type: String, default: '' },
  inStock: { type: Boolean, default: true },
  description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
