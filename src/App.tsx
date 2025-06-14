
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { OrderProvider } from "./contexts/OrderContext";
import { RiderProvider } from "./contexts/RiderContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RiderRegistrationPage from "./pages/RiderRegistrationPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import RiderDashboardPage from "./pages/RiderDashboardPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter> {/* Moved BrowserRouter to wrap AuthProvider and other context providers that might use router hooks */}
        <AuthProvider>
          <OrderProvider>
            <RiderProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {/* Routes are now correctly nested within BrowserRouter and other providers */}
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/rider-registration" element={<RiderRegistrationPage />} />
                  <Route path="/customer-dashboard" element={<CustomerDashboardPage />} />
                  <Route path="/rider-dashboard" element={<RiderDashboardPage />} />
                  <Route path="/order/:id" element={<OrderDetailsPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </RiderProvider>
          </OrderProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

