const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

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

// 3. MongoDB Connection
const mongoURI = "mongodb://posadmin:sV40yXs4kN5JEekA@ac-spcflji-shard-00-00.rrt3ykx.mongodb.net:27017,ac-spcflji-shard-00-01.rrt3ykx.mongodb.net:27017,ac-spcflji-shard-00-02.rrt3ykx.mongodb.net:27017/POS_DB?ssl=true&replicaSet=atlas-w8bnsa-shard-0&authSource=admin&appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

// 4. Staff Model (API အပေါ်မှာ ရှိရမယ်)
const staffSchema = new mongoose.Schema({
  name: String,
  role: String,
  password: { type: String, default: "123456" },
  status: { type: String, default: "Active" },
  createdAt: { type: Date, default: Date.now }
});
const Staff = mongoose.model("Staff", staffSchema);

// --- Staff API များ ---

// 1. Staff အသစ် သိမ်းဆည်းရန် (POST)
app.post("/api/staff", async (req, res) => {
    try {
        const { name, role, password, status } = req.body;
        
        // MongoDB ထဲ သိမ်းမယ်
        const newStaff = new Staff({ 
            name, 
            role, 
            password: password || "123456", 
            status: status || "Active" 
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
    
    // Debug လုပ်ဖို့ Terminal မှာ ပြခိုင်းမယ်
    console.log("Login Request incoming:", { username, password });

    try {
        // 1. အရင်ဆုံး Database ထဲမှာ ရှာမယ်
        const user = await Staff.findOne({ name: username, password: password });
        
        if (user) {
            console.log("✅ Match found in Database!");
            return res.json({ 
                success: true, 
                user: { name: user.name, role: user.role } 
            });
        } 

        // 2. Database မှာ မရှိရင် Backup Admin နဲ့ စစ်မယ်
        // 🔥 အရေးကြီး: စာလုံးပေါင်း သေချာပါစေ (posadmin / 123456)
        if (username === "posadmin" && password === "123456") {
            console.log("✅ Backup Admin Login Success!");
            return res.json({ 
                success: true, 
                user: { name: "System Admin", role: "owner" } 
            });
        }

        // 3. နှစ်ခုလုံး မကိုက်ရင် 401 ပေးမယ်
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

// 6. Socket.io Logic
io.on("connection", (socket) => {
  console.log("⚓ A user connected:", socket.id);
  socket.on("disconnect", () => console.log("👋 User disconnected"));
});

// 7. Server Start (app.listen မဟုတ်ဘဲ server.listen သုံးရမယ်)
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});