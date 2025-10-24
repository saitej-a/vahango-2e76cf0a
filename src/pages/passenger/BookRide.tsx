import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, MapPin, Bike, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";

type VehicleType = "bike" | "auto" | "car";

const BookRide = () => {
  const navigate = useNavigate();
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>("auto");
  const [isShared, setIsShared] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  const vehicles = [
    {
      type: "bike" as VehicleType,
      name: "Bike",
      icon: Bike,
      price: "₹40-60",
      time: "5 min",
      capacity: 1,
      sharingAvailable: false,
    },
    {
      type: "auto" as VehicleType,
      name: "Auto",
      icon: Car,
      price: "₹60-90",
      time: "8 min",
      capacity: 3,
      sharingAvailable: true,
    },
    {
      type: "car" as VehicleType,
      name: "Car",
      icon: Car,
      price: "₹120-180",
      time: "10 min",
      capacity: 4,
      sharingAvailable: true,
    },
  ];

  const handleBookRide = async () => {
    if (!pickupAddress || !dropoffAddress) {
      toast.error("Please enter both pickup and drop-off locations");
      return;
    }

    try {
      setLoading(true);
      const { user } = await getCurrentUser();
      
      if (!user) {
        toast.error("Please login to book a ride");
        navigate("/login");
        return;
      }

      // For demo purposes, using placeholder coordinates
      // In production, these would come from Google Maps geocoding
      const pickupLat = 12.9716 + Math.random() * 0.01;
      const pickupLng = 77.5946 + Math.random() * 0.01;
      const dropoffLat = 12.9716 + Math.random() * 0.02;
      const dropoffLng = 77.5946 + Math.random() * 0.02;

      // Calculate estimated distance (mock calculation)
      const distance = Math.sqrt(
        Math.pow(dropoffLat - pickupLat, 2) + Math.pow(dropoffLng - pickupLng, 2)
      ) * 100; // Approximate km

      const duration = Math.ceil(distance * 3); // Approximate minutes

      // Call calculate-fare edge function
      const { data: fareData, error: fareError } = await supabase.functions.invoke(
        "calculate-fare",
        {
          body: {
            vehicleType: selectedVehicle,
            distance,
            duration,
            isShared,
            currentTime: new Date().toISOString(),
          },
        }
      );

      if (fareError) throw fareError;

      // Create ride request
      const { data: ride, error: rideError } = await supabase
        .from("rides")
        .insert({
          passenger_id: user.id,
          pickup_latitude: pickupLat,
          pickup_longitude: pickupLng,
          dropoff_latitude: dropoffLat,
          dropoff_longitude: dropoffLng,
          pickup_address: pickupAddress,
          dropoff_address: dropoffAddress,
          vehicle_type: selectedVehicle,
          is_shared: isShared,
          estimated_distance: distance,
          estimated_duration: duration,
          estimated_fare: fareData.estimatedFare,
          surge_multiplier: fareData.surgeMultiplier,
          special_instructions: specialInstructions,
          status: "requested",
        })
        .select()
        .single();

      if (rideError) throw rideError;

      toast.success("Ride booked successfully! Finding nearby drivers...");
      
      // Call match-driver edge function
      const { data: matchData, error: matchError } = await supabase.functions.invoke(
        "match-driver",
        {
          body: {
            vehicleType: selectedVehicle,
            pickupLatitude: pickupLat,
            pickupLongitude: pickupLng,
            isShared,
          },
        }
      );

      if (!matchError && matchData?.drivers?.length > 0) {
        toast.success(`Found ${matchData.drivers.length} available drivers nearby!`);
      }

      navigate("/passenger/home");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to book ride");
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicleData = vehicles.find((v) => v.type === selectedVehicle);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => navigate("/passenger/home")}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Book a Ride</h1>
      </div>

      {/* Map Placeholder */}
      <div className="h-64 bg-muted relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-primary animate-pulse-marker" />
            <p className="text-muted-foreground">Map will appear here</p>
            <p className="text-xs text-muted-foreground mt-1">Google Maps integration pending</p>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="p-6 space-y-6">
        {/* Locations */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="pickup">Pickup Location</Label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
              <Input
                id="pickup"
                placeholder="Enter pickup location"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dropoff">Drop-off Location</Label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
              <Input
                id="dropoff"
                placeholder="Enter destination"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div>
          <Label className="mb-3 block">Select Vehicle</Label>
          <div className="grid grid-cols-3 gap-3">
            {vehicles.map((vehicle) => {
              const Icon = vehicle.icon;
              const isSelected = selectedVehicle === vehicle.type;
              return (
                <Card
                  key={vehicle.type}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedVehicle(vehicle.type)}
                >
                  <Icon
                    className={`w-6 h-6 mx-auto mb-2 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <p
                    className={`text-sm font-semibold text-center ${
                      isSelected ? "text-primary" : ""
                    }`}
                  >
                    {vehicle.name}
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {vehicle.price}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {vehicle.time}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Shared Ride Option */}
        {selectedVehicleData?.sharingAvailable && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Share Ride</p>
                <p className="text-sm text-muted-foreground">
                  Save up to 30% by sharing
                </p>
              </div>
              <Switch checked={isShared} onCheckedChange={setIsShared} />
            </div>
          </Card>
        )}

        {/* Special Instructions */}
        <div>
          <Label htmlFor="instructions">Special Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            placeholder="Any special requirements..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="mt-2 min-h-[80px]"
          />
        </div>

        {/* Book Button */}
        <Button
          onClick={handleBookRide}
          disabled={loading}
          className="w-full h-12 text-lg font-semibold bg-gradient-primary"
        >
          {loading ? "Booking..." : "Book Ride"}
        </Button>
      </div>
    </div>
  );
};

export default BookRide;
