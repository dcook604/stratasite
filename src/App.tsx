import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ErrorBoundary from "./components/error/ErrorBoundary";
import SkipLink from "./components/accessibility/SkipLink";

// Core pages - loaded immediately
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DynamicPage from "./pages/DynamicPage";
import FormAcknowledgment from "./pages/FormAcknowledgment";

// Lazy-loaded components for better performance
import {
  AdminDashboard,
  AdminLogin,
  AdminResetPassword,
  Bylaws,
  ScooterRegistration,
  PetRegistration,
  EmergencyContact,
  ACInquiry,
  StorageLockerSignup,
  FormK,
  TenantSignature,
  Documents,
  WelcomePackage,
  IncidentReport,
  IncidentStatus,
  PreferredVendors,
  LazyLoadingFallback
} from "./components/lazy/LazyComponents";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AdminAuthProvider>
            <SkipLink />
            <Toaster />
            <Sonner />
            <Suspense fallback={<LazyLoadingFallback />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/gallery" element={<DynamicPage />} />
                <Route path="/admin/login" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <AdminLogin />
                  </Suspense>
                } />
                <Route path="/admin/reset-password" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <AdminResetPassword />
                  </Suspense>
                } />
                <Route path="/admin/dashboard" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <AdminDashboard />
                  </Suspense>
                } />
                {/* Interactive Bylaws */}
                <Route path="/bylaws" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <Bylaws />
                  </Suspense>
                } />
                {/* Dynamic pages - these will load from database */}
                <Route path="/contact" element={<DynamicPage />} />
                <Route path="/fees" element={<DynamicPage />} />
                <Route path="/recycling" element={<DynamicPage />} />
                <Route path="/organics" element={<DynamicPage />} />
                <Route path="/renovations" element={<DynamicPage />} />
                {/* Documents page */}
                <Route path="/documents" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <Documents />
                  </Suspense>
                } />
                {/* Welcome Package page */}
                <Route path="/welcome-package" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <WelcomePackage />
                  </Suspense>
                } />
                {/* Scooter Registration page */}
                <Route path="/scooter-registration" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <ScooterRegistration />
                  </Suspense>
                } />
                {/* Emergency Contact page */}
                <Route path="/emergency-contact" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <EmergencyContact />
                  </Suspense>
                } />
                {/* AC Inquiry page */}
                <Route path="/ac-inquiry" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <ACInquiry />
                  </Suspense>
                } />
                {/* Storage Locker Signup */}
                <Route path="/storage-locker-signup" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <StorageLockerSignup />
                  </Suspense>
                } />
                {/* Pet Registration page */}
                <Route path="/pet-registration" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <PetRegistration />
                  </Suspense>
                } />
                {/* Form K page */}
                <Route path="/form-k" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <FormK />
                  </Suspense>
                } />
                {/* Tenant signature page */}
                <Route path="/tenant-signature/:submissionId/:token" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <TenantSignature />
                  </Suspense>
                } />
                {/* Incident Report page */}
                <Route path="/incident-report" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <IncidentReport />
                  </Suspense>
                } />
                {/* Incident status portal (public) */}
                <Route path="/incident-status" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <IncidentStatus />
                  </Suspense>
                } />
                {/* Preferred Vendors page */}
                <Route path="/preferred-vendors" element={
                  <Suspense fallback={<LazyLoadingFallback />}>
                    <PreferredVendors />
                  </Suspense>
                } />
                {/* Form Acknowledgment page */}
                <Route path="/form-acknowledgment" element={<FormAcknowledgment />} />
                {/* Legacy information routes - redirect to new slugs */}
                <Route path="/information/recycling" element={<DynamicPage />} />
                <Route path="/information/organics" element={<DynamicPage />} />
                <Route path="/information/fees" element={<DynamicPage />} />
                <Route path="/information/renovations" element={<DynamicPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/not-found" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AdminAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
