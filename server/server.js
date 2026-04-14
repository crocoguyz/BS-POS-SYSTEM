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
// ORDER COUNTER LOGIC (ည ၁၂ နာရီကျော်ရင် Reset ဖြစ်ရန်)
// ======================
let orderCount = 0;
let lastResetDate = new Date().toDateString();

// အပေါ်ဆုံးနားက orderCount အောက်မှာ ဒါလေး ထပ်ထည့်ပါ
app.get("/next-id", (req, res) => {
  const nextId = (orderCount + 1).toString().padStart(4, "0");
  res.json({ nextId });
});

// ======================
// SOCKET SETUP
// ======================
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ======================
// DATA STORAGE
// ======================
let orders = [];
let completedOrders = [];

// ======================
// SOCKET CONNECT
// ======================
io.on("connection", (socket) => {
  console.log("👨‍🍳 Kitchen connected");
});

// ======================
// CREATE ORDER
// ======================
app.post("/order", (req, res) => {
  try {
    const today = new Date().toDateString();

    // ရက်စွဲပြောင်းသွားရင် (ည ၁၂ နာရီကျော်ရင်) နံပါတ်ပြန်စမယ်
    if (today !== lastResetDate) {
      orderCount = 0;
      lastResetDate = today;
      console.log("📅 New day started. Counter reset to #0001");
    }

    orderCount++;
    const formattedId = orderCount.toString().padStart(4, "0"); // 0001, 0002...

    const order = {
      id: formattedId, // ORD-1234 အစား 0001 ကို သုံးလိုက်တာပါ
      ...req.body,
      status: "pending",
      createdAt: new Date()
    };

    orders.push(order);

    console.log(`🔥 NEW ORDER: #${formattedId} (Table: ${req.body.table})`);

    // Kitchen ဆီကို live လှမ်းပို့မယ်
    io.emit("newOrder", order);

    res.json({
      success: true,
      orderId: formattedId, // Frontend Menu.js ဆီကို ID ပြန်ပို့ပေးလိုက်တာ
      order: order
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false });
  }
});

// ======================
// GET ALL ORDERS
// ======================
app.get("/orders", (req, res) => {
  res.json(orders);
});

// ======================
// UPDATE STATUS
// ======================
app.post("/order", (req, res) => {
  try {
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
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
      // --- ဒီနှစ်ကြောင်းကို ထပ်ထည့်ပေးလိုက်ပါ ---
      type: req.body.type || "eat", 
      timestamp: req.body.timestamp || Date.now() 
    };

    orders.push(order);
    console.log(`🔥 NEW ORDER: #${formattedId} (Type: ${order.type}, Table: ${order.table})`);

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
// ======================
// REPORT
// ======================
app.get("/report", (req, res) => {
  let totalSales = 0;
  completedOrders.forEach((o) => {
    totalSales += o.total;
  });

  res.json({
    totalSales,
    completedOrders
  });
});

// ======================
// START SERVER
// ======================
server.listen(5000, "0.0.0.0", () => {
  console.log("🔥 Server running on http://192.168.100.175:5000");
});