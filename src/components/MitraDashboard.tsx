
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle, XCircle, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MitraDashboardProps {
  onBackToUser: () => void;
}

const MitraDashboard = ({ onBackToUser }: MitraDashboardProps) => {
  const [mitraStatus, setMitraStatus] = useState<'pending' | 'accepted' | 'rejected'>('accepted'); // Demo: accepted
  const [orders, setOrders] = useState([
    {
      id: 1,
      customerName: 'Budi Santoso',
      address: 'Jl. Sudirman No. 123, Jakarta Selatan',
      service: 'Cleaning',
      whatsapp: '08123456789',
      status: 'NEW',
      createdAt: '2024-01-15 10:30'
    },
    {
      id: 2,
      customerName: 'Siti Nurhaliza',
      address: 'Jl. Gatot Subroto No. 456, Jakarta Pusat',
      service: 'Laundry',
      whatsapp: '08987654321',
      status: 'NEW',
      createdAt: '2024-01-15 11:15'
    }
  ]);
  const { toast } = useToast();

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing mitra dashboard...');
      // In real app, this would fetch new orders from Supabase
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleOrderAction = (orderId: number, action: 'accept' | 'reject') => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: action === 'accept' ? 'DIPROSES' : 'DITOLAK' }
        : order
    ));

    toast({
      title: action === 'accept' ? "Pesanan Diterima!" : "Pesanan Ditolak",
      description: action === 'accept' 
        ? "Silakan hubungi pelanggan segera" 
        : "Pesanan telah ditolak",
    });
  };

  const openWhatsApp = (number: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${number}?text=${encodedMessage}`, '_blank');
  };

  // Status pending - show waiting message
  if (mitraStatus === 'pending') {
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
  if (mitraStatus === 'rejected') {
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

  // Status accepted - show full dashboard
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
            <div className="text-right">
              <h1 className="text-xl font-bold text-gray-800">Dashboard Mitra</h1>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Aktif
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription>
              🔄 Dashboard akan otomatis refresh setiap 15 detik untuk menampilkan pesanan terbaru
            </AlertDescription>
          </Alert>

          <h2 className="text-2xl font-bold text-gray-800 mb-6">Pesanan Baru</h2>
          
          {orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">Belum ada pesanan baru</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{order.customerName}</CardTitle>
                      <Badge 
                        variant={order.status === 'NEW' ? 'default' : 
                                order.status === 'DIPROSES' ? 'secondary' : 'destructive'}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Alamat:</p>
                        <p className="text-gray-800">{order.address}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Layanan:</p>
                        <p className="text-gray-800">{order.service}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">WhatsApp:</p>
                        <p className="text-gray-800">{order.whatsapp}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Waktu Pesan:</p>
                        <p className="text-gray-800">{order.createdAt}</p>
                      </div>

                      {order.status === 'NEW' && (
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
                      )}

                      {order.status === 'DIPROSES' && (
                        <div className="pt-4">
                          <Button 
                            onClick={() => openWhatsApp(order.whatsapp, `Halo ${order.customerName}, saya mitra GetShiny yang akan mengerjakan pesanan ${order.service} Anda. Kapan waktu yang tepat untuk kami datang?`)}
                            className="w-full bg-green-500 hover:bg-green-600"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Hubungi Pelanggan
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MitraDashboard;
