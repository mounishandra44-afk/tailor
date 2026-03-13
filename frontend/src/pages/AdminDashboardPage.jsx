import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BarChart3, CalendarClock, ClipboardList, LogOut, Palette, RefreshCcw, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, authHeaders } from "@/lib/api";

const STATUS_OPTIONS = ["pending", "confirmed", "rejected", "completed", "cancelled"];

const tabConfig = [
  { key: "stats", label: "Dashboard Stats", icon: BarChart3 },
  { key: "designs", label: "Manage Designs", icon: Palette },
  { key: "appointments", label: "Appointments", icon: CalendarClock },
  { key: "orders", label: "Orders", icon: ShoppingCart },
];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("stats");
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [designForm, setDesignForm] = useState({
    title: "",
    category: "",
    description: "",
    image_url: "",
    price_note: "",
    is_active: true,
  });
  const [designImageFile, setDesignImageFile] = useState(null);
  const [appointmentStatusDraft, setAppointmentStatusDraft] = useState({});
  const [orderStatusDraft, setOrderStatusDraft] = useState({});

  const headers = useMemo(() => authHeaders(), []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [meRes, statsRes, designsRes, appointmentsRes, ordersRes] = await Promise.all([
        api.get("/admin/me", { headers }),
        api.get("/admin/stats", { headers }),
        api.get("/admin/designs", { headers }),
        api.get("/admin/appointments", { headers }),
        api.get("/admin/orders", { headers }),
      ]);

      setProfile(meRes.data);
      setStats(statsRes.data);
      setDesigns(designsRes.data || []);
      setAppointments(appointmentsRes.data || []);
      setOrders(ordersRes.data || []);

      setAppointmentStatusDraft(
        Object.fromEntries((appointmentsRes.data || []).map((item) => [item.id, item.status]))
      );
      setOrderStatusDraft(Object.fromEntries((ordersRes.data || []).map((item) => [item.id, item.status])));
    } catch (error) {
      localStorage.removeItem("tailor_admin_token");
      toast.error("Session expired. Please login again.");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const createDesign = async (event) => {
    event.preventDefault();
    try {
      const image_data_url = designImageFile ? await fileToDataUrl(designImageFile) : "";
      await api.post(
        "/admin/designs",
        { ...designForm, image_data_url },
        { headers }
      );
      toast.success("Design added successfully.");
      setDesignForm({ title: "", category: "", description: "", image_url: "", price_note: "", is_active: true });
      setDesignImageFile(null);
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not add design.");
    }
  };

  const toggleDesignStatus = async (design) => {
    try {
      await api.put(
        `/admin/designs/${design.id}`,
        { is_active: !design.is_active },
        { headers }
      );
      toast.success("Design status updated.");
      await loadDashboard();
    } catch (error) {
      toast.error("Unable to update design.");
    }
  };

  const deleteDesign = async (designId) => {
    try {
      await api.delete(`/admin/designs/${designId}`, { headers });
      toast.success("Design deleted.");
      await loadDashboard();
    } catch (error) {
      toast.error("Could not delete design.");
    }
  };

  const updateAppointmentStatus = async (appointmentId) => {
    try {
      await api.patch(
        `/admin/appointments/${appointmentId}/status`,
        { status: appointmentStatusDraft[appointmentId] },
        { headers }
      );
      toast.success("Appointment status updated.");
      await loadDashboard();
    } catch (error) {
      toast.error("Unable to update appointment status.");
    }
  };

  const updateOrderStatus = async (orderId) => {
    try {
      await api.patch(
        `/admin/orders/${orderId}/status`,
        { status: orderStatusDraft[orderId] },
        { headers }
      );
      toast.success("Order status updated.");
      await loadDashboard();
    } catch (error) {
      toast.error("Unable to update order status.");
    }
  };

  const logout = () => {
    localStorage.removeItem("tailor_admin_token");
    navigate("/admin/login");
  };

  if (loading) {
    return <div className="admin-loader" data-testid="admin-dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-shell" data-testid="admin-dashboard-page">
      <aside className="admin-sidebar" data-testid="admin-sidebar">
        <h2 className="admin-logo" data-testid="admin-sidebar-logo">Tour Tailor Admin</h2>
        <p className="admin-meta" data-testid="admin-sidebar-admin-email">{profile?.email}</p>
        <div className="admin-nav-buttons" data-testid="admin-sidebar-nav-buttons">
          {tabConfig.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                className={`admin-nav-btn ${activeTab === tab.key ? "active-admin-nav-btn" : ""}`}
                onClick={() => setActiveTab(tab.key)}
                data-testid={`admin-tab-button-${tab.key}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <Button className="admin-logout-btn" onClick={logout} data-testid="admin-logout-button">
          <LogOut size={16} /> Logout
        </Button>
      </aside>

      <section className="admin-main" data-testid="admin-main-content">
        <header className="admin-topbar" data-testid="admin-topbar">
          <h1 className="admin-heading" data-testid="admin-topbar-heading">
            {activeTab === "stats" && "Dashboard Overview"}
            {activeTab === "designs" && "Manage Designs"}
            {activeTab === "appointments" && "Manage Appointments"}
            {activeTab === "orders" && "Manage Orders"}
          </h1>
          <Button className="outline-gold-btn" onClick={loadDashboard} data-testid="admin-refresh-button">
            <RefreshCcw size={16} /> Refresh
          </Button>
        </header>

        {activeTab === "stats" && (
          <div className="admin-stats-grid" data-testid="admin-stats-grid">
            <article className="admin-stat-card" data-testid="admin-stat-today-bookings">
              <p>Today Bookings</p>
              <h3>{stats?.today_bookings || 0}</h3>
            </article>
            <article className="admin-stat-card" data-testid="admin-stat-pending-appointments">
              <p>Pending Appointments</p>
              <h3>{stats?.pending_appointments || 0}</h3>
            </article>
            <article className="admin-stat-card" data-testid="admin-stat-pending-orders">
              <p>Pending Orders</p>
              <h3>{stats?.pending_orders || 0}</h3>
            </article>
            <article className="admin-stat-card" data-testid="admin-stat-total-designs">
              <p>Total Designs</p>
              <h3>{stats?.total_designs || 0}</h3>
            </article>
            <article className="admin-stat-card" data-testid="admin-stat-total-appointments">
              <p>Total Appointments</p>
              <h3>{stats?.total_appointments || 0}</h3>
            </article>
            <article className="admin-stat-card" data-testid="admin-stat-total-orders">
              <p>Total Orders</p>
              <h3>{stats?.total_orders || 0}</h3>
            </article>
          </div>
        )}

        {activeTab === "designs" && (
          <div className="admin-panel-grid" data-testid="admin-designs-panel">
            <form className="admin-form-card" onSubmit={createDesign} data-testid="admin-create-design-form">
              <h2 data-testid="admin-create-design-heading">Add New Design</h2>
              <Input placeholder="Title" value={designForm.title} onChange={(event) => setDesignForm((prev) => ({ ...prev, title: event.target.value }))} data-testid="admin-design-title-input" required />
              <Input placeholder="Category (men/women/bridal/alterations)" value={designForm.category} onChange={(event) => setDesignForm((prev) => ({ ...prev, category: event.target.value }))} data-testid="admin-design-category-input" required />
              <Input placeholder="Image URL (optional)" value={designForm.image_url} onChange={(event) => setDesignForm((prev) => ({ ...prev, image_url: event.target.value }))} data-testid="admin-design-image-url-input" />
              <Input placeholder="Price Note" value={designForm.price_note} onChange={(event) => setDesignForm((prev) => ({ ...prev, price_note: event.target.value }))} data-testid="admin-design-price-note-input" />
              <label className="file-label" data-testid="admin-design-file-label">
                Upload Image File
                <input type="file" accept="image/*" className="hidden-file" onChange={(event) => setDesignImageFile(event.target.files?.[0] || null)} data-testid="admin-design-file-input" />
              </label>
              <Textarea placeholder="Description" value={designForm.description} onChange={(event) => setDesignForm((prev) => ({ ...prev, description: event.target.value }))} data-testid="admin-design-description-input" required />
              <Button className="gold-btn" type="submit" data-testid="admin-design-submit-button">Add Design</Button>
            </form>

            <div className="admin-table-card" data-testid="admin-designs-table-card">
              <h2 data-testid="admin-designs-list-heading">Existing Designs</h2>
              <div className="admin-table-wrap" data-testid="admin-designs-table-wrap">
                <table className="admin-table" data-testid="admin-designs-table">
                  <thead>
                    <tr>
                      <th>Design</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {designs.map((design) => (
                      <tr key={design.id} data-testid={`admin-design-row-${design.id}`}>
                        <td data-testid={`admin-design-title-${design.id}`}>{design.title}</td>
                        <td data-testid={`admin-design-category-${design.id}`}>{design.category}</td>
                        <td data-testid={`admin-design-status-${design.id}`}>{design.is_active ? "Active" : "Inactive"}</td>
                        <td className="table-actions" data-testid={`admin-design-actions-${design.id}`}>
                          <Button className="outline-gold-btn" onClick={() => toggleDesignStatus(design)} data-testid={`admin-design-toggle-${design.id}`}>
                            {design.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button className="danger-btn" onClick={() => deleteDesign(design.id)} data-testid={`admin-design-delete-${design.id}`}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="admin-table-card" data-testid="admin-appointments-panel">
            <h2 data-testid="admin-appointments-heading">Appointments</h2>
            <div className="admin-table-wrap" data-testid="admin-appointments-table-wrap">
              <table className="admin-table" data-testid="admin-appointments-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Design</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((item) => (
                    <tr key={item.id} data-testid={`admin-appointment-row-${item.id}`}>
                      <td data-testid={`admin-appointment-customer-${item.id}`}>{item.name} ({item.phone})</td>
                      <td data-testid={`admin-appointment-design-${item.id}`}>{item.design_title || "Not selected"}</td>
                      <td data-testid={`admin-appointment-date-${item.id}`}>{item.appointment_date}</td>
                      <td>
                        <span className={`status-badge status-${item.status}`} data-testid={`admin-appointment-status-badge-${item.id}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="table-actions">
                        <select
                          value={appointmentStatusDraft[item.id] || item.status}
                          onChange={(event) => setAppointmentStatusDraft((prev) => ({ ...prev, [item.id]: event.target.value }))}
                          className="status-select"
                          data-testid={`admin-appointment-status-select-${item.id}`}
                        >
                          {STATUS_OPTIONS.map((statusValue) => <option key={statusValue} value={statusValue}>{statusValue}</option>)}
                        </select>
                        <Button className="gold-btn" onClick={() => updateAppointmentStatus(item.id)} data-testid={`admin-appointment-status-save-${item.id}`}>
                          Save
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div className="admin-table-card" data-testid="admin-orders-panel">
            <h2 data-testid="admin-orders-heading">Orders</h2>
            <div className="admin-table-wrap" data-testid="admin-orders-table-wrap">
              <table className="admin-table" data-testid="admin-orders-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Design</th>
                    <th>Qty</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((item) => (
                    <tr key={item.id} data-testid={`admin-order-row-${item.id}`}>
                      <td data-testid={`admin-order-customer-${item.id}`}>{item.name} ({item.phone})</td>
                      <td data-testid={`admin-order-design-${item.id}`}>{item.design_title}</td>
                      <td data-testid={`admin-order-qty-${item.id}`}>{item.quantity}</td>
                      <td>
                        <span className={`status-badge status-${item.status}`} data-testid={`admin-order-status-badge-${item.id}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="table-actions">
                        <select
                          value={orderStatusDraft[item.id] || item.status}
                          onChange={(event) => setOrderStatusDraft((prev) => ({ ...prev, [item.id]: event.target.value }))}
                          className="status-select"
                          data-testid={`admin-order-status-select-${item.id}`}
                        >
                          {STATUS_OPTIONS.map((statusValue) => <option key={statusValue} value={statusValue}>{statusValue}</option>)}
                        </select>
                        <Button className="gold-btn" onClick={() => updateOrderStatus(item.id)} data-testid={`admin-order-status-save-${item.id}`}>
                          Save
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
