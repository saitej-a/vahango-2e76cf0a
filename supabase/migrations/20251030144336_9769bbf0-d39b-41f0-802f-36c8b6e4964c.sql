-- Enable Realtime identity for tables (skip if already exists)
DO $$
BEGIN
  ALTER TABLE rides REPLICA IDENTITY FULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE drivers REPLICA IDENTITY FULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE ride_locations REPLICA IDENTITY FULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_online_location ON drivers(is_online, current_latitude, current_longitude) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_rides_status_requested ON rides(status, requested_at) WHERE status = 'requested';
CREATE INDEX IF NOT EXISTS idx_ride_locations_ride_time ON ride_locations(ride_id, recorded_at DESC);

-- Add geofencing radius column to drivers
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS geofence_radius numeric DEFAULT 5.0;

-- Function to update driver location
CREATE OR REPLACE FUNCTION update_driver_location(
  driver_id_param uuid,
  lat numeric,
  lng numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE drivers
  SET 
    current_latitude = lat,
    current_longitude = lng,
    updated_at = NOW()
  WHERE id = driver_id_param;
END;
$$;

-- Function to record ride location history
CREATE OR REPLACE FUNCTION record_ride_location(
  ride_id_param uuid,
  lat numeric,
  lng numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO ride_locations (ride_id, latitude, longitude)
  VALUES (ride_id_param, lat, lng);
END;
$$;