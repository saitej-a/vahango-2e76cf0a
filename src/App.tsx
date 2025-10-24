import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import VerifyOTP from "./pages/auth/VerifyOTP";
import PassengerHome from "./pages/passenger/Home";
import PassengerBookRide from "./pages/passenger/BookRide";
import PassengerTrips from "./pages/passenger/Trips";
import DriverHome from "./pages/driver/Home";
import DriverTrips from "./pages/driver/Trips";
import DriverEarnings from "./pages/driver/Earnings";
import AdminDashboard from "./pages/admin/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          
          {/* Protected Passenger Routes */}
          <Route path="/passenger/home" element={<ProtectedRoute><PassengerHome /></ProtectedRoute>} />
          <Route path="/passenger/book-ride" element={<ProtectedRoute><PassengerBookRide /></ProtectedRoute>} />
          <Route path="/passenger/trips" element={<ProtectedRoute><PassengerTrips /></ProtectedRoute>} />
          
          {/* Protected Driver Routes */}
          <Route path="/driver/home" element={<ProtectedRoute><DriverHome /></ProtectedRoute>} />
          <Route path="/driver/trips" element={<ProtectedRoute><DriverTrips /></ProtectedRoute>} />
          <Route path="/driver/earnings" element={<ProtectedRoute><DriverEarnings /></ProtectedRoute>} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          
          {/* Protected Shared Routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
