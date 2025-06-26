import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Clock, CheckCircle, XCircle, Phone, MessageCircle, RefreshCw, Truck, Check, Play, Timer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMitraProfile } from "@/hooks/useMitraProfile";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import LiveChat from "@/components/LiveChat";

interface MitraDashboardProps {
  onLogout: () => void;
}

interface WorkSession {
  orderId: string;
  startTime: number;
  currentTime: number;
  isRunning: boolean;
}

const MitraDashboard = ({ onLogout }: MitraDashboardProps) => {
  const { profile, loading: profileLoading } = useMitraProfile();
  const { orders, loading: ordersLoading, updateOrderStatus, refetch } = useOrders(true);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);
  const [showInvoice, setShowInvoice] = useState<{orderId: string, totalAmount: number, duration: string} | null>(null);

  const HOURLY_RATE = 100000; // Rp 100,000 per jam

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkSessions(prev => 
        prev.map(session => 
          session.isRunning 
            ? { ...session, currentTime: Date.now() }
            : session
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    console.log('Manual refresh triggered by mitra');
    await refetch();
    setRefreshing(false);
    toast({
      title: "Data Diperbarui",
      description: "Pesanan telah dimuat ulang",
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Log orders for debugging
  useEffect(() => {
    console.log('Orders in MitraDashboard:', orders);
    console.log('User ID:', user?.id);
    console.log('Orders loading:', ordersLoading);
  }, [orders, user?.id, ordersLoading]);

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject') => {
    console.log(`Handle order action: ${action} for order ${orderId}`);
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID tidak ditemukan. Silakan logout dan login kembali.",
        variant: "destructive"
      });
      return;
    }
    
    const newStatus = action === 'accept' ? 'DIPROSES' : 'DIBATALKAN';
    
    console.log('Updating order with status:', { orderId, newStatus, userId: user.id });
    
    const success = await updateOrderStatus(orderId, newStatus);
    
    if (success) {
      toast({
        title: action === 'accept' ? "Pesanan Diterima!" : "Pesanan Ditolak",
        description: action === 'accept' 
          ? "Status diubah ke Diproses. Silakan menuju lokasi pelanggan" 
          : "Pesanan telah ditolak",
      });
      await handleManualRefresh();
    }
  };

  const handleStartWork = async (orderId: string) => {
    console.log('Starting work for order:', orderId, 'User ID:', user?.id);
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID tidak ditemukan. Silakan logout dan login kembali.",
        variant: "destructive"
      });
      return;
    }
    
    console.log('Calling updateOrderStatus with SEDANG_DIKERJAKAN');
    const success = await updateOrderStatus(orderId, 'SEDANG_DIKERJAKAN');
    
    if (success) {
      // Start timer
      const newSession: WorkSession = {
        orderId,
        startTime: Date.now(),
        currentTime: Date.now(),
        isRunning: true
      };
      
      setWorkSessions(prev => [...prev.filter(s => s.orderId !== orderId), newSession]);
      
      toast({
        title: "Mulai Bekerja",
        description: "Timer dimulai. Selamat bekerja!",
      });
      
      // Refresh data to get updated status
      setTimeout(() => {
        handleManualRefresh();
      }, 1000);
    } else {
      console.error('Failed to update order status to SEDANG_DIKERJAKAN');
    }
  };

  const handleFinishWork = async (orderId: string) => {
    const session = workSessions.find(s => s.orderId === orderId);
    if (!session) return;

    const duration = session.currentTime - session.startTime;
    const hours = duration / (1000 * 60 * 60);
    const totalAmount = Math.ceil(hours * HOURLY_RATE);
    
    const success = await updateOrderStatus(orderId, 'SELESAI');
    
    if (success) {
      // Stop timer
      setWorkSessions(prev => 
        prev.map(s => 
          s.orderId === orderId 
            ? { ...s, isRunning: false }
            : s
        )
      );

      // Show invoice
      const durationText = formatDuration(duration);
      setShowInvoice({
        orderId,
        totalAmount,
        duration: durationText
      });
      
      toast({
        title: "Pekerjaan Selesai!",
        description: "Timer dihentikan dan invoice telah dibuat",
      });
      await handleManualRefresh();
    }
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    return `${hours}j ${minutes % 60}m ${seconds % 60}d`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openWhatsApp = (number: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${number}?text=${encodedMessage}`, '_blank');
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="mb-4 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
          
          <Card className="text-center">
            <CardContent className="p-8">
              <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-4">Status Menunggu Review</h2>
              <p className="text-gray-600 mb-6">
                Mohon Maaf Saat Ini Admin Sedang Mereview Data Kamu, Mohon Tunggu Hingga Admin Menerima Kamu. Silakan hubungi admin.
              </p>
              <Button 
                onClick={() => openWhatsApp('6281299660660', 'Halo admin, saya ingin menanyakan status pendaftaran mitra saya')}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <Phone className="w-4 h-4 mr-2" />
                Hubungi Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (profile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="mb-4 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
          
          <Card className="text-center">
            <CardContent className="p-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-4">Pendaftaran Ditolak</h2>
              <p className="text-gray-600 mb-6">
                Mohon maaf kamu ditolak untuk mengajukan menjadi mitra karena ada hal-hal yang belum memenuhi persyaratan. Terima kasih.
              </p>
              <Button 
                onClick={() => openWhatsApp('6281299660660', 'Halo admin, saya ingin menanyakan alasan penolakan pendaftaran mitra saya')}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <Phone className="w-4 h-4 mr-2" />
                Hubungi Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Filter orders - show available orders and orders assigned to this mitra
  const availableOrders = orders.filter(order => 
    order.status === 'NEW' && !order.mitra_id
  );
  
  const myOrders = orders.filter(order => 
    order.mitra_id === user?.id && ['DIPROSES', 'SEDANG_DIKERJAKAN'].includes(order.status)
  );

  console.log('Available orders:', availableOrders);
  console.log('My orders:', myOrders);

  // Status accepted - show full dashboard with tabs
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-800">Dashboard Mitra</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Aktif - {profile?.name}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowChat(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat Admin
              </Button>
              <Button
                onClick={handleManualRefresh}
                variant="outline"
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription>
              📋 Alur kerja: Terima pesanan → Diproses → Mulai Bekerja → Timer berjalan → Selesai → Invoice dibuat
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="available" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">
                Pesanan Tersedia ({availableOrders.length})
              </TabsTrigger>
              <TabsTrigger value="my-orders">
                Pesanan Saya ({myOrders.length})
              </TabsTrigger>
            </TabsList>

            {/* Available Orders Tab */}
            <TabsContent value="available">
              <Card>
                <CardHeader>
                  <CardTitle>Pesanan Tersedia</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-500">Memuat pesanan...</p>
                    </div>
                  ) : availableOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Belum ada pesanan tersedia</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {availableOrders.map((order) => (
                        <Card key={order.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                              <Badge variant="default">
                                {order.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Alamat:</p>
                                <p className="text-gray-800">{order.customer_address}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium text-gray-600">Layanan:</p>
                                <p className="text-gray-800">{order.service_type}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium text-gray-600">WhatsApp:</p>
                                <p className="text-gray-800">{order.customer_whatsapp}</p>
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium text-gray-600">Waktu Pesan:</p>
                                <p className="text-gray-800">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                              </div>

                              <div className="flex gap-3 pt-4">
                                <Button 
                                  onClick={() => handleOrderAction(order.id, 'accept')}
                                  className="flex-1 bg-green-500 hover:bg-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Terima
                                </Button>
                                <Button 
                                  onClick={() => handleOrderAction(order.id, 'reject')}
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Tolak
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Orders Tab */}
            <TabsContent value="my-orders">
              <Card>
                <CardHeader>
                  <CardTitle>Pesanan Yang Sedang Saya Kerjakan</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-500">Memuat pesanan...</p>
                    </div>
                  ) : myOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Belum ada pesanan yang sedang dikerjakan</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myOrders.map((order) => {
                        const workSession = workSessions.find(s => s.orderId === order.id);
                        const duration = workSession ? workSession.currentTime - workSession.startTime : 0;
                        const currentCost = Math.ceil((duration / (1000 * 60 * 60)) * HOURLY_RATE);
                        
                        return (
                          <Card key={order.id} className="hover:shadow-lg transition-shadow border-green-200">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  {order.status === 'DIPROSES' ? 'DIPROSES' : 
                                   order.status === 'SEDANG_DIKERJAKAN' ? 'SEDANG DIKERJAKAN' : order.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Alamat:</p>
                                  <p className="text-gray-800">{order.customer_address}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Layanan:</p>
                                  <p className="text-gray-800">{order.service_type}</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm font-medium text-gray-600">WhatsApp:</p>
                                  <p className="text-gray-800">{order.customer_whatsapp}</p>
                                </div>

                                {/* Timer Display */}
                                {workSession && order.status === 'SEDANG_DIKERJAKAN' && (
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-center justify-center mb-2">
                                      <Timer className="w-6 h-6 text-blue-600 mr-2" />
                                      <span className="text-2xl font-bold text-blue-600">
                                        {formatDuration(duration)}
                                      </span>
                                    </div>
                                    <p className="text-center text-lg font-semibold text-green-600">
                                      Biaya saat ini: {formatCurrency(currentCost)}
                                    </p>
                                    <p className="text-center text-sm text-gray-600">
                                      Tarif: {formatCurrency(HOURLY_RATE)}/jam
                                    </p>
                                  </div>
                                )}

                                <div className="flex flex-col gap-3 pt-4">
                                  <Button 
                                    onClick={() => openWhatsApp(order.customer_whatsapp, `Halo ${order.customer_name}, saya mitra GetShiny yang akan mengerjakan pesanan ${order.service_type} Anda.`)}
                                    className="w-full bg-green-500 hover:bg-green-600"
                                  >
                                    <Phone className="w-4 h-4 mr-2" />
                                    Hubungi Pelanggan
                                  </Button>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex gap-2">
                                    {order.status === 'DIPROSES' && (
                                      <Button 
                                        onClick={() => handleStartWork(order.id)}
                                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                                      >
                                        <Play className="w-4 h-4 mr-2" />
                                        Mulai Bekerja
                                      </Button>
                                    )}
                                    
                                    {order.status === 'SEDANG_DIKERJAKAN' && (
                                      <Button 
                                        onClick={() => handleFinishWork(order.id)}
                                        className="flex-1 bg-purple-500 hover:bg-purple-600"
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Selesai
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-green-600">Invoice Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-mono text-xs">{showInvoice.orderId}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Durasi Pekerjaan</p>
                <p className="text-lg font-semibold">{showInvoice.duration}</p>
              </div>
              
              <div className="text-center bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Biaya</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(showInvoice.totalAmount)}
                </p>
              </div>
              
              <div className="text-center text-xs text-gray-500">
                <p>Tarif: {formatCurrency(HOURLY_RATE)}/jam</p>
                <p>Pembayaran akan diselesaikan dengan pelanggan</p>
              </div>
              
              <Button 
                onClick={() => setShowInvoice(null)}
                className="w-full"
              >
                Tutup
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Chat Component */}
      <LiveChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentUserType="mitra"
        currentUserName={profile?.name}
      />
    </div>
  );
};

export default MitraDashboard;
