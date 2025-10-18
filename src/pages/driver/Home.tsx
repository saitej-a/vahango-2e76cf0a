import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DriverHome = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-primary text-white p-6">
        <h1 className="text-2xl font-bold">Driver Dashboard</h1>
      </div>
      <div className="p-6">
        <Card className="p-6">
          <p className="font-semibold">Today's Earnings: ₹2,450</p>
        </Card>
        <Button onClick={() => navigate("/")} className="mt-4">Go Offline</Button>
      </div>
    </div>
  );
};
export default DriverHome;
