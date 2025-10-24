import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, History, Wallet, Gift, User, Search, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const PassengerHome = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { user } = await getCurrentUser();
        if (user) {
          // Fetch user profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();
          
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }

          // Fetch recent trips
          const { data: trips } = await supabase
            .from("rides")
            .select("*")
            .eq("passenger_id", user.id)
            .order("created_at", { ascending: false })
            .limit(2);
          
          if (trips) {
            setRecentTrips(trips);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-sm opacity-80">Hello,</h2>
            <h1 className="text-2xl font-bold">{userName}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/profile")}
          >
            <User className="w-6 h-6" />
          </Button>
        </div>

        {/* Search Bar */}
        <div
          onClick={() => navigate("/passenger/book-ride")}
          className="bg-white text-foreground rounded-xl p-4 flex items-center gap-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        >
          <Search className="w-5 h-5 text-primary" />
          <span className="text-muted-foreground">Where to?</span>
        </div>
      </div>

      {/* Saved Locations */}
      <div className="px-6 -mt-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-2 rounded-lg">
                <Home className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Home</p>
                <p className="text-xs text-muted-foreground">Add address</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm">Work</p>
                <p className="text-xs text-muted-foreground">Add address</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="px-6 mb-6">
        <Card className="bg-gradient-secondary text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg mb-1">First Ride Offer!</h3>
              <p className="text-sm opacity-90">Get 50% off on your first ride</p>
              <p className="text-xs font-semibold mt-2">Use code: FIRST50</p>
            </div>
            <Gift className="w-12 h-12 opacity-80" />
          </div>
        </Card>
      </div>

      {/* Recent Trips */}
      <div className="px-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-lg">Recent Trips</h3>
          <button
            onClick={() => navigate("/passenger/trips")}
            className="text-sm text-primary hover:underline"
          >
            View All
          </button>
        </div>
        {loading ? (
          <Card className="p-4">
            <p className="text-muted-foreground text-center">Loading trips...</p>
          </Card>
        ) : recentTrips.length > 0 ? (
          <Card className="p-4 space-y-3">
            {recentTrips.map((trip) => (
              <div key={trip.id} className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{trip.pickup_address} to {trip.dropoff_address}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trip.created_at).toLocaleDateString()} • {new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="font-semibold">₹{trip.final_fare || trip.estimated_fare}</p>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No trips yet</p>
            <p className="text-sm text-muted-foreground mt-1">Book your first ride to get started!</p>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto border-t border-border bg-card">
        <div className="flex items-center justify-around p-4">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate("/passenger/trips")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <History className="w-6 h-6" />
            <span className="text-xs font-medium">Trips</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary">
            <Wallet className="w-6 h-6" />
            <span className="text-xs font-medium">Wallet</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary">
            <Gift className="w-6 h-6" />
            <span className="text-xs font-medium">Offers</span>
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary"
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PassengerHome;
