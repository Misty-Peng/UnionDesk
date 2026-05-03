import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { loadAuthSession } from "@uniondesk/shared";

import PortalShell from "./components/PortalShell";
import HomePage from "./pages/home";
import LoginPage from "./pages/login";
import DomainsPage from "./pages/domains";
import InboxPage from "./pages/inbox";
import TicketDetailPage from "./pages/tickets/detail";
import { getCustomerPortalSnapshot } from "@uniondesk/shared";

function hasCustomerSession(): boolean {
  const session = loadAuthSession();
  return !!session && session.clientCode === "ud-customer-web" && !!session.accessToken;
}

function RequireSession() {
  if (!hasCustomerSession()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function RequireDomain() {
  const snapshot = getCustomerPortalSnapshot();
  if (!snapshot.activeDomain) {
    return <Navigate to="/domains" replace />;
  }
  return <Outlet />;
}

function LandingRedirect() {
  const location = useLocation();
  if (!hasCustomerSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  const snapshot = getCustomerPortalSnapshot();
  if (!snapshot.activeDomain) {
    return <Navigate to="/domains" replace />;
  }
  return <Navigate to="/workspace" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route element={<PortalShell />}>
          <Route path="/domains" element={<DomainsPage />} />
          <Route element={<RequireDomain />}>
            <Route path="/workspace" element={<HomePage />} />
            <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
            <Route path="/inbox" element={<InboxPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<LandingRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
