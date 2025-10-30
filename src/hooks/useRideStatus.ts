import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type RideStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

interface RideStatusUpdate {
  status: RideStatus;
  updatedAt: string;
}

export const useRideStatus = (rideId: string | null) => {
  const [status, setStatus] = useState<RideStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rideId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('status')
          .eq('id', rideId)
          .single();

        if (error) throw error;
        setStatus(data.status as RideStatus);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ride status:', error);
        setLoading(false);
      }
    };

    fetchStatus();

    // Subscribe to real-time status updates
    const channel = supabase
      .channel(`ride-status-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as RideStatus;
          setStatus(newStatus);
          
          // Show notifications for status changes
          switch (newStatus) {
            case 'accepted':
              toast.success('Driver accepted your ride!');
              break;
            case 'in_progress':
              toast.success('Your ride has started!');
              break;
            case 'completed':
              toast.success('Ride completed!');
              break;
            case 'cancelled':
              toast.error('Ride was cancelled');
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  return { status, loading };
};
