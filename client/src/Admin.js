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

// --- ၁။ API_BASE ကို Render Link သို့ ပြောင်းလိုက်ပါ ---
const API_BASE = "https://bs-pos-system.onrender.com"; 
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
  const [newStaff, setNewStaff] = useState({ name: "", role: "Waiter" });

  const [staffList, setStaffList] = useState([
    { id: 1, name: "Aung Kyaw Hein", role: "Admin", status: "Active" },
    { id: 2, name: "Koko", role: "Cashier", status: "Active" },
    { id: 3, name: "ZawZaw", role: "Waiter", status: "Active" },
    { id: 4, name: "Aye Aye", role: "Waiter", status: "Active" }
  ]);

  useEffect(() => {
    document.title = "Admin Panel";
    loadOrders();

    socket.on("orderUpdate", () => loadOrders());
    socket.on("updateOrder", () => loadOrders());

    return () => {
      socket.off("orderUpdate");
      socket.off("updateOrder");
    };
  }, []);

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
        await axios.post(`${API_BASE}/order/status`, { id: orderId, status: "paid" });
        socket.emit("updateOrder", { id: orderId, status: "paid" });
        loadOrders();
        alert("ငွေရှင်းခြင်း အောင်မြင်ပါသည်။");
      } catch (err) {
        alert("Checkout လုပ်ရာတွင် အမှားအယွင်းရှိပါသည်။");
      }
    }
  };

  const handleAddStaff = () => {
    if (!newStaff.name) return alert("နာမည်ထည့်ပါ");
    setStaffList([...staffList, { ...newStaff, id: Date.now(), status: "Active" }]);
    setIsStaffModalOpen(false);
    setNewStaff({ name: "", role: "Waiter" });
  };

  const totalRevenue = orders.filter(o => o.status === "paid").reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingBills = orders.filter(o => o.status === "done").length;
  const activeTables = new Set(orders.filter(o => o.status !== "paid").map(o => o.table)).size;

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-logo"><h2>BS <span>POS</span></h2></div>
        <nav className="admin-nav">
          <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}><LayoutDashboard size={20} /> Dashboard</button>
          <button className={activeTab === "cashier" ? "active" : ""} onClick={() => setActiveTab("cashier")}><ShoppingBag size={20} /> Cashier / Orders</button>
          <button className={activeTab === "menu-edit" ? "active" : ""} onClick={() => setActiveTab("menu-edit")}> <UtensilsCrossed size={20} /> Menu Edit </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}><History size={20} /> Sales History</button>
          <button className={activeTab === "staff" ? "active" : ""} onClick={() => setActiveTab("staff")}><Users size={20} /> Staff Management</button>
        </nav>
        {/* --- ၃။ Logout button ကို App.js က onLogout နဲ့ ချိတ်လိုက်ပါပြီ --- */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>{activeTab.toUpperCase()}</h1>
          <div className="admin-user-info">
            <button className={`refresh-icon-btn ${loading ? 'spinning' : ''}`} onClick={loadOrders}><RefreshCw size={18} /></button>
            <div className="user-profile-block">
              <div className="user-text">
                {/* --- ၄။ Login ဝင်ထားတဲ့ user နာမည်ကို dynamic ပြပါမယ် --- */}
                <span className="user-name">{user?.name || "Admin"}</span> 
                <span className="user-role">{user?.role || "Administrator"}</span>
              </div>
              <div className="avatar">
                {user?.name ? user.name[0].toUpperCase() : "A"}
              </div>
            </div>
          </div>
        </header>

        <section className="admin-content">
          {activeTab === "dashboard" && (
            <div className="dashboard-wrapper">
              <div className="dashboard-grid">
                <div className="stat-card blue"><h3>Total Revenue</h3><p>{totalRevenue.toLocaleString()} MMK</p></div>
                <div className="stat-card green"><h3>Active Tables</h3><p>{activeTables}</p></div>
                <div className="stat-card amber"><h3>Pending Bills</h3><p>{pendingBills}</p></div>
              </div>
            </div>
          )}

          {activeTab === "cashier" && (
            <div className="cashier-view">
              <div className="cashier-grid">
                {orders.filter(o => o.status === "done").map(order => (
                  <div key={order.id} className="bill-card">
                    <div className="bill-header"><span className="bill-id">#{order.id}</span><span className="bill-table">Table {order.table}</span></div>
                    <div className="bill-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bill-item-row"><span>{item.name} x {item.qty}</span><span>{(item.price * item.qty).toLocaleString()} MMK</span></div>
                      ))}
                    </div>
                    <div className="bill-total"><span>Grand Total</span><span className="total-price">{Number(order.total).toLocaleString()} MMK</span></div>
                    <div className="bill-actions">
                      <button className="print-btn">Print</button>
                      <button className="checkout-btn" onClick={() => handleCheckout(order.id)}>Receive Payment</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="history-view">
              <div className="history-card">
                <div className="table-header"><h2>Sales History</h2><div className="total-sales-tag">Total: {totalRevenue.toLocaleString()} MMK</div></div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Order ID</th><th>Table</th><th>Items</th><th>Total Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {orders.filter(o => o.status === "paid").map(order => (
                        <tr key={order.id}>
                          <td>#{order.id}</td><td>Table {order.table}</td>
                          <td className="items-cell">{order.items.map(i => `${i.name} x${i.qty}`).join(", ")}</td>
                          <td className="price-cell">{Number(order.total).toLocaleString()} MMK</td>
                          <td><span className="status-badge active">Paid</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            <div className="modal-header"><h3>Add New Staff</h3><X className="close-icon" onClick={() => setIsStaffModalOpen(false)} /></div>
            <div className="modal-body">
              <label>Staff Name</label>
              <input type="text" value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} />
              <label>Role</label>
              <select value={newStaff.role} onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}>
                <option value="Admin">Admin</option>
                <option value="Cashier">Cashier</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Waiter">Waiter</option>
              </select>
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