import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Assistant from "./pages/Assistant";
import Cases from "./pages/Cases";
import IncidentHistory from "./pages/IncidentHistory";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ComplaintAssistant from "./pages/ComplaintAssistant";
import { RoleProvider } from "./auth/RoleProvider";

const ProtectedRoute = ({ children }) => {
  const { token } = useAppContext();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const LoginWrapper = () => {
  const { token, setToken, setAuthEmail, setAuthRole } = useAppContext();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Login onLogin={(newToken, user) => {
    setToken(newToken);
    setAuthEmail(user.email);
    setAuthRole(user.role || 'public_user');
  }} />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />

        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="complaint-assistant" element={<ComplaintAssistant />} />
          <Route path="cases" element={<Cases />} />
          <Route path="history" element={<IncidentHistory />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={
            <RoleProvider allowedRoles={['admin', 'enterprise_user']}>
              <AdminDashboard />
            </RoleProvider>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
