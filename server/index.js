
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const MenuModel = require('./models/Menu');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// 1. Create HTTP Server
const server = http.createServer(app);

// 2. Initialize Socket.io (server ကို အပေါ်မှာ ဆောက်ပြီးမှ ဒါကို ရေးရပါတယ်)
const io = new Server(server, {
  cors: {
    origin: "*", // စမ်းသပ်ဆဲကာလမှာ အကုန်လုံးကို ခွင့်ပြုထားလိုက်မယ်
    methods: ["GET", "POST"]
  }
});

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 3. MongoDB Connection
const mongoURI = "process.env.MONGO_URI;"

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

// 4. Staff Model (API အပေါ်မှာ ရှိရမယ်)
const staffSchema = new mongoose.Schema({
  name: String,
  role: String,
  password: { type: String, default: "123456" },
  status: { type: String, default: "Offline" },
  createdAt: { type: Date, default: Date.now }
});
const Staff = mongoose.model("Staff", staffSchema);

// 
// index.js (Backend)
app.get('/api/menu', async (req, res) => {
  try {
    const menus = await MenuModel.find(); // Database က data ဆွဲတာ
    res.json(menus);
  } catch (err) {
    console.error("MENU ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- Staff API များ ---

app.post("/api/staff/reset-status", async (req, res) => {
  try {
    await Staff.updateMany({}, { status: "Offline" });
    io.emit("staffUpdate");
    res.json({ success: true, message: "All staff set to Offline" });
  } catch (err) {
    console.error("Reset status error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Staff အသစ် သိမ်းဆည်းရန် (POST)
app.post("/api/staff", async (req, res) => {
    try {
        const { name, role, password, status } = req.body;
        
        // MongoDB ထဲ သိမ်းမယ်
        const newStaff = new Staff({ 
            name, 
            role, 
            password: password || "123456", 
            status: status || "Offline" 
        });
        
        await newStaff.save();
        console.log(`✅ Staff created: ${name}`);
        
        // Socket.io သုံးပြီး တခြားသူတွေကိုလည်း အသိပေးချင်ရင် (Optional)
        io.emit("staffUpdate", newStaff);
        
        res.status(201).json({ success: true, data: newStaff });
    } catch (err) {
        console.error("❌ Staff Save Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. ရှိသမျှ Staff အားလုံးကို ပြန်ထုတ်ယူရန် (GET) - ဒါမှ Refresh လုပ်ရင် ပြန်ပေါ်မှာပါ
app.get("/api/staff", async (req, res) => {
    try {
        const staffs = await Staff.find().sort({ createdAt: -1 }); // အသစ်ဆုံးကို အပေါ်တင်မယ်
        res.json(staffs);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Staff ကို ဖျက်ရန် (DELETE) - ဒါက နောက်မှ လိုလာရင် သုံးဖို့
app.delete("/api/staff/:id", async (req, res) => {
    try {
        await Staff.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Staff deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- Order Model (Staff Model အောက်မှာ ထည့်ပါ) ---
const orderSchema = new mongoose.Schema({
    orderId: String, // e.g., #0001
    table: String,
    items: Array,
    total: Number,
    status: { type: String, default: "pending" },
    type: String, // EAT, TAKEAWAY, DELIVERY
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", orderSchema);

// --- Order API များ (Login API အပေါ်မှာ ထည့်ပါ) ---

// 1. Order အသစ် တင်ရန် (POST)
app.post("/api/orders", async (req, res) => {
    try {
        const lastOrder = await Order.findOne().sort({ createdAt: -1 });
        let nextId = 1;
        if (lastOrder && lastOrder.orderId) {
            nextId = parseInt(lastOrder.orderId.replace("#", "")) + 1;
        }
        const formattedId = `#${nextId.toString().padStart(4, "0")}`;

        const newOrder = new Order({
            ...req.body,
            orderId: formattedId
        });

        await newOrder.save();
        
        // Kitchen ကို ချက်ချင်း အသိပေးမယ်
        io.emit("orderUpdate", newOrder);
        
        res.status(201).json({ success: true, orderId: formattedId, order: newOrder });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. ရှိသမျှ Order အားလုံးကို ထုတ်ရန် (GET) - Kitchen Dashboard အတွက်
app.get("/api/orders/next-id", async (req, res) => {
  try {
    // 1. Database ထဲမှာ အနောက်ဆုံးသွင်းထားတဲ့ Order ကို ရှာမယ်
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastOrder && lastOrder.orderId) {
      // 2. ရှိပြီးသား ID (#0002) ထဲက နံပါတ်ကိုပဲ ဆွဲထုတ်မယ်
      const lastNumber = parseInt(lastOrder.orderId.replace("#", ""));
      nextNumber = lastNumber + 1;
    }

    // 3. နံပါတ်သစ်ကို Format ပြန်လုပ်မယ် (e.g., #0003)
    const formattedId = `#${nextNumber.toString().padStart(4, "0")}`;
    
    res.json({ nextId: formattedId });
  } catch (err) {
    console.error("Next ID Error:", err);
    res.status(500).json({ nextId: "#0001" });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Orders Load Error:", err);
    res.status(500).json([]);
  }
});

// 3. Order Status ပြောင်းရန် (PATCH/POST)
app.post("/api/orders/status", async (req, res) => {
    try {
        const { id, status } = req.body;
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: id }, 
            { status: status }, 
            { new: true } // update ဖြစ်ပြီးသား data အသစ်ကို ပြန်ယူမယ်
        );
        
        if (updatedOrder) {
            // ၁။ အော်ဒါ တစ်ခုလုံးစာ data ကို socket ကနေ လွှတ်လိုက်မယ်
            // ဒါမှ Admin ဘက်က table နံပါတ်တွေ၊ ဈေးနှုန်းတွေ အကုန်သိမှာ
            io.emit("orderUpdate", updatedOrder); 

            // ၂။ Frontend ဆီကို success ဖြစ်ကြောင်းနဲ့ update ဖြစ်သွားတဲ့ data ကို ပြန်ပို့မယ်
            res.json({ 
                success: true, 
                updatedOrder: updatedOrder 
            });
        } else {
            res.status(404).json({ success: false, message: "Order not found" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. Login API
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Login Request incoming:", { username, password });

  try {
    const user = await Staff.findOne({ name: username, password: password });

    if (user) {
      user.status = "Active";
      await user.save();

      io.emit("staffUpdate");

      console.log("✅ Match found in Database!");
      return res.json({
        success: true,
        user: { name: user.name, role: user.role }
      });
    }

    if (username === "posadmin" && password === "123456") {
      console.log("✅ Backup Admin Login Success!");
      return res.json({
        success: true,
        user: { name: "System Admin", role: "owner" }
      });
    }

    console.log("❌ Login Failed: Credentials do not match.");
    return res.status(401).json({
      success: false,
      message: "Username သို့မဟုတ် Password မှားနေသည်"
    });

  } catch (err) {
    console.error("❌ Server Error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/logout", async (req, res) => {
  try {
    const { name } = req.body;

    const user = await Staff.findOne({ name });

    if (user) {
      user.status = "Offline";
      await user.save();
      io.emit("staffUpdate");
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Logout error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use('/uploads', express.static('uploads'));

// API Route (Add New Dish)
app.post('/api/menu', upload.single('image'), async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const newItem = new MenuModel({
      name,
      price: Number(price),
      category,
      image: req.file ? `/uploads/${req.file.filename}` : "" 
    });
    await newItem.save();
    res.json({ success: true, data: newItem });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 ဒီ line မရှိလို့ မင်း bug ဖြစ်နေတာ
    const { name, price, category, available } = req.body;

    const updatedMenu = await MenuModel.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(price && { price }),
        ...(category && { category }), // 🔥 cat မဟုတ်တော့ဘူး
        ...(available !== undefined && { available })
      },
      { new: true }
    );

    

    if (!updatedMenu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    res.json({ success: true, data: updatedMenu });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// 6. Socket.io Logic
io.on("connection", (socket) => {
  console.log("⚓ A user connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("👋 User disconnected");
  });
});

// 👉 GLOBAL EVENT (IMPORTANT)
const emitMenuUpdate = () => {
  io.emit("menuUpdate"); // everyone gets update
};

module.exports = { io, emitMenuUpdate };

// 7. Server Start (app.listen မဟုတ်ဘဲ server.listen သုံးရမယ်)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});