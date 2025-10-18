import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PassengerTrips = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-white p-6">
        <button onClick={() => navigate("/passenger/home")} className="mb-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">Trip History</h1>
      </div>
      <div className="p-6">
        <Card className="p-4 mb-3">
          <div className="flex justify-between mb-2">
            <p className="font-semibold">Koramangala to Indiranagar</p>
            <p className="font-bold">₹156</p>
          </div>
          <p className="text-sm text-muted-foreground">Dec 15, 2024 • Auto</p>
        </Card>
      </div>
    </div>
  );
};
export default PassengerTrips;
