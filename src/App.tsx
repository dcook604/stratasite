
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import Gallery from "./pages/Gallery";
import Bylaws from "./pages/Bylaws";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Recycling from "./pages/information/Recycling";
import Organics from "./pages/information/Organics";
import Fees from "./pages/information/Fees";
import Renovations from "./pages/information/Renovations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminAuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/bylaws" element={<Bylaws />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            {/* Information routes */}
            <Route path="/information/recycling" element={<Recycling />} />
            <Route path="/information/organics" element={<Organics />} />
            <Route path="/information/fees" element={<Fees />} />
            <Route path="/information/renovations" element={<Renovations />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
