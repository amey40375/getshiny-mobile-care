
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  sender_type: 'admin' | 'mitra';
  receiver_type: 'admin' | 'mitra';
  is_read: boolean;
  created_at: string;
}

export const useChat = (currentUserType: 'admin' | 'mitra', receiverId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    try {
      console.log('Fetching chat messages...', { currentUserType, receiverId });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }

      let query = supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      // For admin: show all messages between admin and mitra
      if (currentUserType === 'admin') {
        query = query.or(`and(sender_type.eq.admin,receiver_type.eq.mitra),and(sender_type.eq.mitra,receiver_type.eq.admin)`);
      } else {
        // For mitra: show conversation with admin only
        query = query.or(`and(sender_id.eq.${user.id},receiver_type.eq.admin),and(receiver_id.eq.${user.id},sender_type.eq.admin)`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Gagal memuat pesan chat",
          variant: "destructive"
        });
        return;
      }

      console.log('Messages fetched successfully:', data);
      
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'admin' | 'mitra',
        receiver_type: msg.receiver_type as 'admin' | 'mitra'
      })) as ChatMessage[];
      
      setMessages(typedMessages);
      
      // Count unread messages
      const unread = typedMessages.filter(msg => 
        msg.receiver_id === user.id && !msg.is_read
      ).length;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserType, receiverId, toast]);

  const sendMessage = async (message: string, receiverType: 'admin' | 'mitra' = 'admin') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Anda harus login untuk mengirim pesan",
          variant: "destructive"
        });
        return false;
      }

      // Use admin-system or mitra-system as placeholder receiver_id
      const actualReceiverId = receiverType === 'admin' ? 'admin-system' : 'mitra-system';

      const messageData = {
        sender_id: user.id,
        receiver_id: actualReceiverId,
        message: message.trim(),
        sender_type: currentUserType,
        receiver_type: receiverType,
        is_read: false
      };

      console.log('Sending message:', messageData);

      const { error } = await supabase
        .from('chat_messages')
        .insert([messageData]);

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Gagal mengirim pesan",
          variant: "destructive"
        });
        return false;
      }

      console.log('Message sent successfully');
      await fetchMessages(); // Refresh messages after sending
      return true;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengirim pesan",
        variant: "destructive"
      });
      return false;
    }
  };

  const markAsRead = async (messageIds: string[]) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', messageIds);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        console.log('Real-time chat update:', payload);
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  return {
    messages,
    loading,
    unreadCount,
    sendMessage,
    markAsRead,
    refetch: fetchMessages
  };
};
