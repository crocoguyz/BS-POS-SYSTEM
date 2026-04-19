import React, { useState, useEffect } from "react";
import { menuData } from "./Menu";
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


const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};


// --- ၁။ API_BASE ကို Render Link သို့ ပြောင်းလိုက်ပါ ---
const API_BASE = "http://localhost:5000/api";
const socket = io(API_BASE);

function MenuEditTab({ menuItems, onUpdate }) {
  const [items, setItems] = useState(menuItems);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", cat: "" });

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ name: item.name, price: item.price, cat: item.cat });
  };

  const handleSave = (id) => {
    const updatedItems = items.map(item => item.id === id ? { ...item, ...editForm } : item);
    setItems(updatedItems);
    if (onUpdate) {
      onUpdate(updatedItems);
    }
    setEditingId(null);
    alert("Menu Updated Locally!");
  };
 
  

  return (
    <div className="history-card" style={{marginTop: '20px'}}>
      <div className="table-header">
        <h2>Menu Items Management</h2>
        <button className="add-staff-btn"><Plus size={18} /> Add New Dish</button>
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
            {items.map((item) => (
              <tr key={item.id}>
                {editingId === item.id ? (
                  <>
                    <td><input className="edit-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                    <td><input className="edit-input" value={editForm.cat} onChange={e => setEditForm({...editForm, cat: e.target.value})} /></td>
                    <td><input className="edit-input" type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                    <td>
                      <button onClick={() => handleSave(item.id)} style={{marginRight: '10px'}}><Save size={18} color="#2ed573"/></button>
                      <button onClick={() => setEditingId(null)}><X size={18} color="#ff4757"/></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{item.name}</td>
                    <td>{item.cat}</td>
                    <td>{Number(item.price).toLocaleString()}</td>
                    <td>
                      <button onClick={() => startEdit(item)} style={{marginRight: '10px'}}><Edit size={18} /></button>
                      <button><Trash2 size={18} color="#ff4757" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- ၂။ Props ထဲမှာ user နဲ့ onLogout ကို လက်ခံထားပါတယ် ---
export default function Admin({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMenu, setCurrentMenu] = useState(menuData);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", role: "Waiter", password: "" });

  const [staffList, setStaffList] = useState([]);

useEffect(() => {
  document.title = "Admin Panel";

  loadOrders();
  loadStaffs();

  const handleUpdate = () => loadOrders();

  socket.on("orderUpdate", handleUpdate);

  return () => {
    socket.off("orderUpdate", handleUpdate);
  };
}, []);

  const loadStaffs = async () => {
    try {
      // API_BASE က http://localhost:5000/api/staff ဖြစ်ရမယ်နော်
      const res = await axios.get("http://localhost:5000/api/staff");
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
      socket.emit("updateOrder", { id: orderId, status: "paid" });
      loadOrders(); // ✅ ဒါလေးပါမှ history ထဲ ချက်ချင်း update ဖြစ်မှာပါ
      alert("ငွေရှင်းခြင်း အောင်မြင်ပါသည်။");
    } catch (err) {
      alert("Checkout လုပ်ရာတွင် အမှားအယွင်းရှိပါသည်။");
    }
  }
};

 const handleAddStaff = async () => {
    if (!newStaff.name) return alert("နာမည်ထည့်ပါ");

    try {
      // ၁။ Backend ဆီ လှမ်းပို့မယ်
      const res = await axios.post("http://localhost:5000/api/staff", {
        name: newStaff.name,
        role: newStaff.role,
        password: "123456" // Default ပေးထားလိုက်မယ်
      });

      if (res.data.success) {
        // ၂။ Backend မှာ သိမ်းပြီးမှ Frontend List ထဲ ထည့်မယ်
        setStaffList([...staffList, res.data.data]);
        setIsStaffModalOpen(false);
        setNewStaff({ name: "", role: "Waiter" });
        alert("Staff သိမ်းဆည်းပြီးပါပြီ!");
      }
    } catch (err) {
      console.error("Save Error:", err);
      alert("Database သို့ သိမ်းဆည်းရာတွင် အမှားအယွင်းရှိပါသည်။");
    }
  };

  
  const pendingBills = orders.filter(o => o.status === "done").length;
  const activeTables = new Set(orders.filter(o => o.status !== "paid").map(o => o.table)).size;
  
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

  const paidOrders = orders.filter(o => o.status === "paid");

  const tableData = paidOrders.map(o => [
    o.orderId,
    o.table,
    o.total,
    o.status,
    new Date(o.createdAt).toLocaleString()
  ]);

  doc.text("Sales Report", 14, 15);

  autoTable(doc, {
    head: [["Order ID", "Table", "Total", "Status", "Date"]],
    body: tableData,
    startY: 20
  });

  const total = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  doc.text(`Total: ${total.toLocaleString()} MMK`, 14, doc.lastAutoTable.finalY + 10);

  doc.save("sales-report.pdf");
};

  const exportExcel = () => {
  const paidOrders = orders.filter(o => o.status === "paid");

  const data = paidOrders.map(o => ({
    OrderID: o.orderId,
    Table: o.table,
    Total: o.total,
    Status: o.status,
    Date: new Date(o.createdAt).toLocaleString()
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], { type: "application/octet-stream" });

  saveAs(blob, "sales-report.xlsx");
};

  // ✅ Admin.js ရဲ့ အပေါ်ဆုံးနားမှာပဲ ဒါကို ထားလိုက်ပါ
 const paidOrders = orders.filter(o => o.status?.toLowerCase() === "paid");
 const totalPaidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
 const todayStr = new Date().toLocaleDateString();
  const todayRevenue = paidOrders
    .filter(o => new Date(o.createdAt).toLocaleDateString() === todayStr)
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div class="admin-logo"> <h2> RESTAURANT<span>POS</span></h2>
    <span class="sub-title">Management System</span>
</div>
        <nav className="admin-nav">
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}><LayoutDashboard size={20} /> Dashboard</button>
          <button className={activeTab === "cashier" ? "active" : ""} onClick={() => setActiveTab("cashier")}><ShoppingBag size={20} /> Cashier / Orders</button>
          <button className={activeTab === "menu-edit" ? "active" : ""} onClick={() => setActiveTab("menu-edit")}> <UtensilsCrossed size={20} /> Menu Edit </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}><History size={20} /> Sales History</button>
          <button className={activeTab === "staff" ? "active" : ""} onClick={() => setActiveTab("staff")}><Users size={20} /> Staff Management</button>
        </nav>
        {/* --- ၃။ Logout button ကို App.js က onLogout နဲ့ ချိတ်လိုက်ပါပြီ --- */}
        <div className="sidebar-footer">
         
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="quick-actions-card">
      <h3 style={{ marginRight: '20px' }}>⚡ Quick Actions</h3> {/* စာနဲ့ ခလုတ်ကြား space ထည့်လိုက်တယ် */}
      <div className="action-btns">
        <button onClick={() => setActiveTab('cashier')}><i className="fas fa-cash-register"></i> Go to Cashier</button>
        <button onClick={() => setActiveTab('menu-edit')}><i className="fas fa-edit"></i> Edit Menu</button>
        <button onClick={() => window.print()}><i className="fas fa-print"></i> Daily Report</button>
      </div>
    </div>
         
          <div className="admin-user-info">
             
  <button className="menu-logout-style-btn" onClick={onLogout}>
      🚪 Logout
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
      
      <div className="stat-card"><h3>Today Revenue</h3><p>{todayRevenue.toLocaleString()} MMK</p></div>
            <div className="stat-card"><h3>Total Revenue</h3><p>{totalPaidRevenue.toLocaleString()} MMK</p></div>
      <div className="stat-card"><h3>Orders</h3><p>{orders.length}</p></div>
      <div className="stat-card"><h3>Active Tables</h3><p>{new Set(orders.filter(o => o.status !== 'paid').map(o => o.table)).size}</p></div>
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
        <XAxis dataKey="dayName" stroke="rgba(255, 255, 255, 0.5)" />
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
  <h3>🍽️ Top Items</h3>
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
        <h3>🧾 Recent Orders</h3>
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
              /> 
            </div>
          )}
          
          {activeTab === "history" && (
  <div className="history-view">
    <div className="history-card">
      <div className="table-header">
        <h2>Sales History</h2>
        <div style={{
  margin: "10px 0",
  padding: "10px",
  background: "#1e2d50",
  borderRadius: "10px",
  color: "#00f2ff",
  fontWeight: "bold",
  fontSize: "18px"
}}>
  💰 Total Revenue: {totalPaidRevenue.toLocaleString()} MMK
</div>
        <button onClick={loadOrders}>
          <RefreshCw size={18}/> Refresh
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
              <th>Order ID</th>
              <th>Table</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {orders.filter(o => o.status === "paid").map(order => (
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

        {orders.filter(o => o.status === "paid").length === 0 && (
          <p style={{textAlign: "center", padding: "20px"}}>
            No Sales History Yet
          </p>
        )}
      </div>
    </div>
  </div>
)}

          {activeTab === "staff" && (
            <div className="staff-view">
              <div className="staff-header"><h2>Staff Members</h2><button className="add-staff-btn" onClick={() => setIsStaffModalOpen(true)}>+ Add New Staff</button></div>
              <div className="staff-grid">
                {staffList.map(staff => (
                  <div key={staff.id} className="staff-card">
                    <div className="staff-avatar">{staff.name[0]}</div>
                    <div className="staff-info">
                      <h4>{staff.name}</h4>
                      <p>{staff.role}</p>
                      <span className="status-badge active">ACTIVE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {isStaffModalOpen && (
  <div className="modal-overlay">
    <div className="staff-modal">
      <div className="modal-header">
        <h3>Add New Staff</h3>
        <X className="close-icon" onClick={() => setIsStaffModalOpen(false)} />
      </div>
      
      <div className="modal-body">
        <label>Staff Name</label>
        <input 
          type="text" 
          value={newStaff.name} 
          onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} 
          placeholder="နာမည်ရိုက်ထည့်ပါ"
        />

        <label>Role</label>
        <select value={newStaff.role} onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}>
          <option value="Admin">Admin</option>
          <option value="Cashier">Cashier</option>
          <option value="Kitchen">Kitchen</option>
          <option value="Waiter">Waiter</option>
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
        <button className="cancel-btn" onClick={() => setIsStaffModalOpen(false)}>Cancel</button>
        <button className="save-btn" onClick={handleAddStaff}>Save Staff</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

