const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

let orderCount = 0;
let lastResetDate = new Date().toDateString();
let orders = [];

// API: Status Update (ဒီနေရာမှာ Array ကို သုံးထားပါတယ်)
app.post("/order/status", (req, res) => {
  const { id, status } = req.body;
  const index = orders.findIndex(o => o.id === String(id));
  if (index !== -1) {
    orders[index].status = status;
    io.emit("orderUpdate", orders[index]); // Socket နဲ့ တန်းပို့မယ်
    return res.json({ success: true });
  }
  res.status(404).json({ success: false });
});

// API: New Order
app.post("/order", (req, res) => {
  orderCount++;
  const formattedId = orderCount.toString().padStart(4, "0");
  const order = { id: formattedId, ...req.body, status: "pending" };
  orders.push(order);
  io.emit("orderUpdate", order); // Kitchen/Admin သိအောင် ပို့မယ်
  res.json({ success: true, orderId: formattedId, order });
});

app.get("/orders", (req, res) => res.json(orders));

const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  socket.on("updateOrder", (data) => io.emit("orderUpdate", data));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🔥 Running on ${PORT}`));