const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }, // ပုံ Link ထည့်ဖို့
  available: { type: Boolean, default: true } // ပစ္စည်းပြတ်/မပြတ် စစ်ဖို့
}, { timestamps: true });

module.exports = mongoose.model('Menu', MenuSchema);