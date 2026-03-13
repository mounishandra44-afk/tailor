import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function AdminResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get("email") || "admin@tourtailor.com",
    reset_code: searchParams.get("code") || "",
    new_password: "",
    confirm_password: "",
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }
    try {
      await api.post("/admin/auth/reset-password", {
        email: form.email,
        reset_code: form.reset_code,
        new_password: form.new_password,
      });
      toast.success("Password updated successfully.");
      navigate("/admin/login");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Password reset failed.");
    }
  };

  return (
    <div className="auth-page" data-testid="admin-reset-page">
      <div className="auth-overlay" />
      <div className="auth-card" data-testid="admin-reset-card">
        <h1 className="auth-title" data-testid="admin-reset-title">Reset Password</h1>
        <form className="auth-form" onSubmit={onSubmit} data-testid="admin-reset-form">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            data-testid="admin-reset-email-input"
            required
          />
          <Input
            value={form.reset_code}
            onChange={(event) => setForm((prev) => ({ ...prev, reset_code: event.target.value }))}
            data-testid="admin-reset-code-input"
            required
          />
          <Input
            type="password"
            placeholder="New Password"
            value={form.new_password}
            onChange={(event) => setForm((prev) => ({ ...prev, new_password: event.target.value }))}
            data-testid="admin-reset-new-password-input"
            required
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={form.confirm_password}
            onChange={(event) => setForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
            data-testid="admin-reset-confirm-password-input"
            required
          />
          <Button className="gold-btn" type="submit" data-testid="admin-reset-submit-button">
            Update Password
          </Button>
        </form>
        <button
          type="button"
          className="text-link"
          onClick={() => navigate("/admin/login")}
          data-testid="admin-reset-back-login-link"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
