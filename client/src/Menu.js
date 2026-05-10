import React, { useState, useEffect } from "react";
import axios from "axios";
import "./menu.css";
import { io } from "socket.io-client";
import { useLang } from "./LanguageContext";

const SERVER_URL = process.env.REACT_APP_API_URL || "https://bs-pos-system.onrender.com";

const getMenuImage = (image) => {
  if (!image || image.trim() === "") {
    return "/no-image.png";
  }

  if (image.startsWith("data:image")) {
    return image;
  }

  if (image.startsWith("http")) {
    return image;
  }

  if (image.startsWith("/uploads")) {
    return `${SERVER_URL}${image}`;
  }

  return image;
};

const categoryNameMM = {
  Breakfast: "မနက်စာ",
  Drink: "အအေး",
  Lunch: "နေ့လယ်စာ",

  // old data normalize
  Drinks: "အအေး",
  "အချိုရည်": "အအေး",
  "အအေး": "အအေး",
  "မနက်စာ": "မနက်စာ",
  "နေ့လယ်စာ": "နေ့လယ်စာ",
};

const getItemCategory = (item, lang) => {
  const rawCat =
    item.category_mm ||
    item.category_en ||
    item.category ||
    "";

  if (lang === "mm") {
    return categoryNameMM[rawCat] || rawCat;
  }

  // English mode normalize
  if (rawCat === "Drinks") return "Drink";
  if (rawCat === "Drink") return "Drink";
  if (rawCat === "အချိုရည်") return "Drink";
  if (rawCat === "အအေး") return "Drink";
  if (rawCat === "မနက်စာ") return "Breakfast";
  if (rawCat === "နေ့လယ်စာ") return "Lunch";

  return rawCat;
};

const getItemName = (item, lang) => {
  if (lang === "mm") {
    return item.name_mm || item.name || item.name_en || "";
  }

  return item.name_en || item.name_mm || item.name || "";
};

const API_BASE = `${SERVER_URL}/api/orders`
const socket = io(SERVER_URL, {
  transports: ["polling", "websocket"],
  reconnection: true,
});;



export default function Menu({ user, onLogout }) {
  const { t, lang, setLang } = useLang();
  const [dishes, setDishes] = useState([]);
  const [cart, setCart] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [orderType, setOrderType] = useState("eat");
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [tableNumber, setTableNumber] = useState("1");
  const [nextOrderId, setNextOrderId] = useState("");
  const [currentOrderId, setCurrentOrderId] = useState("")
  const [categories, setCategories] = useState([]);;
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNote, setOrderNote] = useState("");

  useEffect(() => {
  setCategory("All");
}, [lang]);

  useEffect(() => {
    document.title = "Restaurant Menu";

    const fetchMenu = async () => {
      try {
        const res = await axios.get(`${SERVER_URL}/api/menu`)
        console.log("MENU DATA:", res.data);
        

        setDishes(res.data);

    const uniqueCats = [
  "All",
  ...new Set(res.data.map((item) => getItemCategory(item, lang))),
];

setCategories(uniqueCats);
         // Database က data တွေကို dishes ထဲ ထည့်လိုက်ပြီ
 
        } catch (err) {
        console.error("Menu fetch error:", err);
      }
    };
    
    

    socket.on("connect", () => {
    console.log("Connected to Socket Server ID:", socket.id);
  });

const handleMenuUpdate = (updatedItem) => {
  console.log("Menu updated from admin:", updatedItem);

  // ✅ Add / Edit / Out of Stock
  if (updatedItem && updatedItem._id) {
    setDishes((prev) => {
      const exists = prev.some(
        (item) => String(item._id) === String(updatedItem._id)
      );

      // ✅ Existing item ဆို update/replace
      if (exists) {
        return prev.map((item) =>
          String(item._id) === String(updatedItem._id)
            ? { ...item, ...updatedItem }
            : item
        );
      }

      // ✅ New dish ဆို list ထဲကို တန်းထည့်
      return [...prev, updatedItem];
    });

    return;
  }

  // ✅ Delete event လို data မပါတာဆို အကုန်ပြန် fetch
  fetchMenu();
};

socket.on("menuUpdate", handleMenuUpdate);

  

  // Order အသစ်တက်လာရင် နားထောင်ဖို့ (ဒါမျိုး နောက်မှ သုံးလို့ရတယ်)
  socket.on("newOrder", (data) => {
    console.log("New order received via socket:", data);
  });

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
    fetchMenu();
    fetchLatestId();

  return () => {
    socket.off("connect");
    socket.off("newOrder");
    socket.off("menuUpdate", handleMenuUpdate);
  };

    

   
  }, [lang]); // <--- ဒီနေရာမှာ ပိုနေတဲ့ကွင်း ရှိ၊ မရှိ သေချာကြည့်ပါ (Line 65)

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
    const itemId = item._id || item.id;

    const exist = prev.find(
      (x) => String(x._id || x.id) === String(itemId)
    );

    if (exist) {
      return prev.map((x) =>
        String(x._id || x.id) === String(itemId)
          ? { ...x, qty: x.qty + 1 }
          : x
      );
    }

    return [...prev, { ...item, qty: 1 }];
  });
};

  const updateQty = (id, delta) => {
  setCart((prev) =>
    prev
      .map((x) =>
        String(x._id || x.id) === String(id)
          ? { ...x, qty: x.qty + delta }
          : x
      )
      .filter((x) => x.qty > 0)
  );
};

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const confirmOrder = async () => {
  if (cart.length === 0) return alert("Please add items first!");
  setLoading(true);

  try {
    // ✅ Order ပို့တဲ့အခါ image/base64 မပါအောင် သေးသေးလေး ပြန်ဆောက်မယ်
    const orderItems = cart.map((item) => ({
      _id: item._id || item.id,
      name: getItemName(item, lang),
      name_mm: item.name_mm || "",
      name_en: item.name_en || "",
      price: Number(item.price),
      qty: Number(item.qty),
      category: getItemCategory(item, lang),
    }));

    const res = await axios.post(`${API_BASE}`, {
      table: tableNumber,
      type: orderType,
      items: orderItems,
      total: total,
      note: orderNote,
      orderId: nextOrderId, // Popup မှာ မြင်နေရတဲ့ #000x ကို ပို့မယ်
    });

    if (res.data.success) {
      // 🔥 လက်ရှိတင်လိုက်တဲ့ ID ကို Success Modal မှာ ပြဖို့ သိမ်းထားမယ်
      setCurrentOrderId(nextOrderId);

      setCart([]);
      setShowPopup(false);
      setShowSuccess(true);

      // 🔥 ID ကို တစ်ခုတိုးမယ်
      const currentNum = parseInt(nextOrderId.replace("#", "")) || 1;
      const nextNum = `#${String(currentNum + 1).padStart(4, "0")}`;
      setNextOrderId(nextNum);

      setTimeout(() => setShowSuccess(false), 3000);
    }
  } catch (err) {
    console.error("Confirm order error:", err);
    alert("Server Error! Check connection.");
  } finally {
    setLoading(false);
  }
};// <--- confirmOrder ပိတ်တာ

return (
    <div className="menu-container">
      {/* --- Header Section --- */}
      <div className="menu-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
        
        <button className="logout-btn-simple" onClick={onLogout}>
          🚪 {t("logout")}
        </button>

        {/* User Info ပေါ်မယ့်အပိုင်း */}
        <div className="lang-switch">
  <button 
    className={lang === "en" ? "active" : ""}
    onClick={() => setLang("en")}
  >
    EN
  </button>

  <button 
    className={lang === "mm" ? "active" : ""}
    onClick={() => setLang("mm")}
  >
    MM
  </button>
</div>
        <div className="menu-profile-block" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{user ? user.name : "Staff"}</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>{user?.role ? user.role.toUpperCase() : "WAITER"}</div>
          </div>
          <div className="avatar" style={{ 
            background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', 
            width: '40px', height: '40px', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontWeight: 'bold', border: '2px solid rgba(255,255,255,0.2)' 
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "W"}
          </div>
        </div>
      </div>

      {/* --- Title --- */}
      <h1 className="title" style={{ 
        fontSize: '2.8rem', 
        textAlign: 'center',
        margin: '20px 0 40px 0', 
        fontWeight: '800',
        letterSpacing: '2px',
        color: '#fff'
      }}>
        {t("restaurantMenu")}
      </h1>

      {/* Success Animation Modal */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-card">
            <div className="check-icon">✓</div>
            <h2>Order Successful!</h2>
            <p>Your Order ID: {currentOrderId}</p> 
            <p>မီးဖိုချောင်သို့ Order ပို့ပြီးပါပြီ။</p>
          </div>
        </div>
      )}
      <input className="search-bar" placeholder={t("searchDishes")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      <div className="category-tabs">
  {categories.map((c) => (
    <button
      key={c}
      className={category === c ? "active" : ""}
      onClick={() => setCategory(c)}
    >
      {c === "All" ? t("all") : c}
    </button>
  ))}
</div>

<div className="menu-grid">
  {dishes.length > 0 ? (
    dishes
      .filter((f) => {
 const itemCat = getItemCategory(f, lang);

return category === "All" ? true : itemCat === category;
})
      .filter((f) => {
  const displayName = getItemName(f, lang);
  const originalName = f.name || "";
  const mmName = f.name_mm || "";
  const enName = f.name_en || "";
  const keyword = searchTerm.toLowerCase();

  return (
    displayName.toLowerCase().includes(keyword) ||
    originalName.toLowerCase().includes(keyword) ||
    mmName.toLowerCase().includes(keyword) ||
    enName.toLowerCase().includes(keyword)
  );
})
      .map((item) => (
        
        // 💡 key ကို item._id လို့ ပြောင်းသုံးပါ
       <div
  className={`menu-card ${!item.available ? "out-stock" : ""}`}
  key={item._id}
>
  <div className="img-container">
   <img
  src={getMenuImage(item.image)}
  alt={item.name}
  style={{
    width: "100%",
    height: "150px",
    objectFit: "cover",
    borderRadius: "10px",
    display: "block",
  }}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/no-image.png";
  }}
/>

    {!item.available && (
      <div className="stock-overlay">
        <div className="stock-badge">
          <span className="dot"></span>
          OUT OF STOCK
        </div>
      </div>
    )}
  </div>

  <div className="card-info">
    <h4>{getItemName(item, lang)}</h4>
    <p>{Number(item.price).toLocaleString()} MMK</p>

    <button
      className={`add-btn ${!item.available ? "disabled-btn" : ""}`}
      disabled={!item.available}
      onClick={() => item.available && addToCart(item)}
    >
      {item.available ? "+" : "×"}
    </button>
  </div>
</div>
      ))
  ) : (
    <div style={{ color: 'white', textAlign: 'center', width: '100%' }}>ဟင်းပွဲများ ဆွဲယူနေဆဲဖြစ်သည်...</div>
  )}
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
      <h3 style={{margin: '0 0 10px 0'}}>Your Order {nextOrderId} </h3>

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
              background: '#f8f7f7',
              color: '#000000',
              border: '2px solid #00f2fe',
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
          // 💡 cart ထဲမှာလည်း _id ကိုပဲ key အဖြစ် သုံးပါ
          <div className="list-row" key={item._id || item.id}>
            <div>
              <div style={{fontWeight: 'bold'}}>{item.name}</div>
              <div style={{fontSize: '13px', color: '#ffffff'}}>{item.price * item.qty} MMK</div>
            </div>
            <div className="qty-controls">
              <button onClick={() => updateQty(item._id || item.id, -1)}>-</button>
              <span>{item.qty}</span>
              <button onClick={() => updateQty(item._id || item.id, 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
       <div className="order-note-box">
  <label>Special Note</label>
  <textarea
    value={orderNote}
    onChange={(e) => setOrderNote(e.target.value)}
    placeholder="Discription..."
  />
</div>
      <div className="final-total-row">
        <span>Total:</span>
        <span style={{color: '#ffffff'}}>{total} MMK</span>
      </div>

      <button className="btn-confirm" onClick={confirmOrder} disabled={loading}>
        {loading ? "Confirming..." : "Confirm & Send"}
      </button>
      <button className="btn-close" onClick={() => setShowPopup(false)}>Close</button>
    </div>
    </div>
)}
</div>
)}

