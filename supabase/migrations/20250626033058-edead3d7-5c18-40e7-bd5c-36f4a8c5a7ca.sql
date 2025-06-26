
-- Update the status constraint to include all valid status values
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with all valid status values including SEDANG_DIKERJAKAN
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('NEW', 'DIPROSES', 'SEDANG_DIKERJAKAN', 'SELESAI', 'DIBATALKAN'));
