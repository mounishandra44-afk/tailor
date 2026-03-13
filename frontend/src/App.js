import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminForgotPasswordPage from "@/pages/AdminForgotPasswordPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminResetPasswordPage from "@/pages/AdminResetPasswordPage";
import HomePage from "@/pages/HomePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
        <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}
