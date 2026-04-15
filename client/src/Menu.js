import React, { useState, useEffect } from "react";
import axios from "axios";
import "./menu.css";
import { io } from "socket.io-client";

const API_BASE = "https://bs-pos-system.onrender.com";
const socket = io(API_BASE);

export const menuData = [
  { id: 1, name: "Lahpet Thoke", price: 2500, cat: "Breakfast", img: "breakfast/Lahpetthoke.jpg" },
  { id: 2, name: "Mohinga", price: 3000, cat: "Breakfast", img: "breakfast/Mohinga.jpg" },
  { id: 3, name: "Nan Gyi Thoke", price: 3000, cat: "Breakfast", img: "breakfast/Nan-Gyi-Thoke.jpg" },
  { id: 4, name: "Ohn No Khao Swe", price: 3500, cat: "Breakfast", img: "breakfast/Ohn-No-Khao-Swe.jpg" },
  { id: 5, name: "Shan Noodle", price: 3000, cat: "Breakfast", img: "breakfast/Shan-Noodle.jpg" },
  { id: 6, name: "Bubble Tea", price: 2500, cat: "Drinks", img: "drinks/Bubbletea.jpg" },
  { id: 7, name: "Faluda", price: 3000, cat: "Drinks", img: "drinks/Faluda.jpg" },
  { id: 8, name: "Lime Mint Soda", price: 2000, cat: "Drinks", img: "drinks/Lime-Mint-Soda.jpg" },
  { id: 9, name: "Orange Juice", price: 2500, cat: "Drinks", img: "drinks/Orange-juice.jpg" },
  { id: 10, name: "Pineapple Juice", price: 2500, cat: "Drinks", img: "drinks/Pineapple-juice.jpg" },
  { id: 11, name: "Strawberry Milk Shake", price: 3500, cat: "Drinks", img: "drinks/Strawberry-Milk-Shake.jpg" },
  { id: 12, name: "Fish Curry 1", price: 5000, cat: "Fish", img: "fish/Fish-1.jpg" },
  { id: 13, name: "Fish Curry 2", price: 5200, cat: "Fish", img: "fish/Fish-2.jpg" },
  { id: 14, name: "Fish Curry 3", price: 5400, cat: "Fish", img: "fish/Fish-3.jpg" },
  { id: 15, name: "Fish Curry 4", price: 5600, cat: "Fish", img: "fish/Fish-4.jpg" },
  { id: 16, name: "Fish Curry 5", price: 5800, cat: "Fish", img: "fish/Fish-5.jpg" },
  { id: 17, name: "Fish Curry 6", price: 6000, cat: "Fish", img: "fish/Fish-6.jpg" },
];

export default function Menu({ onLogout }) {

  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [orderType, setOrderType] = useState("eat");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [tableNumber, setTableNumber] = useState("1");
  const [nextOrderId, setNextOrderId] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("")

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    document.title = "Restaurant Menu";

    const getTableNum = () => {
      const match = window.location.href.match(/table=(\d+)/);
      return match ? match[1] : "1";
    };
    setTableNumber(getTableNum());

    const fetchLatestId = async () => {
      try {
        const res = await axios.get(`${API_BASE}/next-id`);
        const rawId = res.data.nextId;
        const shortId = rawId.includes('#') ? rawId : `#${String(rawId).slice(-4)}`;
        setNextOrderId(shortId);
      } catch (err) {
        console.error("Error fetching initial ID");
        setNextOrderId("#0001");
      }
    };

    fetchLatestId();
  }, []); // <--- ဒီနေရာမှာ ပိုနေတဲ့ကွင်း ရှိ၊ မရှိ သေချာကြည့်ပါ (Line 65)

  const handleOpenPopup = async () => {
    try {
      const res = await axios.get(`${API_BASE}/next-id`);
      const rawId = res.data.nextId;
      const shortId = rawId.includes('#') ? rawId : `#${String(rawId).slice(-4)}`;
      
      setNextOrderId(shortId);
      setShowPopup(true);
    } catch (err) {
      console.error("Next ID error");
      setShowPopup(true);
    }
  };

  const addToCart = (item) => {
  setCart((prev) => {
    const exist = prev.find((x) => String(x.id) === String(item.id));

    if (exist) {
      return prev.map((x) =>
        String(x.id) === String(item.id)
          ? { ...x, qty: x.qty + 1 }
          : x
      );
    }

    return [...prev, { ...item, qty: 1 }];
  });
};

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x)).filter((x) => x.qty > 0));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const confirmOrder = async () => {
    if (cart.length === 0) return alert("Please add items first!");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/order`, {
        table: tableNumber,
        type: orderType,
        items: cart,
        total: total,
        orderId: nextOrderId // Popup မှာ မြင်နေရတဲ့ #000x ကို ပို့မယ်
      });

      if (res.data.success) {
        // 🔥 ဒီအပိုင်းက အရေးကြီးဆုံးပဲ
        // လက်ရှိတင်လိုက်တဲ့ ID ကို Success Modal မှာ ပြဖို့ သိမ်းထားမယ်
        setCurrentOrderId(nextOrderId); 
        
        setCart([]);
        setShowPopup(false);
        setShowSuccess(true);
        
        // 🔥 ID ကို တစ်ခု တိုးပေးမယ့် Logic
        // #0001 ထဲက 1 ကို ယူပြီး 1 ပေါင်းမယ်၊ ပြီးရင် #0002 ပြန်လုပ်မယ်
        const currentNum = parseInt(nextOrderId.replace('#', '')) || 1;
        const nextNum = `#${String(currentNum + 1).padStart(4, '0')}`;
        setNextOrderId(nextNum); 

        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      alert("Server Error! Check connection.");
    } finally {
      setLoading(false);
    }
  };// <--- confirmOrder ပိတ်တာ

  return (
    <div className="menu-container">
      <div className="menu-header">
  <h2>Our Menu</h2>

  <button className="logout-btn-simple" onClick={onLogout}>
    🚪 Logout
  </button>
</div>
      <h1 className="title" style={{ 
  fontSize: '2.8rem',      // စာသားကို အကြီးကြီးနဲ့ လန်းအောင်လုပ်တာ
  marginBottom: '40px',    // Search bar နဲ့ ဝေးဝေးခွာထားမယ်
  fontWeight: '800',
  letterSpacing: '2px'
}}>
  RESTAURANT MENU
</h1>

      {/* Success Animation Modal */}
      {showSuccess && (
  <div className="success-overlay">
    <div className="success-card">
      <div className="check-icon">✓</div>
      <h2>Order Successful!</h2>
      {/* ဒီနေရာမှာ currentOrderId ကို သုံးပါ */}
      <p>Your Order ID: {currentOrderId}</p> 
      <p>မီးဖိုချောင်သို့ Order ပို့ပြီးပါပြီ။</p>
    </div>
  </div>
)}

      <input className="search-bar" placeholder="Search dishes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      <div className="category-tabs">
        {["All", "Breakfast", "Drinks", "Fish"].map((c) => (
          <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>

      <div className="menu-grid">
        {menuData
          .filter((f) => (category === "All" ? true : f.cat === category))
          .filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((item) => (
            <div className="menu-card" key={item.id}>
              <div className="img-container">
                <img src={`/images/${item.img}`} alt={item.name} onError={(e) => { e.target.src = "https://via.placeholder.com/200?text=Food"; }} />
              </div>
              <div className="card-info">
                <h4>{item.name}</h4>
                <p>{item.price} MMK</p>
                <button className="add-btn" onClick={() => addToCart(item)}>+</button>
              </div>
            </div>
          ))}
      </div>

      {cart.length > 0 && (
        <div className="bottom-bar">
          <div>
            <strong>
  {cart.reduce((sum, item) => sum + item.qty, 0)} items ({cart.length} types)
</strong> | <span>{total} MMK</span>
          </div>
          <button className="view-order-btn" onClick={handleOpenPopup}>View Order</button>
        </div>
      )}

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{margin: '0 0 10px 0'}}>Your Order #{nextOrderId} </h3>

            {orderType === "eat" && (
    <div className="table-selector-box" style={{ marginBottom: '15px' }}>
      <label style={{ color: '#fff', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Select Table:</label>
      <select 
  value={tableNumber} 
  onChange={(e) => setTableNumber(e.target.value)}
  style={{
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    background: '#f8f7f7', // နောက်ခံကို နည်းနည်း ပိုလင်းတဲ့ မီးခိုးရောင် သုံးမယ်
    color: '#000000',     // စာသားအရောင်ကို မင်းကြိုက်တဲ့ Neon Purple ပြောင်းမယ်
    border: '2px solid #ff4757', // အနားသတ်ကို Purple လုပ်မယ်
    fontWeight: 'bold',
    fontSize: '16px',
    outline: 'none',
    cursor: 'pointer'
  }}
>
  {[...Array(10)].map((_, i) => (
    <option key={i+1} value={i+1} style={{ background: '#2a2a2a', color: '#fff' }}>
      Table {i+1}
    </option>
  ))}
</select>
    </div>
  )}
            
            <div className="order-type-selector">
              {["eat", "takeaway", "delivery"].map(t => (
                <button key={t} className={orderType === t ? "active" : ""} onClick={() => setOrderType(t)}>{t.toUpperCase()}</button>
              ))}
            </div>

            <div className="item-list-container">
              {cart.map(item => (
                <div className="list-row" key={item.id}>
                  <div>
                    <div style={{fontWeight: 'bold'}}>{item.name}</div>
                    <div style={{fontSize: '13px', color: '#ef4444'}}>{item.price * item.qty} MMK</div>
                  </div>
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, -1)}>-</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="final-total-row">
              <span>Total:</span>
              <span style={{color: '#ff4757'}}>{total} MMK</span>
            </div>

            {/* Loading ပြထားသော Confirm Button */}
            <button className="btn-confirm" onClick={confirmOrder} disabled={loading}>
              {loading ? "Confirming..." : "Confirm & Send"}
            </button>
            <button className="btn-close" onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}