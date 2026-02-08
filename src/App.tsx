import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Student Pages
import Dashboard from "./pages/Dashboard";
import Classes from "./pages/Classes";
import ClassDetail from "./pages/ClassDetail";
import RankPapers from "./pages/RankPapers";
import RankPaperAttempt from "./pages/RankPaperAttempt";
import Shop from "./pages/Shop";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminModerators from "./pages/admin/AdminModerators";
import AdminClasses from "./pages/admin/AdminClasses";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminRankPapers from "./pages/admin/AdminRankPapers";
import AdminShop from "./pages/admin/AdminShop";
import AdminPapers from "./pages/admin/AdminPapers";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Student Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/classes/:id" element={<ClassDetail />} />
            <Route path="/rank-papers" element={<RankPapers />} />
            <Route path="/rank-papers/:id/attempt" element={<RankPaperAttempt />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/moderators" element={<AdminModerators />} />
            <Route path="/admin/classes" element={<AdminClasses />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/rank-papers" element={<AdminRankPapers />} />
            <Route path="/admin/shop" element={<AdminShop />} />
            <Route path="/admin/papers" element={<AdminPapers />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
