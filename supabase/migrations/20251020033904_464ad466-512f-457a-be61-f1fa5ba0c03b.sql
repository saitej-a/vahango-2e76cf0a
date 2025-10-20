-- Create enums for type safety
CREATE TYPE public.app_role AS ENUM ('passenger', 'driver', 'admin');
CREATE TYPE public.vehicle_type AS ENUM ('bike', 'auto', 'car');
CREATE TYPE public.ride_status AS ENUM ('requested', 'matched', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('cash', 'upi', 'wallet');
CREATE TYPE public.driver_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table for security
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  license_image_url TEXT,
  aadhar_number TEXT,
  aadhar_image_url TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  status driver_status NOT NULL DEFAULT 'pending',
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_rides INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT FALSE,
  current_latitude DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  color TEXT,
  year INTEGER,
  insurance_expiry DATE NOT NULL,
  vehicle_image_url TEXT,
  capacity INTEGER NOT NULL DEFAULT 1,
  is_shared_enabled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  pickup_latitude DECIMAL(10,8) NOT NULL,
  pickup_longitude DECIMAL(11,8) NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_latitude DECIMAL(10,8) NOT NULL,
  dropoff_longitude DECIMAL(11,8) NOT NULL,
  dropoff_address TEXT NOT NULL,
  vehicle_type vehicle_type NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  status ride_status NOT NULL DEFAULT 'requested',
  estimated_distance DECIMAL(10,2),
  estimated_duration INTEGER,
  estimated_fare DECIMAL(10,2),
  final_fare DECIMAL(10,2),
  surge_multiplier DECIMAL(3,2) DEFAULT 1.00,
  special_instructions TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  tip_amount DECIMAL(10,2) DEFAULT 0.00,
  commission_amount DECIMAL(10,2),
  driver_earnings DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL UNIQUE,
  rated_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rated_user UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_categories TEXT[],
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pricing_config table
CREATE TABLE public.pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type vehicle_type NOT NULL UNIQUE,
  base_fare DECIMAL(10,2) NOT NULL,
  per_km_rate DECIMAL(10,2) NOT NULL,
  per_minute_rate DECIMAL(10,2) NOT NULL,
  minimum_fare DECIMAL(10,2) NOT NULL,
  surge_multiplier_peak DECIMAL(3,2) DEFAULT 1.50,
  surge_multiplier_night DECIMAL(3,2) DEFAULT 1.30,
  commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ride_locations table for live tracking
CREATE TABLE public.ride_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_locations ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pricing_config_updated_at BEFORE UPDATE ON public.pricing_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for drivers
CREATE POLICY "Drivers can view own info" ON public.drivers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers can update own info" ON public.drivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Drivers can insert own info" ON public.drivers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all drivers" ON public.drivers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all drivers" ON public.drivers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Passengers can view online drivers" ON public.drivers FOR SELECT USING (is_online = true);

-- RLS Policies for vehicles
CREATE POLICY "Drivers can manage own vehicles" ON public.vehicles FOR ALL USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all vehicles" ON public.vehicles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Passengers can view active vehicles" ON public.vehicles FOR SELECT USING (is_active = true);

-- RLS Policies for rides
CREATE POLICY "Passengers can view own rides" ON public.rides FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "Drivers can view assigned rides" ON public.rides FOR SELECT USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Passengers can create rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Drivers can update assigned rides" ON public.rides FOR UPDATE USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Passengers can update own rides" ON public.rides FOR UPDATE USING (auth.uid() = passenger_id);
CREATE POLICY "Admins can view all rides" ON public.rides FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ratings
CREATE POLICY "Users can view ratings for own rides" ON public.ratings FOR SELECT USING (
  auth.uid() = rated_by OR auth.uid() = rated_user
);
CREATE POLICY "Users can create ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = rated_by);
CREATE POLICY "Admins can view all ratings" ON public.ratings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pricing_config
CREATE POLICY "Everyone can view active pricing" ON public.pricing_config FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pricing" ON public.pricing_config FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ride_locations
CREATE POLICY "Passengers can view own ride locations" ON public.ride_locations FOR SELECT USING (
  ride_id IN (SELECT id FROM public.rides WHERE passenger_id = auth.uid())
);
CREATE POLICY "Drivers can view assigned ride locations" ON public.ride_locations FOR SELECT USING (
  ride_id IN (SELECT id FROM public.rides WHERE driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
);
CREATE POLICY "Drivers can insert ride locations" ON public.ride_locations FOR INSERT WITH CHECK (
  ride_id IN (SELECT id FROM public.rides WHERE driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
);
CREATE POLICY "Admins can view all ride locations" ON public.ride_locations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Insert default pricing config
INSERT INTO public.pricing_config (vehicle_type, base_fare, per_km_rate, per_minute_rate, minimum_fare, commission_percentage) VALUES
('bike', 20.00, 8.00, 1.50, 30.00, 15.00),
('auto', 30.00, 12.00, 2.00, 40.00, 18.00),
('car', 50.00, 15.00, 2.50, 60.00, 20.00);

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  );
  
  -- Assign default passenger role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'passenger');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for rides and ride_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;