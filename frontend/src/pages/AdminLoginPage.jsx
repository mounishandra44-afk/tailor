import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@tourtailor.com", password: "Admin@12345" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/admin/auth/login", form);
      localStorage.setItem("tailor_admin_token", response.data.token);
      toast.success("Admin login successful.");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" data-testid="admin-login-page">
      <div className="auth-overlay" />
      <div className="auth-card" data-testid="admin-login-card">
        <h1 className="auth-title" data-testid="admin-login-title">Admin Login</h1>
        <p className="auth-subtitle" data-testid="admin-login-subtitle">
          Use default account for first login: admin@tourtailor.com / Admin@12345
        </p>
        <form className="auth-form" onSubmit={onSubmit} data-testid="admin-login-form">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            data-testid="admin-login-email-input"
            required
          />
          <Input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            data-testid="admin-login-password-input"
            required
          />
          <Button type="submit" className="gold-btn" disabled={loading} data-testid="admin-login-submit-button">
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>
        <div className="auth-links" data-testid="admin-login-links-wrap">
          <button
            type="button"
            className="text-link"
            onClick={() => navigate("/admin/forgot-password")}
            data-testid="admin-login-forgot-password-link"
          >
            Forgot Password?
          </button>
          <button
            type="button"
            className="text-link"
            onClick={() => navigate("/")}
            data-testid="admin-login-back-home-link"
          >
            Back to User Site
          </button>
        </div>
      </div>
    </div>
  );
}
