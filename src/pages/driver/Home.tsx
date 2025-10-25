import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, DollarSign, Star, TrendingUp, Navigation, Phone, MessageSquare, X, Check } from "lucide-react";
import { toast } from "sonner";

const DriverHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [acceptCountdown, setAcceptCountdown] = useState(30);

  useEffect(() => {
    loadDriverData();
    
    // Real-time ride request subscription
    const channel = supabase
      .channel('ride-requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rides',
          filter: `status=eq.requested`
        },
        (payload) => {
          checkForMatchingRequest(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (pendingRequest && acceptCountdown > 0) {
      const timer = setTimeout(() => setAcceptCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (pendingRequest && acceptCountdown === 0) {
      handleDecline();
    }
  }, [pendingRequest, acceptCountdown]);

  const loadDriverData = async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get driver profile
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (driverError) throw driverError;
      
      if (!driverData) {
        toast.error("Driver profile not found. Please complete registration.");
        navigate("/driver/register");
        return;
      }

      setDriver(driverData);
      setIsOnline(driverData.is_online || false);

      // Calculate today's earnings
      const today = new Date().toISOString().split('T')[0];
      const { data: earnings } = await supabase
        .from('transactions')
        .select('driver_earnings')
        .eq('user_id', user.id)
        .gte('created_at', today);

      const total = earnings?.reduce((sum, t) => sum + (Number(t.driver_earnings) || 0), 0) || 0;
      setTodayEarnings(total);

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading driver data:', error);
      toast.error("Failed to load driver data");
      setLoading(false);
    }
  };

  const checkForMatchingRequest = async (ride: any) => {
    if (!isOnline || !driver) return;

    // Check if this ride matches driver's vehicle type
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('driver_id', driver.id)
      .eq('vehicle_type', ride.vehicle_type)
      .eq('is_active', true)
      .single();

    if (vehicles) {
      setPendingRequest(ride);
      setAcceptCountdown(30);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      const { error } = await supabase
        .from('drivers')
        .update({ is_online: newStatus })
        .eq('id', driver.id);

      if (error) throw error;
      
      setIsOnline(newStatus);
      toast.success(newStatus ? "You're now online" : "You're now offline");
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error("Failed to update status");
    }
  };

  const handleAccept = async () => {
    try {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id')
        .eq('driver_id', driver.id)
        .eq('vehicle_type', pendingRequest.vehicle_type)
        .single();

      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: driver.id,
          vehicle_id: vehicle?.id,
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', pendingRequest.id);

      if (error) throw error;

      toast.success("Ride accepted!");
      navigate("/driver/navigate", { state: { rideId: pendingRequest.id } });
      setPendingRequest(null);
    } catch (error: any) {
      console.error('Error accepting ride:', error);
      toast.error("Failed to accept ride");
    }
  };

  const handleDecline = () => {
    setPendingRequest(null);
    setAcceptCountdown(30);
    toast.info("Ride request declined");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pendingRequest) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Ride Request Modal */}
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Navigation className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">New Ride Request!</h2>
              <p className="text-4xl font-bold text-destructive mb-1">{acceptCountdown}s</p>
              <p className="text-sm text-muted-foreground">Auto-decline in</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-secondary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">{pendingRequest.pickup_address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-destructive mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Drop-off</p>
                  <p className="font-medium">{pendingRequest.dropoff_address}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-semibold">{pendingRequest.estimated_distance?.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{pendingRequest.estimated_duration} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fare</p>
                  <p className="font-semibold text-secondary">₹{pendingRequest.estimated_fare?.toFixed(0)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleDecline}
                className="h-12"
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                className="h-12 bg-secondary"
              >
                <Check className="w-4 h-4 mr-2" />
                Accept
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Driver Dashboard</h1>
            <p className="text-white/80 text-sm mt-1">
              {driver.rating ? `${driver.rating.toFixed(1)} ⭐` : 'New Driver'} • {driver.total_rides || 0} rides
            </p>
          </div>
          <Avatar className="w-12 h-12 border-2 border-white">
            <AvatarFallback className="bg-white text-primary text-xl">
              D
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Online Toggle */}
        <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-secondary' : 'bg-gray-400'}`}></div>
              <div>
                <p className="font-semibold text-white">
                  {isOnline ? "You're Online" : "You're Offline"}
                </p>
                <p className="text-xs text-white/70">
                  {isOnline ? "Ready to receive ride requests" : "Not receiving requests"}
                </p>
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={toggleOnlineStatus}
            />
          </div>
        </Card>
      </div>

      <div className="p-6 space-y-4">
        {/* Earnings Card */}
        <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Today's Earnings</p>
            <DollarSign className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-secondary">₹{todayEarnings.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {driver.total_rides || 0} total rides completed
          </p>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-xl font-bold">{driver.rating?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acceptance</p>
                <p className="text-xl font-bold">95%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Message */}
        {!isOnline && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              💡 Go online to start receiving ride requests
            </p>
          </Card>
        )}

        {isOnline && (
          <Card className="p-4 bg-secondary/5 border-secondary/20">
            <p className="text-sm text-secondary font-medium text-center">
              Waiting for ride requests...
            </p>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate("/driver/trips")}
            className="h-14"
          >
            View Trips
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/driver/earnings")}
            className="h-14"
          >
            Earnings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DriverHome;
