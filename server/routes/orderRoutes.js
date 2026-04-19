const express = require("express");
const router = express.Router();
const Order = require("../models/orders"); // 👈 model ကို သေချာ လှမ်းခေါ်ပါ

// Order အသစ်တင်တဲ့ Route
router.post("/", async (req, res) => {
  try {
    const newOrder = new Order(req.body); // Frontend က ပို့လိုက်တဲ့ data ကို ယူမယ်
    const savedOrder = await newOrder.save(); // DB ထဲ သိမ်းမယ်
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error! DB သိမ်းမရပါ" });
  }
});

module.exports = router;