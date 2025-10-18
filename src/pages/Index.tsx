import { Button } from "@/components/ui/button";
import { Car, Bike, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-primary">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center text-white">
        <div className="mb-8">
          <Car className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-5xl font-bold mb-3">VahanGo</h1>
          <p className="text-xl opacity-90">Ride Anywhere, Anytime</p>
        </div>
        
        <p className="text-lg mb-12 max-w-md opacity-80">
          Book bikes, autos, or cars in seconds. Safe, affordable, and reliable transportation at your fingertips.
        </p>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl w-full">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Bike className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Bikes</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Autos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Car className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Cars</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button 
            onClick={() => navigate("/login")}
            size="lg"
            className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold text-lg h-14"
          >
            Login
          </Button>
          <Button 
            onClick={() => navigate("/signup")}
            size="lg"
            variant="outline"
            className="flex-1 border-2 border-white text-white hover:bg-white/10 font-semibold text-lg h-14"
          >
            Sign Up
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-white/70 py-6 text-sm">
        © 2025 VahanGo. All rights reserved.
      </div>
    </div>
  );
};

export default Index;
