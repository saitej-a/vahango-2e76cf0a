import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatchRequest {
  vehicleType: 'bike' | 'auto' | 'car';
  pickupLatitude: number;
  pickupLongitude: number;
  isShared: boolean;
  searchRadius?: number; // in km, default 5
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      vehicleType, 
      pickupLatitude, 
      pickupLongitude, 
      isShared,
      searchRadius = 5 
    } = await req.json() as MatchRequest;

    console.log('Driver matching request received', { vehicleType, isShared });

    // Get online drivers with matching vehicle type
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select(`
        id,
        vehicle_type,
        registration_number,
        model,
        capacity,
        is_shared_enabled,
        driver:drivers!inner (
          id,
          user_id,
          is_online,
          current_latitude,
          current_longitude,
          rating,
          total_rides
        )
      `)
      .eq('vehicle_type', vehicleType)
      .eq('is_active', true)
      .eq('driver.is_online', true);

    if (vehicleError) {
      throw vehicleError;
    }

    if (!vehicles || vehicles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No drivers available',
          availableDrivers: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter by sharing preference if needed
    let availableVehicles = vehicles;
    if (isShared) {
      availableVehicles = vehicles.filter(v => v.is_shared_enabled);
    }

    // Get driver profiles separately
    const driverUserIds = availableVehicles
      .map(v => {
        const driver = Array.isArray(v.driver) ? v.driver[0] : v.driver;
        return driver?.user_id;
      })
      .filter(Boolean);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', driverUserIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Calculate distances and filter by radius
    const driversWithDistance = availableVehicles
      .map(vehicle => {
        const driver = Array.isArray(vehicle.driver) ? vehicle.driver[0] : vehicle.driver;
        if (!driver || !driver.current_latitude || !driver.current_longitude) {
          return null;
        }

        const profile = profileMap.get(driver.user_id);
        
        const distance = calculateDistance(
          pickupLatitude,
          pickupLongitude,
          driver.current_latitude,
          driver.current_longitude
        );

        if (distance > searchRadius) {
          return null;
        }

        return {
          driverId: driver.id,
          driverUserId: driver.user_id,
          vehicleId: vehicle.id,
          driverName: profile?.full_name || 'Driver',
          phone: profile?.phone || '',
          vehicleModel: vehicle.model,
          registrationNumber: vehicle.registration_number,
          rating: driver.rating,
          totalRides: driver.total_rides,
          distance: Math.round(distance * 100) / 100,
          latitude: driver.current_latitude,
          longitude: driver.current_longitude,
        };
      })
      .filter(d => d !== null);

    // Sort by distance and rating
    driversWithDistance.sort((a, b) => {
      // Prioritize by distance, then by rating
      const distanceDiff = a!.distance - b!.distance;
      if (Math.abs(distanceDiff) < 0.5) {
        return b!.rating - a!.rating;
      }
      return distanceDiff;
    });

    console.log('Driver matching completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        availableDrivers: driversWithDistance.slice(0, 10), // Return top 10
        totalCount: driversWithDistance.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error matching driver:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
