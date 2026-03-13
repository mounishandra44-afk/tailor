import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@tourtailor.com");
  const [resetCode, setResetCode] = useState("");

  const generateCode = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post("/admin/auth/forgot-password", { email });
      setResetCode(response.data.reset_code);
      toast.success("Reset code generated.");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to generate reset code.");
    }
  };

  return (
    <div className="auth-page" data-testid="admin-forgot-page">
      <div className="auth-overlay" />
      <div className="auth-card" data-testid="admin-forgot-card">
        <h1 className="auth-title" data-testid="admin-forgot-title">Forgot Password</h1>
        <p className="auth-subtitle" data-testid="admin-forgot-subtitle">
          Enter your admin email and generate reset code.
        </p>

        <form className="auth-form" onSubmit={generateCode} data-testid="admin-forgot-form">
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            data-testid="admin-forgot-email-input"
            required
          />
          <Button className="gold-btn" type="submit" data-testid="admin-forgot-generate-button">
            Generate Reset Code
          </Button>
        </form>

        {resetCode && (
          <div className="reset-code-panel" data-testid="admin-forgot-reset-code-panel">
            <p data-testid="admin-forgot-reset-code-label">Your reset code</p>
            <h2 data-testid="admin-forgot-reset-code-value">{resetCode}</h2>
            <Button
              className="outline-gold-btn"
              onClick={() => navigate(`/admin/reset-password?email=${encodeURIComponent(email)}&code=${resetCode}`)}
              data-testid="admin-forgot-go-reset-button"
            >
              Continue to Reset
            </Button>
          </div>
        )}

        <button
          type="button"
          className="text-link"
          onClick={() => navigate("/admin/login")}
          data-testid="admin-forgot-back-login-link"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
