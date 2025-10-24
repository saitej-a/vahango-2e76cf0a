import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";

const PassengerTrips = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const { user } = await getCurrentUser();
        if (user) {
          const { data, error } = await supabase
            .from("rides")
            .select("*")
            .eq("passenger_id", user.id)
            .order("created_at", { ascending: false });

          if (error) throw error;
          setTrips(data || []);
        }
      } catch (error) {
        console.error("Error loading trips:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-secondary";
      case "requested":
        return "bg-accent";
      case "accepted":
        return "bg-primary";
      case "in_progress":
        return "bg-primary";
      case "cancelled":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "requested":
        return "Finding Driver";
      case "accepted":
        return "Driver Assigned";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

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
        <h1 className="text-xl font-bold">My Trips</h1>
      </div>

      {/* Trips List */}
      <div className="p-6 space-y-4">
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading trips...</p>
          </Card>
        ) : trips.length > 0 ? (
          trips.map((trip) => (
            <Card key={trip.id} className="p-4 space-y-3">
              {/* Trip Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getStatusColor(trip.status)}>
                      {getStatusText(trip.status)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {trip.vehicle_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trip.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {" • "}
                    {new Date(trip.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {trip.final_fare && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ₹{trip.final_fare}
                    </p>
                  </div>
                )}
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pickup</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.pickup_address}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Drop-off</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.dropoff_address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="flex items-center gap-4 pt-2 border-t">
                {trip.estimated_distance && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{trip.estimated_distance.toFixed(1)} km</span>
                  </div>
                )}
                {trip.estimated_duration && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{trip.estimated_duration} min</span>
                  </div>
                )}
                {trip.is_shared && (
                  <Badge variant="secondary" className="text-xs">
                    Shared
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              {trip.status === "completed" && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Star className="w-4 h-4 mr-1" />
                    Rate Driver
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Receipt
                  </Button>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">No trips yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your ride history will appear here
            </p>
            <Button
              onClick={() => navigate("/passenger/home")}
              className="mt-4"
            >
              Book a Ride
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PassengerTrips;
