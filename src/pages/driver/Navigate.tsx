import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Phone, Navigation as NavigationIcon, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Map from "@/components/Map";
import { useLocationTracking } from "@/hooks/useLocationTracking";

const Navigate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId } = location.state || {};
  const [ride, setRide] = useState<any>(null);
  const [passenger, setPassenger] = useState<any>(null);
  const [driverId, setDriverId] = useState<string | null>(null);

  // Enable real-time location tracking for driver
  const { isTracking } = useLocationTracking({
    driverId: driverId || undefined,
    rideId: rideId || undefined,
    enabled: !!driverId && !!rideId && ride?.status !== 'completed',
  });

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
      
      // Set driver ID for location tracking
      if (rideData.driver_id) {
        setDriverId(rideData.driver_id);
      }

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
      {/* Navigation Map */}
      <div className="h-80">
        <Map
          center={{ lat: ride.pickup_latitude, lng: ride.pickup_longitude }}
          showDirections={true}
          origin={{ lat: ride.pickup_latitude, lng: ride.pickup_longitude }}
          destination={{ lat: ride.dropoff_latitude, lng: ride.dropoff_longitude }}
          markers={[
            {
              position: { lat: ride.pickup_latitude, lng: ride.pickup_longitude },
              label: "Pickup",
              icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
            },
            {
              position: { lat: ride.dropoff_latitude, lng: ride.dropoff_longitude },
              label: "Drop",
              icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            },
          ]}
          zoom={14}
          height="320px"
        />
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
