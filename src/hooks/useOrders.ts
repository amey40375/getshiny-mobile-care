
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
      console.log('Fetching orders...', { mitraOnly });
      setLoading(true);
      
      let query = supabase.from('orders').select('*');
      
      if (mitraOnly) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Fetching orders for mitra:', user.id);
          // For mitra: show NEW orders without assignment OR orders assigned to this mitra
          query = query.or(`and(status.eq.NEW,mitra_id.is.null),and(mitra_id.eq.${user.id},status.eq.DIPROSES)`);
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
      
      console.log('Orders fetched successfully:', data);
      setOrders(data || []);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'status' | 'mitra_id'>) => {
    try {
      console.log('Creating order with data:', orderData);
      
      // Validasi data sebelum insert
      if (!orderData.customer_name || !orderData.customer_address || !orderData.customer_whatsapp || !orderData.service_type) {
        throw new Error('Data pesanan tidak lengkap');
      }

      const insertData = {
        customer_name: orderData.customer_name.trim(),
        customer_address: orderData.customer_address.trim(),
        customer_whatsapp: orderData.customer_whatsapp,
        service_type: orderData.service_type,
        status: 'NEW'
      };

      console.log('Inserting order data:', insertData);

      // Insert data langsung ke tabel orders
      const { data, error } = await supabase
        .from('orders')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        toast({
          title: "Error",
          description: `Gagal membuat pesanan: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }

      console.log('Order created successfully:', data);
      
      toast({
        title: "Pesanan Berhasil!",
        description: "Pesanan Anda telah diterima. Mitra akan segera menghubungi Anda.",
      });

      // Refresh orders list
      await fetchOrders();
      return data;
    } catch (error) {
      console.error('Error in createOrder:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat membuat pesanan",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, mitraId?: string) => {
    try {
      console.log('Updating order status:', { orderId, status, mitraId });
      
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
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

      console.log('Order status updated successfully');
      await fetchOrders();
      
      toast({
        title: "Status Updated",
        description: `Status pesanan berhasil diubah ke ${status}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
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
      }, (payload) => {
        console.log('Real-time order update:', payload);
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
