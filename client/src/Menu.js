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

export default function Menu() {
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [orderType, setOrderType] = useState("eat");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [tableNumber, setTableNumber] = useState("1");
  const [nextOrderId, setNextOrderId] = useState("");
  
  // အသစ်ထည့်ထားသော State များ
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    document.title = "Restaurant Menu";
    const getTableNum = () => {
      const fullUrl = window.location.href;
      const match = fullUrl.match(/table=(\d+)/);
      return match ? match[1] : "1";
    };
    setTableNumber(getTableNum());
  }, []);

  const handleOpenPopup = async () => {
    try {
      const res = await axios.get(`${API_BASE}/next-id`);
      setNextOrderId(res.data.nextId);
      setShowPopup(true);
    } catch (err) {
      console.error("Next ID error");
      setShowPopup(true);
    }
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const exist = prev.find((x) => x.id === item.id);
      if (exist) return prev.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
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
      });

      if (res.data.success) {
  socket.emit("newOrder", { 
    id: res.data.order?.id || res.data.id || nextOrderId, // ID ကို သေချာပါအောင် ထည့်တာပါ
    table: tableNumber, 
    items: cart, 
    type: orderType,
    total: total,
    status: "pending",
    createdAt: new Date()
  });

        setCart([]);
        setShowPopup(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) { 
      alert("Server Error! Check connection."); 
    } finally {
      setLoading(false);
  }; // <--- ဒီနေရာမှာ လက်သည်းကွင်း တစ်ခုပဲ ရှိရပါမယ်
    
    setLoading(true); // Loading စတင်မယ်
    try {
      const res = await axios.post(`${API_BASE}/order`, {
        table: tableNumber,
        type: orderType,
        items: cart,
        total: total,
      });

      if (res.data.success) {
        setCart([]);
        setShowPopup(false);
        setShowSuccess(true); // Animation ပြမယ်
        
        // ၃ စက္ကန့်ကြာရင် ပိတ်မယ်
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) { 
      alert("Server Error! Check connection."); 
    } finally {
      setLoading(false); // Loading ရပ်မယ်
    }
  };

  return (
    <div className="menu-container">
      <h1 className="title">Restaurant Menu</h1>
      <p className="info" style={{color: '#ff4757', fontWeight: 'bold'}}>Table {tableNumber}</p>

      {/* Success Animation Modal */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="check-icon">✓</div>
            <h2>Order Successful!</h2>
            <p>Your Order ID: #{nextOrderId}</p>
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
            <strong>{cart.length} Items</strong> | <span>{total} MMK</span>
          </div>
          <button className="view-order-btn" onClick={handleOpenPopup}>View Order</button>
        </div>
      )}

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{margin: '0 0 10px 0'}}>Your Order #{nextOrderId} (Table {tableNumber})</h3>
            
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
  );
}