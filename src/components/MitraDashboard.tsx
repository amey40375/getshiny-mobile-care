
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle, XCircle, Phone, MessageCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMitraProfile } from "@/hooks/useMitraProfile";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import LiveChat from "@/components/LiveChat";

interface MitraDashboardProps {
  onBackToUser: () => void;
}

const MitraDashboard = ({ onBackToUser }: MitraDashboardProps) => {
  const { profile, loading: profileLoading } = useMitraProfile();
  const { orders, loading: ordersLoading, updateOrderStatus, refetch } = useOrders(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Log orders for debugging
  useEffect(() => {
    console.log('Orders in MitraDashboard:', orders);
    console.log('User ID:', user?.id);
    console.log('Orders loading:', ordersLoading);
  }, [orders, user?.id, ordersLoading]);

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject') => {
    const newStatus = action === 'accept' ? 'DIPROSES' : 'DIBATALKAN';
    const mitraId = action === 'accept' ? user?.id : undefined;
    
    const success = await updateOrderStatus(orderId, newStatus, mitraId);
    
    if (success) {
      toast({
        title: action === 'accept' ? "Pesanan Diterima!" : "Pesanan Ditolak",
        description: action === 'accept' 
          ? "Silakan hubungi pelanggan segera" 
          : "Pesanan telah ditolak",
      });
      // Refresh data after action
      await handleManualRefresh();
    }
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

  // Status pending - show waiting message
  if (!profile || profile.status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="ghost" 
            onClick={onBackToUser}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
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

  // Status rejected - show rejection message
  if (profile.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="ghost" 
            onClick={onBackToUser}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
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

  // Filter orders for different tabs
  const availableOrders = orders.filter(order => 
    order.status === 'NEW' && !order.mitra_id
  );
  
  const myOrders = orders.filter(order => 
    order.mitra_id === user?.id && order.status === 'DIPROSES'
  );

  // Status accepted - show full dashboard with tabs
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onBackToUser}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke User
            </Button>
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
              <div className="text-right">
                <h1 className="text-xl font-bold text-gray-800">Dashboard Mitra</h1>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Aktif
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription>
              📋 Gunakan tombol "Refresh" untuk memuat pesanan terbaru. Tab "Pesanan Tersedia" menampilkan pesanan baru, dan "Pesanan Saya" menampilkan pesanan yang sedang Anda kerjakan.
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
                      {myOrders.map((order) => (
                        <Card key={order.id} className="hover:shadow-lg transition-shadow border-green-200">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{order.customer_name}</CardTitle>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                SEDANG DIKERJAKAN
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
                                <p className="text-sm font-medium text-gray-600">Waktu Diterima:</p>
                                <p className="text-gray-800">{new Date(order.updated_at).toLocaleString('id-ID')}</p>
                              </div>

                              <div className="pt-4">
                                <Button 
                                  onClick={() => openWhatsApp(order.customer_whatsapp, `Halo ${order.customer_name}, saya mitra GetShiny yang akan mengerjakan pesanan ${order.service_type} Anda. Kapan waktu yang tepat untuk kami datang?`)}
                                  className="w-full bg-green-500 hover:bg-green-600"
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Hubungi Pelanggan
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
          </Tabs>
        </div>
      </div>

      {/* Live Chat Component */}
      <LiveChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentUserType="mitra"
        currentUserName={profile?.name}
        receiverId="admin"
        receiverType="admin"
      />
    </div>
  );
};

export default MitraDashboard;
