import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DriverEarnings = () => {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) return;

      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allTransactions) {
        setTransactions(allTransactions);

        const todayEarnings = allTransactions
          .filter(t => new Date(t.created_at) >= new Date(today.setHours(0, 0, 0, 0)))
          .reduce((sum, t) => sum + (Number(t.driver_earnings) || 0), 0);

        const weekEarnings = allTransactions
          .filter(t => new Date(t.created_at) >= weekAgo)
          .reduce((sum, t) => sum + (Number(t.driver_earnings) || 0), 0);

        const monthEarnings = allTransactions
          .filter(t => new Date(t.created_at) >= monthAgo)
          .reduce((sum, t) => sum + (Number(t.driver_earnings) || 0), 0);

        const totalEarnings = allTransactions
          .reduce((sum, t) => sum + (Number(t.driver_earnings) || 0), 0);

        setEarnings({
          today: todayEarnings,
          week: weekEarnings,
          month: monthEarnings,
          total: totalEarnings,
        });
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error loading earnings:', error);
      toast.error("Failed to load earnings");
      setLoading(false);
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
        <h1 className="text-2xl font-bold mb-2">Earnings</h1>
        <p className="text-white/80">Track your income and payouts</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-secondary/10 to-secondary/5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-secondary" />
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
            <p className="text-2xl font-bold text-secondary">₹{earnings.today.toFixed(0)}</p>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
            <p className="text-2xl font-bold text-primary">₹{earnings.week.toFixed(0)}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">This Month</p>
            </div>
            <p className="text-2xl font-bold">₹{earnings.month.toFixed(0)}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">All Time</p>
            </div>
            <p className="text-2xl font-bold">₹{earnings.total.toFixed(0)}</p>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {transaction.payment_method.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary">
                      +₹{transaction.driver_earnings?.toFixed(0) || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.payment_status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DriverEarnings;
