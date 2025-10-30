import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseLocationTrackingProps {
  driverId?: string;
  rideId?: string;
  enabled: boolean;
  updateInterval?: number; // in milliseconds
}

export const useLocationTracking = ({
  driverId,
  rideId,
  enabled,
  updateInterval = 5000,
}: UseLocationTrackingProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    if (!driverId) return;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    try {
      // Update driver's current location
      const { error: driverError } = await supabase
        .rpc('update_driver_location', {
          driver_id_param: driverId,
          lat,
          lng,
        });

      if (driverError) throw driverError;

      // Record ride location history if ride is active
      if (rideId) {
        const { error: rideError } = await supabase
          .rpc('record_ride_location', {
            ride_id_param: rideId,
            lat,
            lng,
          });

        if (rideError) throw rideError;
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [driverId, rideId]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to track location');
      },
      {
        enableHighAccuracy: true,
        maximumAge: updateInterval,
        timeout: 10000,
      }
    );

    setIsTracking(true);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [updateLocation, updateInterval]);

  useEffect(() => {
    if (enabled && driverId) {
      const cleanup = startTracking();
      return cleanup;
    }
  }, [enabled, driverId, startTracking]);

  return { isTracking, lastUpdate };
};
