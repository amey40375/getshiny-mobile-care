
-- Create table for storing user orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('cleaning', 'laundry', 'beberes')),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'DIPROSES', 'SELESAI', 'DIBATALKAN')),
  mitra_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for mitra applications and profiles
CREATE TABLE public.mitra_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  work_location TEXT NOT NULL,
  ktp_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for services and pricing
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default services
INSERT INTO public.services (service_key, service_name, description, price) VALUES
('cleaning', 'Cleaning', 'Pembersihan Rumah', 'Rp 150.000'),
('laundry', 'Laundry', 'Cuci & Setrika', 'Rp 25.000/kg'),
('beberes', 'Beberes Rumah', 'Rapih & Bersih', 'Rp 200.000');

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitra_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders (public can insert, mitra can view assigned orders, admin can view all)
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Mitra can view assigned orders" ON public.orders
  FOR SELECT USING (mitra_id = auth.uid());

CREATE POLICY "Mitra can update assigned orders" ON public.orders
  FOR UPDATE USING (mitra_id = auth.uid());

-- RLS Policies for mitra_profiles (users can manage their own profile)
CREATE POLICY "Users can view their own mitra profile" ON public.mitra_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own mitra profile" ON public.mitra_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own mitra profile" ON public.mitra_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for services (public read access)
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT USING (true);

-- Enable realtime for orders table
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Create function to automatically assign mitra to orders based on location
CREATE OR REPLACE FUNCTION public.auto_assign_mitra()
RETURNS TRIGGER AS $$
BEGIN
  -- For now, we'll leave mitra assignment to manual process
  -- This function can be enhanced later for automatic assignment
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto assignment (currently disabled)
-- CREATE TRIGGER auto_assign_mitra_trigger
--   AFTER INSERT ON public.orders
--   FOR EACH ROW EXECUTE FUNCTION public.auto_assign_mitra();
