import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Phone, Navigation as NavigationIcon, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const Navigate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId } = location.state || {};
  const [ride, setRide] = useState<any>(null);
  const [passenger, setPassenger] = useState<any>(null);

  useEffect(() => {
    if (!rideId) {
      navigate("/driver/home");
      return;
    }

    loadRideDetails();
  }, [rideId]);

  const loadRideDetails = async () => {
    try {
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;
      setRide(rideData);

      const { data: passengerData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', rideData.passenger_id)
        .single();

      setPassenger(passengerData);
    } catch (error: any) {
      console.error('Error loading ride:', error);
      toast.error("Failed to load ride details");
    }
  };

  const handleStartTrip = async () => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', rideId);

      if (error) throw error;
      
      toast.success("Trip started!");
      setRide({ ...ride, status: 'in_progress' });
    } catch (error: any) {
      console.error('Error starting trip:', error);
      toast.error("Failed to start trip");
    }
  };

  const handleCompleteTrip = async () => {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          final_fare: ride.estimated_fare,
        })
        .eq('id', rideId);

      if (error) throw error;
      
      toast.success("Trip completed!");
      navigate("/driver/home");
    } catch (error: any) {
      console.error('Error completing trip:', error);
      toast.error("Failed to complete trip");
    }
  };

  if (!ride) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Map Placeholder */}
      <div className="h-80 bg-muted relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <NavigationIcon className="w-12 h-12 mx-auto mb-2 text-primary animate-pulse" />
            <p className="text-muted-foreground">Navigation map</p>
            <p className="text-xs text-muted-foreground mt-1">Turn-by-turn directions</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-primary text-white p-4 text-center">
        <p className="text-lg font-semibold">
          {ride.status === 'accepted' && 'Navigate to Pickup'}
          {ride.status === 'in_progress' && 'Trip in Progress'}
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Passenger Info */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Passenger</h3>
            <a href={`tel:${passenger?.phone}`}>
              <Button size="sm" variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            </a>
          </div>
          <p className="font-medium text-lg">{passenger?.full_name || 'Passenger'}</p>
          <p className="text-sm text-muted-foreground">{passenger?.phone}</p>
        </Card>

        {/* Trip Details */}
        <Card className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-secondary mt-1" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Pickup Location</p>
              <p className="font-medium">{ride.pickup_address}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-destructive mt-1" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Drop-off Location</p>
              <p className="font-medium">{ride.dropoff_address}</p>
            </div>
          </div>

          <div className="pt-3 border-t grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Distance</p>
              <p className="font-semibold">{ride.estimated_distance?.toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-semibold">{ride.estimated_duration} min</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fare</p>
              <p className="font-semibold text-secondary">₹{ride.estimated_fare?.toFixed(0)}</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        {ride.status === 'accepted' && (
          <Button
            onClick={handleStartTrip}
            className="w-full h-12 bg-secondary"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Start Trip
          </Button>
        )}

        {ride.status === 'in_progress' && (
          <Button
            onClick={handleCompleteTrip}
            className="w-full h-12 bg-gradient-primary"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Complete Trip
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navigate;
