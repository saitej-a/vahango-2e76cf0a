import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export const useDriverLocation = (driverId: string | null) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!driverId) return;

    const fetchInitialLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('current_latitude, current_longitude')
          .eq('id', driverId)
          .single();

        if (error) throw error;

        if (data?.current_latitude && data?.current_longitude) {
          setLocation({
            lat: Number(data.current_latitude),
            lng: Number(data.current_longitude),
          });
        }
      } catch (error) {
        console.error('Error fetching driver location:', error);
      }
    };

    fetchInitialLocation();

    // Subscribe to real-time location updates
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driverId}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated.current_latitude && updated.current_longitude) {
            setLocation({
              lat: Number(updated.current_latitude),
              lng: Number(updated.current_longitude),
            });
            setIsTracking(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return { location, isTracking };
};
