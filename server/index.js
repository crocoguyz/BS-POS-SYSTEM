const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// 🟢 MongoDB Connection
const mongoURI = "mongodb://posadmin:sV40yXs4kN5JEekA@ac-spcflji-shard-00-00.rrt3ykx.mongodb.net:27017,ac-spcflji-shard-00-01.rrt3ykx.mongodb.net:27017,ac-spcflji-shard-00-02.rrt3ykx.mongodb.net:27017/POS_DB?ssl=true&replicaSet=atlas-w8bnsa-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected (Orders & Staff Ready)"))
  .catch(err => console.log("❌ Mongo Error:", err));

  // index.js ထဲမှာ ထည့်ရန်
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Database (Staff Collection) ထဲမှာ သွားရှာမယ်
        const user = await Staff.findOne({ name: username, password: password });

        if (user) {
            // ဝန်ထမ်းနာမည်နဲ့ password မှန်ရင် ဝင်ခွင့်ပေးမယ်
            return res.json({ 
                success: true, 
                message: "Login successful!", 
                user: { name: user.name, role: user.role } 
            });
        } 

        // 2. Database ထဲမှာ မရှိရင် Backup အနေနဲ့ posadmin နဲ့ စစ်မယ်
        if (username === "posadmin" && password === "apmaWBHxuf") {
            return res.json({ 
                success: true, 
                message: "Login successful!", 
                user: { name: "System Admin", role: "Owner" } 
            });
        }

        // 3. နှစ်ခုလုံး မဟုတ်ရင် မှားတယ်လို့ ပြောမယ်
        res.status(401).json({ success: false, message: "Username သို့မဟုတ် Password မှားနေသည်" });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Server အမှားတစ်ခု ဖြစ်သွားသည်" });
    }
});
// ---------------------------------------------------------
// 🟢 1. STAFF MODEL & API
// ---------------------------------------------------------
const staffSchema = new mongoose.Schema({
  name: String,
  role: String,
  status: { type: String, default: "Active" },
  createdAt: { type: Date, default: Date.now }
});
const Staff = mongoose.model("Staff", staffSchema);

app.get("/api/staff", async (req, res) => {
  const staff = await Staff.find();
  res.json(staff);
});

app.post("/api/staff", async (req, res) => {
  const newStaff = new Staff(req.body);
  await newStaff.save();
  res.status(201).json(newStaff);
});

// ---------------------------------------------------------
// 🟢 2. ORDER MODEL & API
// ---------------------------------------------------------
const orderSchema = new mongoose.Schema({
  item: String,
  price: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

app.get("/api/orders", async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

app.post("/api/orders", async (req, res) => {
  const newOrder = new Order(req.body);
  await newOrder.save();
  res.status(201).json(newOrder);
});

// ---------------------------------------------------------

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});