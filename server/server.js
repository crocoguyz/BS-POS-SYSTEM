const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const orderRoutes = require("./routes/orders");

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

// 1. CORS ကို အကုန်ဖွင့်ထားမယ်
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

let orderCount = 0;
let lastResetDate = new Date().toDateString();
let orders = [];

// ======================
// LOGIN ROUTE
// ======================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const users = {
    admin: {
      name: "Aung Kyaw Hein",
      role: "admin",
    },
    cashier: {
      name: "Koko",
      role: "cashier",
    },
    kitchen: {
      name: "Chef John",
      role: "kitchen",
    },
    waiter: {
      name: "Waiter A",
      role: "waiter",
    },
  };

  // simple password rule (now all = 123 for testing)
  if (users[username] && password === "123") {
    return res.json({
      success: true,
      user: users[username],
    });
  }

  return res.status(401).json({
    success: false,
    message: "Username/Password မှားနေပါသည်",
  });
});
// ======================
// ORDER ROUTES
// ======================
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

// 2. Order အသစ် သိမ်းတဲ့ API
app.post("/api/orders", (req, res) => {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    orderCount = 0;
    lastResetDate = today;
  }

  orderCount++;
  const formattedId = `#${orderCount.toString().padStart(4, "0")}`;

  const order = {
    id: formattedId,
    ...req.body,
    status: "pending",
    createdAt: new Date()
  };

  orders.push(order);
  
  // ✅ Kitchen Dashboard ဆီ တန်းလွှင့်မယ်
  io.emit("orderUpdate", order); 

  res.json({ success: true, orderId: formattedId, order });
});

// 3. Status ပြောင်းတဲ့ API
app.post("/api/orders/status", (req, res) => {
  const { id, status } = req.body;
  const index = orders.findIndex(o => o.id === String(id));

  if (index !== -1) {
    if (status === "cancel") {
      const deletedOrder = orders[index];
      orders.splice(index, 1);
      io.emit("orderUpdate", { ...deletedOrder, status: "cancel" });
      return res.json({ success: true, message: "Order cancelled" });
    }
    orders[index].status = status;
    io.emit("orderUpdate", orders[index]);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false });
});

app.get("/api/orders", (req, res) => res.json(orders));

// ======================
// SOCKET SETUP
// ======================


io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);
  
  // Status ပြောင်းတာကို socket ကနေ တိုက်ရိုက်လာရင်လည်း handle လုပ်မယ်
  socket.on("updateOrder", (data) => {
    const index = orders.findIndex(o => o.id === String(data.id));
    if (index !== -1) {
      orders[index].status = data.status;
      io.emit("orderUpdate", orders[index]);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🔥 Server running on port ${PORT}`);
});