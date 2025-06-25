
-- Add sender_name column to chat_messages table for better message tracking
ALTER TABLE public.chat_messages ADD COLUMN sender_name TEXT;

-- Update the table to allow better chat functionality
UPDATE public.chat_messages SET sender_name = 'Unknown' WHERE sender_name IS NULL;

-- Create a proper admin user system
-- First, create a profiles table to store user roles and information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles  
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = $1 AND role = 'admin'
  );
$$;

-- Create admin policies for viewing all data
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all mitra profiles" ON public.mitra_profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all mitra profiles" ON public.mitra_profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Allow users to view their own orders
CREATE POLICY "Users can view orders" ON public.orders
  FOR SELECT USING (true);

-- Allow mitra to view relevant orders
CREATE POLICY "Mitra can view assigned orders" ON public.orders
  FOR SELECT USING (mitra_id = auth.uid() OR status = 'NEW');

-- Allow mitra to update their assigned orders
CREATE POLICY "Mitra can update assigned orders" ON public.orders
  FOR UPDATE USING (mitra_id = auth.uid());

-- Enable RLS on chat_messages table for private conversations
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for private chat between mitra and admin
CREATE POLICY "Users can view their own messages" ON public.chat_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR 
    receiver_id = auth.uid() OR
    public.is_admin(auth.uid())
  );

CREATE POLICY "Users can insert their own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own messages" ON public.chat_messages
  FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());
