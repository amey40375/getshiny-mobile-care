
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  sender_type: 'admin' | 'mitra';
  receiver_type: 'admin' | 'mitra';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface MitraProfile {
  user_id: string;
  name: string;
  status: string;
}

export const useChat = (currentUserType: 'admin' | 'mitra', currentUserName?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mitraProfiles, setMitraProfiles] = useState<MitraProfile[]>([]);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch admin user ID
  useEffect(() => {
    const fetchAdminUserId = async () => {
      try {
        console.log('Fetching admin user ID...');
        const { data: adminData, error } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('role', 'admin')
          .single();

        if (error) {
          console.error('Error fetching admin:', error);
          return;
        }

        if (adminData) {
          console.log('Admin user found:', adminData.user_id);
          setAdminUserId(adminData.user_id);
        }
      } catch (error) {
        console.error('Error in fetchAdminUserId:', error);
      }
    };

    fetchAdminUserId();
  }, []);

  // Fetch mitra profiles for admin
  useEffect(() => {
    if (currentUserType === 'admin') {
      fetchMitraProfiles();
    }
  }, [currentUserType]);

  const fetchMitraProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('mitra_profiles')
        .select('user_id, name, status')
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching mitra profiles:', error);
        return;
      }

      setMitraProfiles(data || []);
    } catch (error) {
      console.error('Error in fetchMitraProfiles:', error);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Gagal memuat pesan",
          variant: "destructive"
        });
        return;
      }

      // Cast the data to match our interface types
      const typedMessages: ChatMessage[] = (data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'admin' | 'mitra',
        receiver_type: msg.receiver_type as 'admin' | 'mitra'
      }));

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
  };

  // Send message
  const sendMessage = async (message: string, receiverType: 'admin' | 'mitra', receiverId?: string) => {
    if (!user?.id || !message.trim()) {
      console.log('Cannot send message: missing user ID or empty message');
      return false;
    }

    try {
      let targetReceiverId = receiverId;
      
      // If mitra sending to admin, use the stored admin user ID
      if (currentUserType === 'mitra' && receiverType === 'admin') {
        if (!adminUserId) {
          console.error('Admin user ID not found');
          toast({
            title: "Error",
            description: "Tidak dapat menemukan admin. Coba refresh halaman.",
            variant: "destructive"
          });
          return false;
        }
        
        targetReceiverId = adminUserId;
        console.log('Mitra sending message to admin:', adminUserId);
      }

      if (!targetReceiverId) {
        console.log('No target receiver ID specified');
        toast({
          title: "Error",
          description: "Target penerima pesan tidak valid",
          variant: "destructive"
        });
        return false;
      }

      const messageData = {
        sender_id: user.id,
        receiver_id: targetReceiverId,
        sender_name: currentUserName || 'Unknown',
        sender_type: currentUserType,
        receiver_type: receiverType,
        message: message.trim(),
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
      
      // Refresh messages after sending
      await fetchMessages();
      
      toast({
        title: "Pesan Terkirim",
        description: "Pesan berhasil dikirim ke " + (receiverType === 'admin' ? 'Admin' : 'Mitra'),
      });

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

  // Mark messages as read
  const markAsRead = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', messageIds);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - messageIds.length));

    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    fetchMessages();

    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'chat_messages'
        }, 
        (payload) => {
          console.log('Real-time chat update:', payload);
          
          // Show notification for new messages
          if (payload.eventType === 'INSERT' && payload.new) {
            const newMessage = payload.new as any;
            if (newMessage.receiver_id === user.id) {
              // Show different notifications based on sender type
              const senderName = newMessage.sender_type === 'admin' 
                ? 'Admin' 
                : newMessage.sender_name || 'Mitra';
              
              toast({
                title: "💬 Pesan Baru",
                description: `Pesan dari ${senderName}: ${newMessage.message.substring(0, 50)}${newMessage.message.length > 50 ? '...' : ''}`,
              });
              
              // Play notification sound if available
              try {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(() => {
                  // Ignore audio play errors (user interaction required)
                });
              } catch (error) {
                // Ignore audio errors
              }
            }
          }
          
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, adminUserId]);

  return {
    messages,
    loading,
    unreadCount,
    mitraProfiles,
    adminUserId,
    sendMessage,
    markAsRead,
    refetch: fetchMessages
  };
};
