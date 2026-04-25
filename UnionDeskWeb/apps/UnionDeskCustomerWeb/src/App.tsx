import { Navigate, Route, Routes } from "react-router-dom";
import { loadAuthSession } from "@uniondesk/shared";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";

function hasCustomerSession(): boolean {
  const session = loadAuthSession();
  return !!session && session.clientCode === "ud-customer-web" && !!session.accessToken;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  if (!hasCustomerSession()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
