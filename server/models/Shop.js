const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  marketName: { type: String, required: true, trim: true },
  qrToken: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
