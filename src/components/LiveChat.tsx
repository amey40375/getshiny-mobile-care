
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, X, User } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserType: 'admin' | 'mitra';
  currentUserName?: string;
  receiverId?: string;
  receiverType?: 'admin' | 'mitra';
}

const LiveChat = ({ isOpen, onClose, currentUserType, currentUserName }: LiveChatProps) => {
  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedMitraId, setSelectedMitraId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { messages, loading, sendMessage, markAsRead, unreadCount, mitraProfiles } = useChat(currentUserType, currentUserName);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      // Mark unread messages as read
      const unreadMessages = messages
        .filter(msg => msg.receiver_id === user?.id && !msg.is_read)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        markAsRead(unreadMessages);
      }
    }
  }, [isOpen, messages, user?.id, markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending) {
      console.log('Message is empty or already sending');
      return;
    }

    console.log('Sending message from LiveChat:', { 
      message, 
      currentUserType, 
      currentUserName,
      userId: user?.id,
      selectedMitraId 
    });
    
    setIsSending(true);
    
    try {
      let success = false;
      
      if (currentUserType === 'mitra') {
        // Mitra sending to admin
        console.log('Mitra sending message to admin');
        success = await sendMessage(message, 'admin');
      } else if (currentUserType === 'admin') {
        // Admin sending to selected mitra
        if (selectedMitraId) {
          console.log('Admin sending message to mitra:', selectedMitraId);
          success = await sendMessage(message, 'mitra', selectedMitraId);
        } else {
          console.log('No mitra selected for admin message');
          success = false;
        }
      }
      
      if (success) {
        setMessage('');
        console.log('Message sent successfully, clearing input');
      } else {
        console.log('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Filter messages based on selected mitra for admin
  const filteredMessages = currentUserType === 'admin' && selectedMitraId
    ? messages.filter(msg => 
        (msg.sender_id === selectedMitraId && msg.receiver_id === user?.id) ||
        (msg.sender_id === user?.id && msg.receiver_id === selectedMitraId)
      )
    : currentUserType === 'mitra' 
      ? messages.filter(msg =>
          (msg.sender_type === 'mitra' && msg.receiver_type === 'admin') ||
          (msg.sender_type === 'admin' && msg.receiver_type === 'mitra')
        )
      : messages;

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 h-96 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Live Chat {currentUserType === 'mitra' ? 'dengan Admin' : 'dengan Mitra'}
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                -
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Mitra selection for admin */}
          {currentUserType === 'admin' && !isMinimized && (
            <div className="mt-2">
              <select 
                value={selectedMitraId || ''} 
                onChange={(e) => setSelectedMitraId(e.target.value || null)}
                className="w-full text-xs border rounded px-2 py-1"
              >
                <option value="">Pilih Mitra...</option>
                {mitraProfiles.map((mitra) => (
                  <option key={mitra.user_id} value={mitra.user_id}>
                    {mitra.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            <ScrollArea className="flex-1 p-3">
              {loading ? (
                <div className="text-center text-gray-500 text-sm">
                  Memuat pesan...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm">
                  {currentUserType === 'admin' && !selectedMitraId 
                    ? 'Pilih mitra untuk melihat percakapan'
                    : 'Belum ada pesan. Mulai percakapan!'
                  }
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                          msg.sender_id === user?.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {/* Show sender name for received messages */}
                        {msg.sender_id !== user?.id && msg.sender_name && (
                          <div className="text-xs font-semibold mb-1 text-gray-600 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {msg.sender_type === 'mitra' ? `${msg.sender_name}` : 'Admin'}
                            <span className="w-2 h-2 bg-green-500 rounded-full ml-1"></span>
                          </div>
                        )}
                        <div className="break-words">{msg.message}</div>
                        <div
                          className={`text-xs mt-1 ${
                            msg.sender_id === user?.id
                              ? 'text-blue-100'
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSendMessage} className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    currentUserType === 'admin' && !selectedMitraId 
                      ? 'Pilih mitra terlebih dahulu...'
                      : 'Ketik pesan...'
                  }
                  className="flex-1 text-sm"
                  maxLength={500}
                  disabled={loading || isSending || (currentUserType === 'admin' && !selectedMitraId)}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    !message.trim() || 
                    loading || 
                    isSending || 
                    (currentUserType === 'admin' && !selectedMitraId)
                  }
                  className="px-3"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default LiveChat;
