import React, { useState, useEffect } from "react";

import axios from "axios";
import { io } from "socket.io-client";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  History, 
  UtensilsCrossed,
  Users, 
  LogOut,
  RefreshCw,
  X,
  Edit,      
  Trash2,    
  Plus,      
  Save       
} from "lucide-react"; 
import "./admin.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useLang } from "./LanguageContext";






// --- ၁။ API_BASE ကို Render Link သို့ ပြောင်းလိုက်ပါ ---
const API_BASE = "https://bs-pos-system-1.onrender.com/api";
const socket = io("https://bs-pos-system-1.onrender.com");

function MenuEditTab({ menuItems, onUpdate, openAddDishModal, setOpenAddDishModal }) {
  const { t } = useLang();
  const [items, setItems] = useState(menuItems);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", cat: "" });
  

  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => {
  if (openAddDishModal) {
    setShowAddModal(true);
    if (setOpenAddDishModal) setOpenAddDishModal(false);
  }
}, [openAddDishModal, setOpenAddDishModal]);
  const [newDish, setNewDish] = useState({ name: "", price: "", category: "Breakfast" });
  const [isNewCat, setIsNewCat] = useState(false); 
  const [imageFile, setImageFile] = useState(null);

   useEffect(() => {
  loadMenuItems();
}, []);

const loadMenuItems = async () => {
  try {
    const res = await axios.get("https://bs-pos-system-1.onrender.com/api/menu");

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.data;

    setItems(data || []);
  } catch (err) {
    console.error(err);
    setItems([]);
  }
};
  
const handleAddDish = async () => {
    const formData = new FormData();
    formData.append('name', newDish.name);
    formData.append('price', newDish.price);
    formData.append('category', newDish.category);
    if (imageFile) formData.append('image', imageFile);

   try {
      // 1. Backend ကို Data လှမ်းပို့တယ်
      const res = await axios.post("https://bs-pos-system-1.onrender.com/api/menu", formData);

      // 2. ပို့တာ အောင်မြင်သွားရင် (Success ဖြစ်ရင်)
      if (res.data.success) {
        alert("Dish added!");
        setShowAddModal(false); // Popup modal ကို ပိတ်လိုက်မယ်
        
        // 🔥 ဒီနေရာမှာ ထည့်ရမှာပါ
        if (typeof loadMenuItems === "function") {
            loadMenuItems(); // Database ထဲက list အသစ်ကို ပြန်ဆွဲထုတ်ခိုင်းတာ
        } else {
            // အကယ်၍ loadMenuItems မရှိရင် state ကို manual update လုပ်မယ်
            setItems(prev => [...prev, res.data.item]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error adding dish!");
    }
};


  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({ name: item.name, price: item.price, cat: item.category });
  };

  const toggleStock = async (id, currentStatus) => {
  try {
    const res = await axios.put(
      `https://bs-pos-system-1.onrender.com/api/menu/${id}`,
      { available: !currentStatus }
    );

    const updatedItem = res.data.data;

    const updated = items.map((item) =>
      item._id === id ? updatedItem : item
    );

    setItems(updated);
    if (onUpdate) onUpdate(updated);

  } catch (err) {
    console.error(err);
  }
};

const handleDelete = async (id) => {
  const ok = window.confirm("ဒီ menu item ကို ဖျက်မလား?");
  if (!ok) return;

  try {
    await axios.delete(`https://bs-pos-system-1.onrender.com/api/menu/${id}`);

    const updated = items.filter((item) => item._id !== id);
    setItems(updated);
    if (onUpdate) onUpdate(updated);

    alert("Deleted successfully");
  } catch (err) {
    console.error(err);
    alert("Delete မရဘူး bro");
  }
};

const handleSave = async (id) => {
  try {

    const currentItem = items.find(i => i._id === id); // 🔥 ဒီလိုယူ

    const response = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        price: Number(editForm.price), // 🔥 better
        category: editForm.cat,    
        available: currentItem?.available // 🔥 ဒီလိုရေး (important)
      })
    });

    if (response.ok) {
      const updatedItems = items.map(item =>
        item._id === id ? { ...item, ...editForm } : item
      );

      setItems(updatedItems);
      if (onUpdate) onUpdate(updatedItems);

      setEditingId(null);

      
      alert("Success");
    }

  } catch (err) {
    console.error(err);
  }
};
 
  

  return (

    
    

    <>
      {/* ၁။ Popup Modal (ဒီနေရာမှာ ညှပ်ထည့်လိုက်တာ) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h3> {t("addNewDish")} </h3>
            
            <input type="text" placeholder={t("dishName")} onChange={(e) => setNewDish({...newDish, name: e.target.value})} />
            <input type="number" placeholder={t("price")} onChange={(e) => setNewDish({...newDish, price: e.target.value})} />

            <div className="cat-section">
              {!isNewCat ? (
                <select onChange={(e) => {
                  if(e.target.value === "ADD_NEW") setIsNewCat(true);
                  else setNewDish({...newDish, category: e.target.value});
                }}>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Drinks">Drinks</option>
                  <option value="ADD_NEW">+ Add New Category</option>
                </select>
              ) : (
                <input type="text" placeholder="Enter New Category" onBlur={(e) => {
                  setNewDish({...newDish, category: e.target.value});
                  setIsNewCat(false);
                }} />
              )}
            </div>

            <div className="upload-section">
              <label htmlFor="file-upload" className="custom-file-upload">
                 📷 Upload Image / Take Photo
              </label>
              <input 
                id="file-upload" 
                type="file" 
                accept="image/*" 
                capture="environment" 
                onChange={(e) => setImageFile(e.target.files[0])} 
              />
              {imageFile && <p style={{fontSize: '12px'}}>{imageFile.name}</p>}
            </div>

            <div className="modal-btns">
              <button onClick={handleAddDish} className="save-btn">{t("saveDish")}</button>
              <button onClick={() => setShowAddModal(false)} className="cancel-btn">{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ၂။ မင်းရဲ့ မူလ Table UI */}
      <div className="history-card" style={{marginTop: '20px'}}>
        <div className="table-header">
          <h2>Menu Items Management</h2>
          {/* 🔥 ဒီခလုတ်မှာ onClick ချိတ်ဖို့ မမေ့နဲ့ */}
          <button className="add-staff-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> {t("addNewDish")}
          </button>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price (MMK)</th>
                <th>Actions</th>
              </tr>
            </thead>
          <tbody>
  {Array.isArray(items) &&
    items
      .filter(item => item && item._id)
      .map((item) => (
        <tr
  key={item._id}
  style={{
    opacity: item.available === false ? 0.4 : 1,
    filter: item.available === false ? "grayscale(100%)" : "none"
  }}
>
                  {editingId === item._id ? (
                    <>
                      <td><input className="edit-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                      <td><input className="edit-input" value={editForm.cat} onChange={e => setEditForm({...editForm, cat: e.target.value})} /></td>
                      <td><input className="edit-input" type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                      <td>
                        <button onClick={() => handleSave(item._id)} style={{marginRight: '10px'}}><Save size={18} color="#2ed573"/></button>
                        <button onClick={() => setEditingId(null)}><X size={18} color="#ff4757"/></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{Number(item.price).toLocaleString()}</td>
                      <td>
  <div className="menu-action-group">
    <button
      className="action-pill edit-pill"
      onClick={() => startEdit(item)}
      title="Edit"
    >
      <Edit size={16} />
      <span>Edit</span>
    </button>

    <button
      className={`action-pill stock-pill ${item.available ? "warn-pill" : "success-pill"}`}
      onClick={() => toggleStock(item._id, item.available ?? true)}
      title={item.available ? "Set Out of Stock" : "Back in Stock"}
    >
      <span className="status-dot"></span>
      <span>{item.available ? "Out of Stock" : "In Stock"}</span>
    </button>

    <button
      className="action-pill delete-pill"
      onClick={() => handleDelete(item._id)}
      title="Delete"
    >
      <Trash2 size={16} />
      <span>Delete</span>
    </button>
  </div>
</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
// --- ၂။ Props ထဲမှာ user နဲ့ onLogout ကို လက်ခံထားပါတယ် ---
export default function Admin({ user, onLogout }) {
  const { t, lang, setLang } = useLang();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  
  const [currentMenu, setCurrentMenu] = useState([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", role: "Waiter", password: "" });
  const [loading, setLoading] = useState(false);
  
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  
  const [staffList, setStaffList] = useState([]);

  const [openAddDishModal, setOpenAddDishModal] = useState(false);
  const [showTablePopup, setShowTablePopup] = useState(false);

useEffect(() => {
  document.title = "Admin Panel";

  loadOrders();
  loadStaffs();

  const handleOrderUpdate = (data) => {
    console.log("📩 Admin received:", data);
    loadOrders();
  };

  const handleStaffUpdate = () => {
    loadStaffs();
  };

  socket.on("connect", () => {
    console.log("🟢 Admin Connected");
  });

  socket.on("orderUpdate", handleOrderUpdate);
  socket.on("staffUpdate", handleStaffUpdate);

  return () => {
    socket.off("connect");
    socket.off("orderUpdate", handleOrderUpdate);
    socket.off("staffUpdate", handleStaffUpdate);
  };
}, []);

  const loadStaffs = async () => {
    try {
      // API_BASE က https://bs-pos-system-1.onrender.com/api/staff ဖြစ်ရမယ်နော်
      const res = await axios.get("https://bs-pos-system-1.onrender.com/api/staff");
      console.log("STAFF DATA =", res.data); 
      setStaffList(res.data);
    } catch (err) {
      console.error("Staff load failed", err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error("Orders load failed");
    } finally {
      setTimeout(() => setLoading(false), 500); 
    }
  };

  const handleCheckout = async (orderId) => {
  if (window.confirm("ဒီအော်ဒါအတွက် ငွေရှင်းပြီးပြီလား?")) {
    try {
      await axios.post(`${API_BASE}/orders/status`, { id: orderId, status: "paid" });
loadOrders(); // ✅ ဒါလေးပါမှ history ထဲ ချက်ချင်း update ဖြစ်မှာပါ
      alert("ငွေရှင်းခြင်း အောင်မြင်ပါသည်။");
    } catch (err) {
      alert("Checkout လုပ်ရာတွင် အမှားအယွင်းရှိပါသည်။");
    }
  }
};

 const handleAddStaff = async () => {
  if (!newStaff.name) return alert("နာမည်ထည့်ပါ");
  if (!newStaff.password) return alert("Password ထည့်ပါ");

  try {
    const res = await axios.post("https://bs-pos-system-1.onrender.com/api/staff", {
      name: newStaff.name,
      role: newStaff.role,
      password: newStaff.password
    });

    if (res.data.success) {
      setStaffList([...staffList, res.data.data]);
      setIsStaffModalOpen(false);
      setNewStaff({ name: "", role: "Waiter", password: "" });
      alert("Staff သိမ်းဆည်းပြီးပါပြီ!");
    }
  } catch (err) {
    console.error("Save Error:", err);
    alert("Database သို့ သိမ်းဆည်းရာတွင် အမှားအယွင်းရှိပါသည်။");
  }
};
  
  
  
// ===== SALES CHART DATA =====
const getSalesData = () => {
  const days = [];

  const today = new Date();

  // 👉 last 7 days generate
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const key = d.getFullYear() + "-" + 
                String(d.getMonth() + 1).padStart(2, "0") + "-" + 
                String(d.getDate()).padStart(2, "0");

    days.push({
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateKey: key,
      sales: 0
    });
  }

  // 👉 orders mapping
  orders.forEach(order => {
    if (order.status?.toLowerCase() === "paid") {
      const d = new Date(order.createdAt);

      const orderKey = d.getFullYear() + "-" +
                        String(d.getMonth() + 1).padStart(2, "0") + "-" +
                        String(d.getDate()).padStart(2, "0");

      const match = days.find(day => day.dateKey === orderKey);

      if (match) {
        match.sales += Number(order.total) || 0;
      }
    }
  });

  return days;
};

const salesData = getSalesData();
  // --- Logic စတင်ရန် ---


// ၁။ အမှာများဆုံး Item တွေကို တွက်ချက်ခြင်း
const itemCounts = {};

orders.forEach(order => {
  order.items.forEach(item => {
    if (itemCounts[item.name]) {
      itemCounts[item.name] += (item.qty || 1);
    } else {
      itemCounts[item.name] = (item.qty || 1);
    }
  });
});

// ၂။ Object ကို Array ပြောင်းပြီး အများဆုံးကနေ အနည်းဆုံး စီမယ်
const topItems = Object.entries(itemCounts)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5); // ထိပ်ဆုံး ၅ ခုပဲ ယူမယ်


  
const exportPDF = () => {
  const doc = new jsPDF();

  // 🔹 Title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Restaurant POS - Sales Report", 14, 15);

  // 🔹 Date Range
  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateLabel =
    fromDate || toDate
      ? `Date Range: ${fromDate || "Beginning"} to ${toDate || "Today"}`
      : "All Time Report";

  doc.text(dateLabel, 14, 22);

  // 🔹 Table Data
  const tableData = filteredPaidOrders.map(o => [
    o.orderId,
    `Table-${o.table}`,
    `${Number(o.total).toLocaleString()} MMK`,
    o.status.toUpperCase(),
    new Date(o.createdAt).toLocaleString()
  ]);

  // 🔹 Table Style
  autoTable(doc, {
    startY: 28,
    head: [["Order ID", "Table", "Total", "Status", "Date"]],
    body: tableData,

    theme: "grid",

    headStyles: {
      fillColor: [0, 200, 150], // 🔥 Neon green
      textColor: 255,
      fontStyle: "bold",
      halign: "center"
    },

    bodyStyles: {
      fontSize: 10,
      textColor: 50
    },

    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },

    styles: {
      cellPadding: 3,
      halign: "center",
      valign: "middle"
    }
  });

  // 🔹 Total Revenue Box
  doc.setFontSize(12);
  doc.setTextColor(0, 150, 100);

  doc.text(
    `Total Revenue: ${filteredRevenue.toLocaleString()} MMK`,
    14,
    doc.lastAutoTable.finalY + 10
  );

  // 🔹 Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    `Generated at: ${new Date().toLocaleString()}`,
    14,
    doc.lastAutoTable.finalY + 20
  );

  doc.save("sales-report.pdf");
};

const exportTodayPDF = () => {
  const doc = new jsPDF();

  const todayStr = new Date().toLocaleDateString();

  const todayPaidOrders = orders.filter(
    (o) =>
      o.status?.toLowerCase() === "paid" &&
      new Date(o.createdAt).toLocaleDateString() === todayStr
  );

  const todayRevenue = todayPaidOrders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );

  const tableData = todayPaidOrders.map((o) => [
    o.orderId,
    `Table-${o.table}`,
    `${Number(o.total).toLocaleString()} MMK`,
    o.status.toUpperCase(),
    new Date(o.createdAt).toLocaleString()
  ]);

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Restaurant POS - Daily Sales Report", 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Report Date: ${todayStr}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [["Order ID", "Table", "Total", "Status", "Date"]],
    body: tableData.length > 0 ? tableData : [["-", "-", "-", "-", "No sales today"]],
    theme: "grid",
    headStyles: {
      fillColor: [0, 200, 150],
      textColor: 255,
      fontStyle: "bold",
      halign: "center"
    },
    bodyStyles: {
      fontSize: 10,
      textColor: 50
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    styles: {
      cellPadding: 3,
      halign: "center",
      valign: "middle"
    }
  });

  doc.setFontSize(12);
  doc.setTextColor(0, 150, 100);
  doc.text(
    `Today's Revenue: ${todayRevenue.toLocaleString()} MMK`,
    14,
    doc.lastAutoTable.finalY + 10
  );

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    `Generated at: ${new Date().toLocaleString()}`,
    14,
    doc.lastAutoTable.finalY + 20
  );

  doc.save("today-sales-report.pdf");
};

const exportExcel = () => {
  const data = filteredPaidOrders.map(o => ({
    "Order ID": o.orderId,
    "Table": `Table-${o.table}`,
    "Total (MMK)": Number(o.total),
    "Status": o.status.toUpperCase(),
    "Date": new Date(o.createdAt).toLocaleString()
  }));

  // 🔥 empty sheet နဲ့စ
  const ws = XLSX.utils.aoa_to_sheet([]);

  // 🔥 Title + Date Range
  XLSX.utils.sheet_add_aoa(ws, [
    ["Restaurant POS - Sales Report"],
    [`Date Range: ${fromDate || "Beginning"} to ${toDate || "Today"}`],
    []
  ], { origin: "A1" });

  // 🔥 Header + Data ကို A4 မှာစထည့်
  XLSX.utils.sheet_add_json(ws, data, {
    origin: "A4",
    skipHeader: false
  });

  // 🔥 Column Width
  ws["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 24 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales Report");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });

  saveAs(blob, "sales-report.xlsx");
};

  // ✅ Admin.js ရဲ့ အပေါ်ဆုံးနားမှာပဲ ဒါကို ထားလိုက်ပါ
 const paidOrders = orders.filter(o => o.status?.toLowerCase() === "paid");
 const activeTables = new Set(
  orders
    .filter(o => o.status !== "paid" && o.status !== "cancel")
    .map(o => o.table)
).size;
const activeTableNumbers = new Set(
  orders
    .filter(o => o.status !== "paid" && o.status !== "cancel")
    .map(o => String(o.table))
);
 const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
 const todayStr = new Date().toLocaleDateString();
  const todayRevenue = paidOrders
    .filter(o => new Date(o.createdAt).toLocaleDateString() === todayStr)
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

 const filteredPaidOrders = paidOrders.filter((o) => {
  
 const orderDate = new Date(o.createdAt);

  if (fromDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    if (orderDate < from) return false;
  }

  if (toDate) {
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    if (orderDate > to) return false;
  }

  return true;
});

const filteredRevenue = filteredPaidOrders.reduce(
  (sum, o) => sum + (Number(o.total) || 0),
  0
);  

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div class="admin-logo"> <h2> RESTAURANT<span>POS</span></h2>
    <span class="sub-title">Management System</span>
</div>
{loading && (
      <div className="loading-spinner" style={{ color: 'yellow', textAlign: 'center', padding: '10px' }}>
        ခဏစောင့်ပါ... Data များဆွဲနေသည်
      </div>
    )}

    

    

        <nav className="admin-nav">
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}><LayoutDashboard size={20} /> {t("dashboard")}</button>
          <button className={activeTab === "cashier" ? "active" : ""} onClick={() => setActiveTab("cashier")}><ShoppingBag size={20} /> {t("cashierOrders")}</button>
          <button className={activeTab === "menu-edit" ? "active" : ""} onClick={() => setActiveTab("menu-edit")}> <UtensilsCrossed size={20} /> {t("menuEdit")} </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}><History size={20} /> {t("salesHistory")} </button>
          {user?.role?.toLowerCase() !== "cashier" && 
          <button className={activeTab === "staff" ? "active" : ""} onClick={() => setActiveTab("staff")}><Users size={20} /> {t("staffManagement")} </button>}
        </nav>
        {/* --- ၃။ Logout button ကို App.js က onLogout နဲ့ ချိတ်လိုက်ပါပြီ --- */}
        <div className="sidebar-footer">
         
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
         
          <div className="quick-actions-card">
      <h3 style={{ marginRight: '20px' }}>⚡ {t("quickActions")} </h3> {/* စာနဲ့ ခလုတ်ကြား space ထည့်လိုက်တယ် */}
      <div className="action-btns">
          <button onClick={() => {
    setActiveTab("cashier");
  }}>
    <i className="fas fa-cash-register"></i> {t("pendingBills")}  </button>

  <button onClick={() => {
    setActiveTab("menu-edit");
    setOpenAddDishModal(true);
  }}>
    <i className="fas fa-plus"></i> {t("addNewDish")}
  </button>

  <button onClick={exportTodayPDF}>
    <i className="fas fa-file-pdf"></i> {t("todayReport")}
  </button>
      </div>
    </div>
         
          <div className="admin-user-info">
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
  <button 
  className="menu-logout-style-btn" 
  onClick={() => {
    if (typeof LogOut === 'function') LogOut(); // 💡 ကြေညာထားတဲ့ LogOut ကို ဒီမှာ သုံးလိုက်ပြီ (Warning ပျောက်သွားမယ်)
    onLogout(); // 💡 မင်းရဲ့ မူလ logic အတိုင်း logout လုပ်မယ်
  }}
>
  
      🚪 {t("logout")}
    </button>
           <div className="user-profile-block">
  <div className="user-text">
    {/* Login ဝင်လာတဲ့ user ရဲ့ နာမည်ပေါ်အောင် ပြင်မယ် */}
    <span className="user-name">{user ? user.name : "Unknown User"}</span> 
    
    {/* ရာထူးကိုလည်း dynamic ပြမယ် (ဥပမာ- ADMIN သို့မဟုတ် WAITER) */}
    <span className="user-role">{user ? user.role.toUpperCase() : "STAFF"}</span>
  </div>
  
  <div className="avatar">
    {/* နာမည်ရဲ့ ပထမဆုံး စာလုံးကိုပဲ avatar မှာ ပြမယ် */}
    {user ? user.name[0].toUpperCase() : "U"}
  </div>
</div>
  </div>
</header>

        <section className="admin-content">

          {activeTab === "dashboard" && (
  <div className="dashboard-container">
    
    
    {/* 1. Top Stat Cards */}
    <div className="stat-grid">
      
      <div className="stat-card"><h3>{t("todayRevenue")}</h3><p>{todayRevenue.toLocaleString()} MMK</p></div>
            <div className="stat-card"><h3>{t("totalRevenue")}</h3><p>{totalPaidRevenue.toLocaleString()} MMK</p></div>
      <div className="stat-card"><h3>{t("orders")}</h3><p>{orders.length}</p></div>
      <div className="stat-card clickable-card" onClick={() => setShowTablePopup(true)}>
  <h3>Active Tables</h3>
  <p>{activeTables}</p>
</div>
    </div>

    {/* 2. Sales Chart Section */}
    <div className="chart-section">
      <h3>📊 Sales Analytics</h3>
      <div className="chart-section" style={{
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid rgba(0, 255, 204, 0.1)'
}}>
  <h3 style={{ color: '#00ffcc', marginBottom: '15px' }}>📊 Sales Analytics (Last 7 Days)</h3>
  
  <div style={{ width: '100%', height: 300 }}>
    {/* ✅ Recharts ResponsiveContainer ကို သုံးမယ် */}
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={salesData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="day" stroke="rgba(255, 255, 255, 0.5)" />
        <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} stroke="rgba(255, 255, 255, 0.5)" />
        
        {/* Hover လုပ်ရင် ပြမယ့် tooltip ကို UI နဲ့ လိုက်အောင် ပြင်မယ် */}
        <Tooltip contentStyle={{ 
          background: 'rgba(0,0,0,0.8)', 
          border: '1px solid #00ffcc',
          borderRadius: '8px',
          color: '#fff' 
        }} />
        <Legend />
        
        {/* မြင်းလိုင်းကို Neon Color နဲ့ လှလှလေး ဆွဲမယ် */}
        <Line 
          type="monotone" 
          dataKey="sales" 
          name="Revenue"
          stroke="#00ffcc" 
          strokeWidth={3}
          activeDot={{ r: 8 }} 
          dot={{ strokeWidth: 2, r: 4, stroke: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
      
    </div>

    {/* 3. Middle Section: Top Items & Recent Orders */}
    <div className="mid-section">
      <div className="top-items">
  <h3>🍽️ {t("topItems")}</h3>
  <div className="top-items-list">
    {topItems.length > 0 ? (
      topItems.map((item, index) => (
        <div key={index} className="top-item-row" style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '10px 0',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <span>{index + 1}. {item.name}</span>
          <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>{item.count} sold</span>
        </div>
      ))
    ) : (
      <p>No data available</p>
    )}
  </div>
</div>
      <div className="recent-orders">
        <h3>🧾 {t("recentOrders")}</h3>
        <div className="recent-list">
          {orders.slice(0, 5).map(o => (
            <div key={o._id} className="recent-item">
              <span>{o.orderId}</span>
              <span>{o.total.toLocaleString()} MMK</span>
              <span className={`status ${o.status}`}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* 4. Quick Actions */}
  

  </div>
)}

         {activeTab === "cashier" && (
  <div className="cashier-view">
    <div className="cashier-grid">
      {/* ✅ status က "done" ဖြစ်နေတဲ့ (Finish လုပ်ပြီးသား) အော်ဒါတွေကိုပဲ ပြမယ် */}
      {orders.filter(o => o.status === "done").map(order => (
        <div key={order.orderId} className="bill-card">
          <div className="bill-header">
            <span className="bill-id">{order.orderId}</span>
            <span className="bill-table">Table {order.table}</span>
          </div>
          
          <div className="bill-items">
            {order.items && order.items.map((item, idx) => (
              <div key={idx} className="bill-item-row">
                <span>{item.name} x {item.qty}</span>
                <span>{(item.price * item.qty).toLocaleString()} MMK</span>
              </div>
            ))}
          </div>

          <div className="bill-total">
             <span>Total:</span>
             <span>{Number(order.total).toLocaleString()} MMK</span>
          </div>

          <div className="bill-actions">
            <button className="print-btn">Print</button>
            <button className="checkout-btn ready" onClick={() => handleCheckout(order.orderId)}>
              Receive Payment
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        

          {activeTab === "menu-edit" && (
            <div className="menu-edit-view">
              <MenuEditTab 
  menuItems={currentMenu}
  onUpdate={setCurrentMenu}
  openAddDishModal={openAddDishModal}
  setOpenAddDishModal={setOpenAddDishModal}
/>
            </div>
          )}
          
          {activeTab === "history" && (
  <div className="history-view">
    <div className="history-card">
      <div className="table-header">
        <h2>{t("salesHistory")}</h2>
        <div style={{
  margin: "10px 0",
  padding: "10px",
  background: "#1e2d50",
  borderRadius: "10px",
  color: "#00f2ff",
  fontWeight: "bold",
  fontSize: "18px"
}}>
  💰 Total Revenue: {filteredRevenue.toLocaleString()} MMK
</div>
<div style={{
  display: "flex",
  gap: "10px",
  alignItems: "center",
  margin: "10px 0 15px 0",
  flexWrap: "wrap"
}}>
  <label style={{ color: "white" }}>{t("from")}:</label>
  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    style={{ padding: "6px 10px", borderRadius: "6px" }}
  />

  <label style={{ color: "white" }}>{t("to")}:</label>
  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    style={{ padding: "6px 10px", borderRadius: "6px" }}
  />

  <button
    onClick={() => {
      setFromDate("");
      setToDate("");
    }}
  >
    {t("Clear")}
  </button>
</div>
        <button onClick={loadOrders}>
          <RefreshCw size={18}/> {t("refresh")}
        </button>
         <button onClick={exportPDF} style={{marginLeft: "10px"}}>
      📄 PDF
    </button>

    <button onClick={exportExcel} style={{marginLeft: "10px"}}>
      📊 Excel
    </button>
      </div>
       
       

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th> {t("orderID")}</th>
              <th>{t("table")}</th>
              <th>{t("total")}</th>
              <th>{t("status")}</th>
              <th>{t("date")}</th>
            </tr>
          </thead>

          <tbody>
            {filteredPaidOrders.map(order => (
              <tr key={order.orderId}>
                <td>{order.orderId}</td>
                <td>{order.table}</td>
                <td>{Number(order.total).toLocaleString()} MMK</td>
                <td>{order.status}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPaidOrders.length === 0 && (
          <p style={{textAlign: "center", padding: "20px"}}>
            No Sales History Yet
          </p>
        )}
      </div>
    </div>
  </div>
)}

          {activeTab === "staff" && user?.role !== "cashier" && (
            <div className="staff-view">
              <div className="staff-header"><h2>{t("staffMembers")}</h2><button className="add-staff-btn" onClick={() => setIsStaffModalOpen(true)}> {t("addNewStaff")} </button></div>
              <div className="staff-grid">
                {staffList.map(staff => (
                  <div key={staff._id} className="staff-card">
                    <div className="staff-avatar">{staff.name[0]}</div>
                    <div className="staff-info">
                      <h4>{staff.name}</h4>
                      <p>{staff.role}</p>
                      <span className={`status-badge ${staff.status === "Active" ? "active" : "offline"}`}>
  {staff.status === "Active" ? "ACTIVE" : "OFFLINE"}
</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

    {showTablePopup && (
  <div className="table-popup-overlay" onClick={() => setShowTablePopup(false)}>
    <div className="table-popup-card" onClick={(e) => e.stopPropagation()}>
      <div className="table-popup-header">
        <h2>Active Table Overview</h2>
        <button className="table-popup-close" onClick={() => setShowTablePopup(false)}>
          ×
        </button>
      </div>

      <div className="table-legend">
        <div className="legend-item">
          <span className="legend-dot active"></span>
          <span>Occupied</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot empty"></span>
          <span>Empty</span>
        </div>
      </div>

      <div className="table-visual-grid">
        {[...Array(12)].map((_, i) => {
          const tableNum = String(i + 1);
          const isActive = activeTableNumbers.has(tableNum);

          return (
            <div
              key={tableNum}
              className={`table-visual-card ${isActive ? "active" : "empty"}`}
            >
              <h4>Table {tableNum}</h4>
              <img
                src={isActive ? "/table-2.jpg" : "/table-1.jpg"}
                alt={`Table ${tableNum}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

      {isStaffModalOpen && (
  <div className="modal-overlay">
    <div className="staff-modal">
      <div className="modal-header">
        <h3>{t("addNewStaff")}</h3>
        <X className="close-icon" onClick={() => setIsStaffModalOpen(false)} />
      </div>
      
      <div className="modal-body">
        <label> {t("staffName")} </label>
        <input 
          type="text" 
          value={newStaff.name} 
          onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} 
          placeholder="နာမည်ရိုက်ထည့်ပါ"
        />

        <label>Role</label>
        <select value={newStaff.role} onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}>
          <option value="Admin">{t("admin")}</option>
          <option value="Cashier">{t("cashier")}</option>
          <option value="Kitchen">{t("chef")}</option>
          <option value="Waiter">{t("waiter")}</option>
        </select>

        {/* --- 🔥 Password Input ကို ဒီမှာ ထည့်လိုက်ပါ --- */}
        <label style={{ marginTop: '10px', display: 'block' }}>Password</label>
        <input 
          type="password" 
          value={newStaff.password || ""} 
          onChange={(e) => setNewStaff({...newStaff, password: e.target.value})} 
          placeholder="စကားဝှက် ရိုက်ထည့်ပါ"
          className="edit-input" // css class လေး ပါရင် ပိုလှမယ်
        />
      </div>

      <div className="modal-actions">
        <button className="cancel-btn" onClick={() => setIsStaffModalOpen(false)}>{t("cancel")}</button>
        <button className="save-btn" onClick={handleAddStaff}>{t("saveStaff")}</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

