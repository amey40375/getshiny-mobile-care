
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
          query = query.or(`and(status.eq.NEW,mitra_id.is.null),mitra_id.eq.${user.id}`);
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

      // Normalize service type to match database constraint
      let normalizedServiceType = orderData.service_type.toLowerCase();
      if (normalizedServiceType === 'beberes rumah') {
        normalizedServiceType = 'beberes';
      }

      const insertData = {
        customer_name: orderData.customer_name.trim(),
        customer_address: orderData.customer_address.trim(),
        customer_whatsapp: orderData.customer_whatsapp,
        service_type: normalizedServiceType,
        status: 'NEW'
      };

      console.log('Inserting order data:', insertData);

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
      
      // Get current user for better error handling
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        toast({
          title: "Error",
          description: "Anda harus login untuk memperbarui pesanan",
          variant: "destructive"
        });
        return false;
      }

      console.log('Current user ID:', user.id);

      // Build update data
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString()
      };
      
      // Set mitra_id if provided, otherwise use current user ID for mitra actions
      if (mitraId) {
        updateData.mitra_id = mitraId;
      } else if (status === 'DIPROSES' || status === 'SEDANG_DIKERJAKAN') {
        updateData.mitra_id = user.id;
      }

      console.log('Final update data being sent:', updateData);

      // Perform the update
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        toast({
          title: "Error",
          description: `Gagal memperbarui status pesanan: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }

      console.log('Order status updated successfully:', data);
      
      // Refresh orders after successful update
      await fetchOrders();
      
      // Show success message
      let statusText = status;
      switch(status) {
        case 'DIPROSES':
          statusText = 'Diproses';
          break;
        case 'SEDANG_DIKERJAKAN':
          statusText = 'Sedang Dikerjakan';
          break;
        case 'SELESAI':
          statusText = 'Selesai';
          break;
        case 'DIBATALKAN':
          statusText = 'Dibatalkan';
          break;
        default:
          statusText = status;
      }
      
      toast({
        title: "Status Berhasil Diperbarui",
        description: `Status pesanan berhasil diubah ke ${statusText}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memperbarui status pesanan",
        variant: "destructive"
      });
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
