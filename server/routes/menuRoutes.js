const express = require("express");
const router = express.Router();
const Menu = require("../models/Menu");

// =====================
// GET ALL MENU ITEMS
// =====================
router.get("/", async (req, res) => {
  try {
    const items = await Menu.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Menu fetch failed" });
  }
});

// =====================
// ADD MENU ITEM
// =====================
router.post("/", async (req, res) => {
  try {
    const item = new Menu(req.body);
    const saved = await item.save();
    res.json({ success: true, item: saved });
  } catch (err) {
    res.status(500).json({ message: "Add menu failed" });
  }
});

// =====================
// UPDATE MENU (EDIT + OUT OF STOCK)
// =====================
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Menu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    const io = req.app.get("io");
    io.emit("menuUpdated");

    res.json({ success: true, item: updated });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// =====================
// DELETE MENU ITEM (Trash button)
// =====================
router.delete("/:id", async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;