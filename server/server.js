const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

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
app.post("/order", (req, res) => {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    orderCount = 0;
    lastResetDate = today;
  }

  orderCount++;
  const formattedId = orderCount.toString().padStart(4, "0");

  const order = {
    id: formattedId,
    ...req.body,
    status: "pending",
    createdAt: new Date()
  };

  orders.push(order);
  
  // အရေးကြီး: API ကနေပဲ io.emit လုပ်မယ်။ Socket ထဲမှာ ထပ်မလုပ်တော့ဘူး (Double ID မဖြစ်အောင်)
  io.emit("orderUpdate", order); 

  res.json({ success: true, orderId: formattedId, order });
});

app.post("/order/status", (req, res) => {
  const { id, status } = req.body;

  const index = orders.findIndex(o => o.id === String(id));

  if (index !== -1) {

    // 🔴 CANCEL → DELETE ORDER
    if (status === "cancel") {
      const deletedOrder = orders[index];

      // remove from array
      orders.splice(index, 1);

      // notify frontend
      io.emit("orderUpdate", { ...deletedOrder, status: "cancel" });

      return res.json({ success: true, message: "Order cancelled" });
    }

    // 🟢 NORMAL UPDATE
    orders[index].status = status;

    io.emit("orderUpdate", orders[index]);

    return res.json({ success: true });
  }

  res.status(404).json({ success: false });
});

app.get("/orders", (req, res) => res.json(orders));

// ======================
// SOCKET SETUP
// ======================
const io = new Server(server, { cors: { origin: "*" } });

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