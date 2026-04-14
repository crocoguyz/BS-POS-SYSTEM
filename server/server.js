const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// LOGIN ROUTE (Bro တောင်းထားတဲ့ Login ပိုင်း)
// ======================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "123") {
    res.json({ success: true, user: { name: "Aung Kyaw Hein", role: "admin" } });
  } else if (username === "cashier" && password === "123") {
    res.json({ success: true, user: { name: "Koko", role: "cashier" } });
  } else {
    res.status(401).json({ success: false, message: "Username သို့မဟုတ် Password မှားနေပါသည်။" });
  }
});

// ======================
// DATA STORAGE & COUNTER
// ======================
let orderCount = 0;
let lastResetDate = new Date().toDateString();
let orders = [];
let completedOrders = [];

// Next Order ID ကြည့်ရန်
app.get("/next-id", (req, res) => {
  const nextId = (orderCount + 1).toString().padStart(4, "0");
  res.json({ nextId });
});

// ======================
// SOCKET SETUP
// ======================
const io = new Server(server, {
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 New Connection established:", socket.id);

  // ၁။ Menu က အော်ဒါအသစ်ပို့လိုက်ရင် (Menu.js -> Server)
  socket.on("newOrder", (orderData) => {
    console.log("📦 New Order Received:", orderData);
    
    // Kitchen နဲ့ Admin ဆီကို Refresh မလိုဘဲ တန်းပေါ်လာအောင် ပို့ပေးမယ်
    io.emit("orderUpdate", orderData); 
  });

  // ၂။ Status ပြောင်းလဲမှုများကို ကိုင်တွယ်မယ် (Kitchen/Admin -> Server)
  // ဥပမာ - Kitchen က Finish လုပ်တာ ဒါမှမဟုတ် Admin က Paid လုပ်တာ
  socket.on("updateOrder", (data) => {
    console.log("🔄 Order Status Updated:", data);

    // Kitchen.js မှာ socket.on("orderUpdate") နဲ့ စောင့်နေတာရှိရင် ဒါက အလုပ်လုပ်မယ်
    io.emit("orderUpdate", data); 

    // Admin.js မှာ socket.on("updateOrder") နဲ့ စောင့်နေတာရှိရင် ဒါက အလုပ်လုပ်မယ်
    // နာမည် နှစ်မျိုးလုံးနဲ့ လွှတ်ပေးထားတာက ပိုသေချာပါတယ်
    io.emit("updateOrder", data); 
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});

// ======================
// CREATE ORDER (အရင် code ထဲက logic အကုန် ပြန်ပေါင်းပေးထားပါတယ်)
// ======================
app.post("/order", (req, res) => {
  try {
    const today = new Date().toDateString();

    // ည ၁၂ နာရီကျော်ရင် counter reset လုပ်မယ်
    if (today !== lastResetDate) {
      orderCount = 0;
      lastResetDate = today;
    }

    orderCount++;
    const formattedId = orderCount.toString().padStart(4, "0");

    const order = {
      id: formattedId,
      table: req.body.table,
      items: req.body.items,
      total: req.body.total,
      status: "pending",
      type: req.body.type || "eat", 
      timestamp: req.body.timestamp || Date.now(),
      createdAt: new Date()
    };

    orders.push(order);
    console.log(`🔥 NEW ORDER: #${formattedId} (Type: ${order.type}, Table: ${order.table})`);

    // Kitchen ဆီကို live လှမ်းပို့မယ်
    io.emit("newOrder", order);

    res.json({
      success: true,
      orderId: formattedId,
      order: order
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

// All Orders ဆွဲထုတ်ရန်
app.get("/orders", (req, res) => {
  res.json(orders);
});

// Report ထုတ်ရန်
app.get("/report", (req, res) => {
  let totalSales = 0;
  completedOrders.forEach((o) => {
    totalSales += o.total;
  });
  res.json({ totalSales, completedOrders });
});

// ======================
// START SERVER (Render အတွက် Port ပြင်ထားပါတယ်)
// ======================
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

app.post("/order/status", async (req, res) => {
  try {
    const { id, status } = req.body;
    
    // Kitchen က ပို့လိုက်တဲ့ "0001" ကို string အနေနဲ့ database မှာ ရှာမယ်
    const updatedOrder = await Order.findOneAndUpdate(
      { id: String(id) }, // ID ကို String သေချာပြောင်းပြီး ရှာတာပါ
      { $set: { status: status } },
      { new: true }
    );

    if (updatedOrder) {
      // Database မှာ အောင်မြင်ရင် Socket နဲ့ Admin ဆီ လှမ်းအော်မယ်
      io.emit("orderUpdate", updatedOrder); 
      return res.json({ success: true });
    } else {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});