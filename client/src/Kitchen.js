import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./kitchen.css";

const API_BASE = "https://bs-pos-system-1.onrender.com";
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
  
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("🟢 Socket Connected to Kitchen");
    });

    socket.on("disconnect", () => setIsConnected(false));

    // အော်ဒါအသစ်ရော Status Update ရော ဖမ်းမယ့်နေရာ
    socket.on("orderUpdate", (data) => {
      console.log("📩 Socket Data Received:", data); // Browser Console မှာ ဒါလေးပေါ်လားကြည့်ပါ

      // data ထဲမှာ id မပါရင် ဘာမှမလုပ်ဘဲ ကျော်သွားမယ် (Error မတက်အောင်)
      if (!data || (!data.id && !data._id)) return;

      const orderId = data.id || data._id; // MongoDB ID နဲ့ Regular ID နှစ်မျိုးလုံးကို စစ်ပေးတာပါ

      setOrders((prev) => {
        // ၁။ ငွေရှင်းပြီးသားဆိုရင် ဖယ်မယ်
        if (data.status === "paid") {
          return prev.filter(o => (o.id || o._id) !== orderId);
        }

        // ၂။ ရှိပြီးသား အော်ဒါဆိုရင် Update လုပ်မယ်
        const exists = prev.find(o => (o.id || o._id) === orderId);
        if (exists) {
          console.log("🔄 Updating existing order:", orderId);
          return prev.map(o => (o.id || o._id) === orderId ? { ...o, ...data } : o);
        }

        // ၃။ အော်ဒါအသစ်ဆိုရင် အပေါ်ဆုံးက ထည့်မယ်
        console.log("🆕 Adding new order to list");
        showNotification(data);
        return [data, ...prev];
      });
    });

    // updateOrder event လာရင်လည်း အလုပ်လုပ်အောင် orderUpdate ဆီ ပြန်ပို့ပေးလိုက်တာပါ
    socket.on("updateOrder", (data) => {
      socket.emit("orderUpdate", data); 
    });

    return () => {
      clearInterval(timerInterval);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("orderUpdate");
      socket.off("updateOrder");
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
    // id ဆိုတာ MongoDB ရဲ့ _id ဖြစ်နေနိုင်သလို menuData ရဲ့ id လည်း ဖြစ်နေနိုင်လို့ နှစ်ခုလုံးကို handle လုပ်တာပါ
    console.log("Updating Status for ID:", id); 

    try {
      const res = await axios.post(`${API_BASE}/order/status`, { id, status });
      
      if (res.data.success) {
        // ၁။ Server ကနေတဆင့် Admin နဲ့ တခြား page တွေကို အချက်ပေးမယ်
        socket.emit("updateOrder", { id, status });

        // ၂။ ကိုယ့် screen မှာတင် list ထဲကနေ တန်းပြောင်းသွားအောင် (သို့) ပျောက်သွားအောင် လုပ်မယ်
        setOrders((prev) => 
          prev.map((o) => {
            const currentOrderId = o._id || o.id; // ID အမျိုးအစား နှစ်ခုလုံးကို စစ်တယ်
            return currentOrderId === id ? { ...o, status } : o;
          })
        );
      }
    } catch (err) {
      console.error("Update status error:", err);
      alert("Status ပြောင်းလို့ မရပါဘူး Bro။ Console မှာ error တစ်ချက်စစ်ပေးပါ။");
    }
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
                    <button className="finish" onClick={() => updateStatus(order._id || order.id, "done")}>Finish</button>
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