import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import DynamicPage from "./pages/DynamicPage";
import Marketplace from "./pages/information/Marketplace";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AdminAuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/gallery" element={<DynamicPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            {/* Dynamic pages - these will load from database */}
            <Route path="/bylaws" element={<DynamicPage />} />
            <Route path="/contact" element={<DynamicPage />} />
            <Route path="/fees" element={<DynamicPage />} />
            <Route path="/recycling" element={<DynamicPage />} />
            <Route path="/organics" element={<DynamicPage />} />
            <Route path="/renovations" element={<DynamicPage />} />
            {/* Interactive Marketplace */}
            <Route path="/marketplace" element={<Marketplace />} />
            {/* Legacy information routes - redirect to new slugs */}
            <Route path="/information/recycling" element={<DynamicPage />} />
            <Route path="/information/organics" element={<DynamicPage />} />
            <Route path="/information/fees" element={<DynamicPage />} />
            <Route path="/information/renovations" element={<DynamicPage />} />
            <Route path="/information/marketplace" element={<Marketplace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/not-found" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
