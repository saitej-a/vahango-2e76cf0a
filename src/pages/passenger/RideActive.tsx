import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Phone, MessageSquare, Star, Navigation, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const RideActive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId } = location.state || {};
  const [ride, setRide] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!rideId) {
      toast.error("No active ride found");
      navigate("/passenger/home");
      return;
    }

    loadRideDetails();

    // Real-time ride updates
    const rideChannel = supabase
      .channel(`ride-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`
        },
        (payload) => {
          const updatedRide = payload.new;
          setRide(updatedRide);
          
          if (updatedRide.status === 'completed') {
            toast.success("Ride completed!");
            navigate("/passenger/rate", { state: { rideId } });
          } else if (updatedRide.status === 'cancelled') {
            toast.error("Ride was cancelled");
            navigate("/passenger/home");
          } else if (updatedRide.status === 'started') {
            toast.success("Ride started!");
          }
        }
      )
      .subscribe();

    // Real-time location updates
    const locationChannel = supabase
      .channel(`ride-locations-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_locations',
          filter: `ride_id=eq.${rideId}`
        },
        (payload) => {
          const location = payload.new;
          setDriverLocation({
            lat: location.latitude,
            lng: location.longitude,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rideChannel);
      supabase.removeChannel(locationChannel);
    };
  }, [rideId, navigate]);

  const loadRideDetails = async () => {
    try {
      // Get ride details
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;
      setRide(rideData);

      if (!rideData.driver_id) {
        toast.error("No driver assigned");
        navigate("/passenger/home");
        return;
      }

      // Get driver details
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', rideData.driver_id)
        .single();

      if (driverError) throw driverError;
      setDriver(driverData);
      
      if (driverData.current_latitude && driverData.current_longitude) {
        setDriverLocation({
          lat: driverData.current_latitude,
          lng: driverData.current_longitude,
        });
      }

      // Get driver profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', driverData.user_id)
        .single();

      setProfile(profileData);

      // Get vehicle details
      if (rideData.vehicle_id) {
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', rideData.vehicle_id)
          .single();

        setVehicle(vehicleData);
      }
    } catch (error: any) {
      console.error('Error loading ride:', error);
      toast.error("Failed to load ride details");
    }
  };

  const handleEmergency = () => {
    toast.error("Emergency services contacted!");
    // In production, this would trigger emergency protocols
  };

  if (!ride || !driver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading ride details...</p>
        </div>
      </div>
    );
  }

  const getStatusText = () => {
    switch (ride.status) {
      case 'accepted':
        return 'Driver is on the way';
      case 'started':
        return 'Trip in progress';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = () => {
    switch (ride.status) {
      case 'accepted':
        return 'text-yellow-600';
      case 'started':
        return 'text-secondary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Map Placeholder */}
      <div className="h-80 bg-muted relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Navigation className="w-12 h-12 mx-auto mb-2 text-primary animate-pulse" />
            <p className="text-muted-foreground">Live tracking map</p>
            {driverLocation && (
              <p className="text-xs text-muted-foreground mt-1">
                Driver: {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-primary text-white p-4 text-center">
        <p className={`text-lg font-semibold ${getStatusColor()}`}>
          {getStatusText()}
        </p>
      </div>

      {/* Driver Info */}
      <Card className="m-4 p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary text-white text-xl">
              {profile?.full_name?.charAt(0) || 'D'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg">{profile?.full_name || 'Driver'}</h3>
            <p className="text-sm text-muted-foreground">
              {vehicle?.model || 'Vehicle'} • {vehicle?.registration_number || 'N/A'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{driver.rating?.toFixed(1) || 'N/A'}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {driver.total_rides || 0} rides
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <a href={`tel:${profile?.phone}`}>
              <Button size="icon" variant="outline">
                <Phone className="w-4 h-4" />
              </Button>
            </a>
            <Button size="icon" variant="outline">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Trip Details */}
      <Card className="m-4 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-secondary mt-1" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Pickup</p>
            <p className="font-medium">{ride.pickup_address}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-destructive mt-1" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Drop-off</p>
            <p className="font-medium">{ride.dropoff_address}</p>
          </div>
        </div>

        <div className="pt-3 border-t flex justify-between">
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
            <p className="font-semibold">₹{ride.estimated_fare?.toFixed(0)}</p>
          </div>
        </div>
      </Card>

      {/* Emergency Button */}
      <div className="p-4">
        <Button
          variant="destructive"
          onClick={handleEmergency}
          className="w-full"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Emergency SOS
        </Button>
      </div>

      {/* Share Ride */}
      <div className="p-4 pt-0">
        <Button
          variant="outline"
          onClick={() => toast.success("Share link copied!")}
          className="w-full"
        >
          Share Ride
        </Button>
      </div>
    </div>
  );
};

export default RideActive;
