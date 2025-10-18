import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, Navigation, Bike, Car, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const BookRide = () => {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [isShared, setIsShared] = useState(false);

  const vehicles = [
    { id: "bike", name: "Bike", icon: Bike, price: 45, time: "3 mins", color: "text-primary" },
    { id: "auto", name: "Auto", icon: Car, price: 98, time: "5 mins", color: "text-secondary" },
    { id: "car", name: "Car", icon: Car, price: 156, time: "7 mins", color: "text-accent" },
  ];

  const handleBookRide = () => {
    if (!selectedVehicle) {
      toast.error("Please select a vehicle type");
      return;
    }
    toast.success("Finding nearby drivers...");
    // TODO: Implement ride matching
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Map Area Placeholder */}
      <div className="h-[40vh] bg-gradient-to-br from-primary/20 to-secondary/20 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-white shadow-lg"
          onClick={() => navigate("/passenger/home")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Map will be integrated here</p>
        </div>
      </div>

      {/* Booking Details */}
      <div className="flex-1 bg-white rounded-t-3xl -mt-6 p-6 shadow-2xl">
        {/* Location Inputs */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-secondary w-3 h-3 rounded-full animate-pulse-marker" />
            <Input
              placeholder="Pickup location"
              defaultValue="Koramangala, Bengaluru"
              className="h-12"
            />
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-destructive" />
            <Input
              placeholder="Where to?"
              defaultValue="Indiranagar, Bengaluru"
              className="h-12"
            />
          </div>
        </div>

        {/* Distance & Time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Navigation className="w-4 h-4" />
          <span>5.2 km • Estimated 15 mins</span>
        </div>

        {/* Vehicle Selection */}
        <h3 className="font-semibold text-lg mb-4">Select Vehicle</h3>
        <div className="space-y-3 mb-6">
          {vehicles.map((vehicle) => {
            const Icon = vehicle.icon;
            const isSelected = selectedVehicle === vehicle.id;
            return (
              <Card
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected ? "border-2 border-primary shadow-primary" : "hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon className={`w-6 h-6 ${isSelected ? vehicle.color : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-semibold">{vehicle.name}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.time} away</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{vehicle.price}</p>
                    {vehicle.id !== "bike" && (
                      <p className="text-xs text-muted-foreground">1-4 seats</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Shared Ride Toggle */}
        {selectedVehicle && selectedVehicle !== "bike" && (
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Shared Ride</p>
                  <p className="text-sm text-muted-foreground">Save up to 40%</p>
                </div>
              </div>
              <button
                onClick={() => setIsShared(!isShared)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isShared ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isShared ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </Card>
        )}

        {/* Book Ride Button */}
        <Button
          onClick={handleBookRide}
          className="w-full h-14 text-lg font-semibold bg-gradient-primary"
        >
          Book {selectedVehicle ? vehicles.find(v => v.id === selectedVehicle)?.name : "Ride"}
        </Button>
      </div>
    </div>
  );
};

export default BookRide;
