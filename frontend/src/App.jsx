/*
Main web router for the project, separating the public website
from the authenticated agency console.
*/

import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const PublicHomePage = lazy(() => import("./pages/PublicHomePage"));
const PublicReportPage = lazy(() => import("./pages/PublicReportPage"));
const PublicSentPage = lazy(() => import("./pages/PublicSentPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ReportsListPage = lazy(() => import("./pages/ReportsListPage"));
const ReportDetailPage = lazy(() => import("./pages/ReportDetailPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const AlertComposerPage = lazy(() => import("./pages/AlertComposerPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const RoutingRulesPage = lazy(() => import("./pages/RoutingRulesPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const SurveysPage = lazy(() => import("./pages/SurveysPage"));
const SurveyDetailPage = lazy(() => import("./pages/SurveyDetailPage"));
const MyResponsesPage = lazy(() => import("./pages/MyResponsesPage"));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // Dev-only preview: ?preview=1 lets reviewers see the agency console
  // without a backend account. Disabled in production builds.
  const previewBypass =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("preview") === "1";
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (user || previewBypass) return children;
  return <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/agency/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Suspense fallback={<div className="loading-screen">Loading…</div>}>
          <Routes>
            {/* Public website */}
            <Route path="/" element={<PublicHomePage />} />
            <Route path="/report" element={<PublicReportPage />} />
            <Route path="/report/sent" element={<PublicSentPage />} />

            {/* Guest-only */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

            {/* Authenticated agency console */}
            <Route path="/agency" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/agency/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsListPage />} />
              <Route path="reports/:id" element={<ReportDetailPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="alerts/new" element={<AlertComposerPage />} />
              <Route path="resources" element={<ResourcesPage />} />
              <Route path="routing" element={<RoutingRulesPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="surveys" element={<SurveysPage />} />
              <Route path="surveys/:id" element={<SurveyDetailPage />} />
              <Route path="my-responses" element={<MyResponsesPage />} />
            </Route>

            {/* Legacy starter routes */}
            <Route path="/dashboard" element={<Navigate to="/agency/dashboard" replace />} />
            <Route path="/surveys" element={<Navigate to="/agency/surveys" replace />} />
            <Route path="/surveys/:id" element={<Navigate to="/agency/surveys" replace />} />
            <Route path="/alerts" element={<Navigate to="/agency/alerts" replace />} />
            <Route path="/my-responses" element={<Navigate to="/agency/my-responses" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
