const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Order ID (e.g., #0001)
  table: { type: String, required: true },
  items: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  type: { type: String, enum: ["eat", "takeaway", "delivery"], default: "eat" },
  status: { 
    type: String, 
    enum: ["pending", "cooking", "done", "paid", "cancel"], 
    default: "pending" 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);