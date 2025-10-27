import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FareRequest {
  vehicleType: 'bike' | 'auto' | 'car';
  distance: number; // in km
  duration: number; // in minutes
  isShared: boolean;
  currentTime?: string; // ISO format
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { vehicleType, distance, duration, isShared, currentTime } = await req.json() as FareRequest;

    console.log('Fare calculation request received', { vehicleType });

    // Fetch pricing config
    const { data: pricing, error: pricingError } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('vehicle_type', vehicleType)
      .eq('is_active', true)
      .single();

    if (pricingError || !pricing) {
      throw new Error('Pricing configuration not found');
    }

    // Base fare calculation
    let baseFare = parseFloat(pricing.base_fare);
    const distanceCharge = distance * parseFloat(pricing.per_km_rate);
    const timeCharge = duration * parseFloat(pricing.per_minute_rate);
    
    let totalFare = baseFare + distanceCharge + timeCharge;

    // Apply surge pricing
    let surgeMultiplier = 1.0;
    const now = currentTime ? new Date(currentTime) : new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Peak hours: 8-10 AM, 5-8 PM on weekdays
    const isPeakHour = (day >= 1 && day <= 5) && 
                      ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 20));
    
    // Night hours: 11 PM - 6 AM
    const isNightHour = hour >= 23 || hour < 6;

    if (isPeakHour) {
      surgeMultiplier = parseFloat(pricing.surge_multiplier_peak || '1.5');
    } else if (isNightHour) {
      surgeMultiplier = parseFloat(pricing.surge_multiplier_night || '1.3');
    }

    totalFare = totalFare * surgeMultiplier;

    // Apply sharing discount (30% off for shared rides)
    if (isShared) {
      totalFare = totalFare * 0.7;
    }

    // Ensure minimum fare
    const minimumFare = parseFloat(pricing.minimum_fare);
    if (totalFare < minimumFare) {
      totalFare = minimumFare;
    }

    // Round to 2 decimal places
    totalFare = Math.round(totalFare * 100) / 100;

    const fareBreakdown = {
      baseFare: baseFare,
      distanceCharge: Math.round(distanceCharge * 100) / 100,
      timeCharge: Math.round(timeCharge * 100) / 100,
      surgeMultiplier: surgeMultiplier,
      sharingDiscount: isShared ? '30%' : '0%',
      minimumFare: minimumFare,
      totalFare: totalFare,
      commissionPercentage: parseFloat(pricing.commission_percentage),
    };

    console.log('Fare calculation completed successfully');

    return new Response(
      JSON.stringify(fareBreakdown),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating fare:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
