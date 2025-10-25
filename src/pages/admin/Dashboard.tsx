import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Car, DollarSign, Activity, TrendingUp, MapPin } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    activeRides: 0,
    totalRevenue: 0,
    todayRides: 0,
    onlineDrivers: 0,
  });
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get drivers stats
      const { data: drivers, count: driversCount } = await supabase
        .from('drivers')
        .select('*', { count: 'exact' });

      const onlineDrivers = drivers?.filter(d => d.is_online).length || 0;
      const pendingDriversList = drivers?.filter(d => d.status === 'pending') || [];

      // Get rides stats
      const { data: rides } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const activeRides = rides?.filter(r => ['requested', 'accepted', 'in_progress'].includes(r.status)).length || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const todayRides = rides?.filter(r => r.created_at.startsWith(today)).length || 0;

      // Get revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount');

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalDrivers: driversCount || 0,
        activeRides,
        totalRevenue,
        todayRides,
        onlineDrivers,
      });

      setRecentRides(rides || []);
      setPendingDrivers(pendingDriversList);
      setLoading(false);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error("Failed to load dashboard data");
      setLoading(false);
    }
  };

  const handleApproveDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: 'approved' })
        .eq('id', driverId);

      if (error) throw error;
      
      toast.success("Driver approved!");
      loadDashboardData();
    } catch (error: any) {
      console.error('Error approving driver:', error);
      toast.error("Failed to approve driver");
    }
  };

  const handleRejectDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ status: 'rejected' })
        .eq('id', driverId);

      if (error) throw error;
      
      toast.success("Driver rejected");
      loadDashboardData();
    } catch (error: any) {
      console.error('Error rejecting driver:', error);
      toast.error("Failed to reject driver");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white p-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white/80">VahanGo Platform Management</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drivers</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold">{stats.onlineDrivers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.activeRides}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{stats.todayRides}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">₹{Math.round(stats.totalRevenue)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rides" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rides">Recent Rides</TabsTrigger>
            <TabsTrigger value="drivers">Pending Drivers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="rides" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Ride Activity</h2>
              {recentRides.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No rides yet</p>
              ) : (
                <div className="space-y-3">
                  {recentRides.map((ride) => (
                    <div key={ride.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{ride.pickup_address}</p>
                        <p className="text-sm text-muted-foreground">to {ride.dropoff_address}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ride.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          ride.status === 'completed' ? 'default' :
                          ride.status === 'started' ? 'secondary' :
                          ride.status === 'cancelled' ? 'destructive' :
                          'outline'
                        }>
                          {ride.status}
                        </Badge>
                        <p className="text-sm font-semibold mt-1">₹{ride.estimated_fare?.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Driver Verification Queue</h2>
              {pendingDrivers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending verifications</p>
              ) : (
                <div className="space-y-3">
                  {pendingDrivers.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Driver ID: {driver.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          License: {driver.license_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Applied: {new Date(driver.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectDriver(driver.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveDriver(driver.id)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Platform Analytics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Avg Ride Value</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.todayRides > 0 ? Math.round(stats.totalRevenue / stats.todayRides) : 0}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Driver Utilization</p>
                  <p className="text-2xl font-bold">
                    {stats.totalDrivers > 0 ? Math.round((stats.onlineDrivers / stats.totalDrivers) * 100) : 0}%
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
