import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Star, X, MapPin, Phone, Clock } from "lucide-react";
import { toast } from "sonner";

interface Driver {
  driverId: string;
  driverUserId: string;
  vehicleId: string;
  driverName: string;
  phone: string;
  vehicleModel: string;
  registrationNumber: string;
  rating: number;
  totalRides: number;
  distance: number;
  latitude: number;
  longitude: number;
}

const DriverMatching = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rideDetails, setRideDetails] = useState<any>(null);
  const [matchAttempts, setMatchAttempts] = useState(0);
  const [timeoutCountdown, setTimeoutCountdown] = useState(60); // 60 second timeout
  const autoAssignTimerRef = useRef<NodeJS.Timeout | null>(null);
  const matchRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!rideId) {
      toast.error("No ride request found");
      navigate("/passenger/home");
      return;
    }

    loadRideAndMatch();
    
    // Start timeout countdown
    const countdownInterval = setInterval(() => {
      setTimeoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Set up real-time subscription for ride status
    const channel = supabase
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
          if (updatedRide.status === 'accepted') {
            clearAllTimers();
            toast.success("Driver accepted your ride!");
            navigate("/passenger/ride-active", { state: { rideId } });
          } else if (updatedRide.status === 'cancelled') {
            clearAllTimers();
            toast.error("Ride was cancelled");
            navigate("/passenger/home");
          }
        }
      )
      .subscribe();

    return () => {
      clearAllTimers();
      clearInterval(countdownInterval);
      supabase.removeChannel(channel);
    };
  }, [rideId, navigate]);

  const clearAllTimers = () => {
    if (autoAssignTimerRef.current) {
      clearTimeout(autoAssignTimerRef.current);
      autoAssignTimerRef.current = null;
    }
    if (matchRetryTimerRef.current) {
      clearTimeout(matchRetryTimerRef.current);
      matchRetryTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  };

  const handleTimeout = async () => {
    toast.error("Request timed out. No drivers available.");
    await handleCancel();
  };

  const loadRideAndMatch = async () => {
    try {
      // Get ride details
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;
      setRideDetails(ride);

      // Match drivers
      const { data: matchData, error: matchError } = await supabase.functions.invoke(
        'match-driver',
        {
          body: {
            vehicleType: ride.vehicle_type,
            pickupLatitude: ride.pickup_latitude,
            pickupLongitude: ride.pickup_longitude,
            isShared: ride.is_shared,
          },
        }
      );

      if (matchError) {
        console.error('Match error:', matchError);
        throw new Error('Failed to find drivers');
      }

      if (matchData?.availableDrivers?.length > 0) {
        setDrivers(matchData.availableDrivers);
        setLoading(false);
        
        // Auto-assign to closest driver after 10 seconds
        autoAssignTimerRef.current = setTimeout(() => {
          autoAssignDriver(matchData.availableDrivers[0], ride);
        }, 10000);
      } else {
        // Retry matching with exponential backoff
        setMatchAttempts(prev => prev + 1);
        const retryDelay = Math.min(5000 * Math.pow(1.5, matchAttempts), 15000);
        
        if (matchAttempts < 4) {
          toast.info(`Searching for drivers... Retry ${matchAttempts + 1}/4`);
          matchRetryTimerRef.current = setTimeout(() => loadRideAndMatch(), retryDelay);
        } else {
          setLoading(false);
          toast.error("No drivers available after multiple attempts");
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to find drivers");
      setLoading(false);
    }
  };

  const autoAssignDriver = async (driver: Driver, ride: any) => {
    try {
      // Verify driver is still online before assigning
      const { data: driverCheck } = await supabase
        .from('drivers')
        .select('is_online')
        .eq('id', driver.driverId)
        .single();

      if (!driverCheck?.is_online) {
        toast.error("Driver is no longer available");
        // Remove this driver and try next
        setDrivers(prev => prev.filter(d => d.driverId !== driver.driverId));
        return;
      }

      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: driver.driverId,
          vehicle_id: driver.vehicleId,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', ride.id);

      if (error) throw error;
      
      clearAllTimers();
      toast.success(`${driver.driverName} is on the way!`);
      navigate("/passenger/ride-active", { state: { rideId: ride.id } });
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      toast.error("Failed to assign driver");
    }
  };

  const handleCancel = async () => {
    try {
      clearAllTimers();
      
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: (await supabase.auth.getUser()).data.user?.id,
          cancellation_reason: 'User cancelled',
        })
        .eq('id', rideId);

      if (error) throw error;
      
      toast.success("Ride cancelled");
      navigate("/passenger/home");
    } catch (error: any) {
      console.error('Error cancelling:', error);
      toast.error("Failed to cancel ride");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
        <h2 className="text-2xl font-bold mb-2">Finding nearby drivers...</h2>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <p className="text-muted-foreground">
            {timeoutCountdown}s remaining
          </p>
        </div>
        <p className="text-muted-foreground text-center mb-4">
          {matchAttempts > 0 ? `Retry attempt ${matchAttempts}/4` : "Please wait"}
        </p>
        <Button
          variant="outline"
          onClick={handleCancel}
          className="mt-2"
        >
          Cancel Request
        </Button>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <X className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">No drivers available</h2>
        <p className="text-muted-foreground text-center mb-6">
          All drivers are currently busy. Please try again later.
        </p>
        <Button onClick={() => navigate("/passenger/home")}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Finding Your Ride</h1>
        <p className="text-white/90">
          {drivers.length} driver{drivers.length > 1 ? 's' : ''} nearby
        </p>
      </div>

      {/* Trip Info */}
      <Card className="m-4 p-4 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-secondary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Pickup</p>
            <p className="font-medium">{rideDetails?.pickup_address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Drop-off</p>
            <p className="font-medium">{rideDetails?.dropoff_address}</p>
          </div>
        </div>
      </Card>

      {/* Available Drivers */}
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold mb-3">Available Drivers</h2>
        
        {drivers.map((driver) => (
          <Card key={driver.driverId} className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-primary text-white text-lg">
                  {driver.driverName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{driver.driverName}</h3>
                <p className="text-sm text-muted-foreground">
                  {driver.vehicleModel} • {driver.registrationNumber}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{driver.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {driver.totalRides} rides
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {driver.distance} km away
                  </span>
                </div>
              </div>
              
              <a href={`tel:${driver.phone}`}>
                <Button size="icon" variant="outline">
                  <Phone className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>

      {/* Auto-assign notice */}
      <div className="p-4">
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-center">
            Automatically assigning closest driver in a few seconds...
          </p>
        </Card>
      </div>

      {/* Cancel Button */}
      <div className="p-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="w-full"
        >
          Cancel Request
        </Button>
      </div>
    </div>
  );
};

export default DriverMatching;
