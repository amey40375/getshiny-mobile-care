
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  customer_name: string;
  customer_address: string;
  customer_whatsapp: string;
  service_type: string;
  status: string;
  mitra_id?: string;
  created_at: string;
  updated_at: string;
}

export const useOrders = (mitraOnly = false) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      let query = supabase.from('orders').select('*');
      
      if (mitraOnly) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('mitra_id', user.id);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Gagal memuat data pesanan",
          variant: "destructive"
        });
        return;
      }
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'status' | 'mitra_id'>) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        toast({
          title: "Error",
          description: "Gagal membuat pesanan",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Pesanan Berhasil!",
        description: "Pesanan Anda telah diterima. Mitra akan segera menghubungi Anda.",
      });

      fetchOrders();
      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, mitraId?: string) => {
    try {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (mitraId) {
        updateData.mitra_id = mitraId;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        toast({
          title: "Error",
          description: "Gagal memperbarui status pesanan",
          variant: "destructive"
        });
        return false;
      }

      fetchOrders();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mitraOnly]);

  return {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    refetch: fetchOrders
  };
};
