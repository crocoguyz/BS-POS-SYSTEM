import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./kitchen.css";

const API_BASE = "https://bs-pos-system.onrender.com";
const socket = io(API_BASE);

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const [newOrderNoti, setNewOrderNoti] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const audioPlayer = useRef(null);

  useEffect(() => {
    document.title = "Kitchen Dashboard";
    loadOrders();
    const timerInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
  
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    socket.on("orderUpdate", (order) => {
  setOrders((prev) => {
    // အော်ဒါက list ထဲမှာ ရှိပြီးသားဆိုရင် ထပ်မထည့်အောင် စစ်တာပါ
    if (prev.find(o => o.id === order.id)) return prev;
    return [order, ...prev];
  });
  showNotification(order);
});

    // --- FIX: Loop ဖြစ်တာကို ဒီနေရာမှာ တားလိုက်တာပါ ---
    socket.on("updateOrder", ({ id, status }) => {
      setOrders((prev) => {
        // အကယ်၍ status က 'paid' ဖြစ်သွားရင် Kitchen list ထဲကနေ လုံးဝဖယ်ထုတ်လိုက်မယ်
        if (status === "paid") {
          return prev.filter(o => o.id !== id);
        }
        // တခြား status (cooking, done) ဆိုရင်တော့ list ထဲမှာ update လုပ်မယ်
        return prev.map((o) => (o.id === id ? { ...o, status } : o));
      });
    });

    

    return () => {
      clearInterval(timerInterval);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("newOrder");
      socket.off("updateOrder");
      clearInterval(timerInterval);
    };
  }, []);

  const loadOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/orders`);
      // Initial load မှာတင် paid ဖြစ်ပြီးသားတွေကို ဖယ်ထားမယ်
      setOrders(res.data.filter(o => o.status !== "paid"));
    } catch (err) { console.error("Load error"); }
  };

  const showNotification = (order) => {
    setNewOrderNoti(`New Order: #${order.id} (Table ${order.table})`);
    if (audioPlayer.current) {
      audioPlayer.current.play().catch(() => console.warn("Autoplay blocked"));
    }
    setTimeout(() => setNewOrderNoti(null), 5000);
  };

  const getWaitTime = (timestamp) => {
    const diff = Math.floor((currentTime - new Date(timestamp).getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return { mins, secs, isLate: mins >= 15 };
  };

  const updateStatus = async (id, status) => {
    await axios.post(`${API_BASE}/order/status`, { id, status });
    // Status update ပြီးရင် Admin ဘက်ကိုလည်း socket ကနေ လှမ်းသိစေဖို့ signal လွှင့်မယ်
    socket.emit("updateOrder", { id, status });
  };

  // Quantity Summary
  const getSummary = () => {
    const summary = {};
    activeOrders.forEach(order => {
      order.items.forEach(item => {
        summary[item.name] = (summary[item.name] || 0) + item.qty;
      });
    });
    return Object.entries(summary);
  };

  // Status Filter များ
  const activeOrders = orders.filter((o) => 
    o.status !== "done" && 
    o.status !== "paid" && 
    (tab === "all" ? true : o.type === tab)
  );

  const completedOrders = orders.filter((o) => 
    o.status === "done" && 
    (tab === "all" ? true : o.type === tab)
  );

const getWaitingTime = (order) => {
    const startTime = order.createdAt || order.timestamp;
    if (!startTime) return { mins: 0, secs: 0, isLate: false };

    const diff = Math.floor((currentTime - new Date(startTime).getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    
    return { mins, secs, isLate: mins >= 15 };
  };

  const totalRevenue = orders
    .filter(o => o.status === "paid")
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <div className="kitchen-page">
      <audio ref={audioPlayer} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
        {isConnected ? "● Connected" : "● Disconnected"}
      </div>

      <header className="kitchen-central-header">
        <h1>KITCHEN DASHBOARD</h1>
        <div className="stats-row">
          <div className="revenue-chip">Daily Sales: <span>{totalRevenue.toLocaleString()} MMK</span></div>
          <div className="active-chip">Pending Orders: <span>{activeOrders.length}</span></div>
        </div>

        {getSummary().length > 0 && (
          <div className="summary-pills">
            {getSummary().map(([name, qty]) => (
              <div key={name} className="summary-pill">{name} <b>x{qty}</b></div>
            ))}
          </div>
        )}

        <div className="tab-group-center">
          {["all", "eat", "takeaway", "delivery"].map((t) => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="kitchen-split-view">
        <section className="column active-column">
          <h2 className="col-title">🔥 Active Orders</h2>
          <div className="order-scroll-area">
  {activeOrders.map((order) => {
    // ၁။ တွက်ချက်တဲ့အပိုင်း (order တစ်ခုလုံးကို ပို့ပေးပါ)
    const wait = getWaitingTime(order); 

    return (
      <div className={`modern-card ${order.status} ${wait.isLate ? 'warning' : ''}`} key={order.id}>
        <div className="m-card-header">
          <span className="m-order-id">#{order.id}</span>
          {/* ၂။ Timer ပြတဲ့အပိုင်း (wait ထဲက mins နဲ့ secs ကို ပြန်ယူသုံးပါ) */}
          <div className={`wait-timer ${wait.isLate ? 'danger' : ''}`}>
            ⏳ {wait.mins}m {wait.secs}s
          </div>
          
          
          <span className={`m-type ${order.type?.toLowerCase() || 'eat'}`}>
            {order.type?.toUpperCase() || 'EAT'}
          </span>
          <span className="m-table">Table-{order.table}</span>
        </div>
                  <div className="m-items">
                    {order.items?.map((i, idx) => (
                      <div key={idx} className="m-item-row"><b>{i.qty}x</b> {i.name}</div>
                    ))}
                  </div>
                  <div className="m-footer">
                    <button onClick={() => updateStatus(order.id, "cooking")}>Cook</button>
                    <button className="finish" onClick={() => updateStatus(order.id, "done")}>Finish</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="column done-column">
          <h2 className="col-title">✅ Completed</h2>
          <div className="order-scroll-area">
            {completedOrders.map((order) => (
              <div className="modern-card mini done" key={order.id}>
                <div className="m-card-header">
                  <span>#{order.id} (T-{order.table})</span>
                  <span className="m-price">{Number(order.total).toLocaleString()} MMK</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      {newOrderNoti && <div className="order-notification-toast">🔔 {newOrderNoti}</div>}
    </div>
  );
}