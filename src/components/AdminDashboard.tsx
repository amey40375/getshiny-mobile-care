
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, ShoppingCart, Settings, BarChart3 } from "lucide-react";

interface AdminDashboardProps {
  onBackToUser: () => void;
}

const AdminDashboard = ({ onBackToUser }: AdminDashboardProps) => {
  const [mitraApplications, setMitraApplications] = useState([
    {
      id: 1,
      name: 'Ahmad Wijaya',
      email: 'ahmad@email.com',
      whatsapp: '08123456789',
      address: 'Jakarta Selatan',
      workLocation: 'Jakarta Selatan, Depok',
      status: 'pending',
      appliedAt: '2024-01-15 09:00'
    },
    {
      id: 2,
      name: 'Rina Sari',
      email: 'rina@email.com',
      whatsapp: '08987654321',
      address: 'Jakarta Pusat',
      workLocation: 'Jakarta Pusat, Jakarta Utara',
      status: 'pending',
      appliedAt: '2024-01-15 10:30'
    }
  ]);

  const [orders, setOrders] = useState([
    {
      id: 1,
      customerName: 'Budi Santoso',
      service: 'Cleaning',
      status: 'NEW',
      mitraAssigned: null,
      createdAt: '2024-01-15 10:30'
    },
    {
      id: 2,
      customerName: 'Siti Nurhaliza',
      service: 'Laundry',
      status: 'DIPROSES',
      mitraAssigned: 'Ahmad Wijaya',
      createdAt: '2024-01-15 11:15'
    }
  ]);

  const { toast } = useToast();

  const handleMitraStatus = (applicationId: number, newStatus: 'accepted' | 'rejected' | 'pending') => {
    setMitraApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: newStatus }
          : app
      )
    );

    toast({
      title: "Status Updated",
      description: `Aplikasi mitra telah di-${newStatus === 'accepted' ? 'terima' : newStatus === 'rejected' ? 'tolak' : 'proses'}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'NEW': return 'bg-blue-100 text-blue-800';
      case 'DIPROSES': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
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
              <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">GetShiny Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Mitra</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Pesanan</p>
                    <p className="text-2xl font-bold text-gray-900">48</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Settings className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-gray-900">{mitraApplications.filter(app => app.status === 'pending').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">Rp 2.4M</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="mitra" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="mitra">Aplikasi Mitra</TabsTrigger>
              <TabsTrigger value="orders">Kelola Pesanan</TabsTrigger>
              <TabsTrigger value="settings">Pengaturan</TabsTrigger>
            </TabsList>

            {/* Mitra Applications Tab */}
            <TabsContent value="mitra">
              <Card>
                <CardHeader>
                  <CardTitle>Aplikasi Mitra Masuk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mitraApplications.map((application) => (
                      <Card key={application.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{application.name}</h3>
                              <p className="text-gray-600">{application.email}</p>
                            </div>
                            <Badge className={getStatusColor(application.status)}>
                              {application.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600">WhatsApp:</p>
                              <p>{application.whatsapp}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Alamat:</p>
                              <p>{application.address}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Lokasi Kerja:</p>
                              <p>{application.workLocation}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Tanggal Apply:</p>
                              <p>{application.appliedAt}</p>
                            </div>
                          </div>

                          {application.status === 'pending' && (
                            <div className="flex gap-3">
                              <Button 
                                onClick={() => handleMitraStatus(application.id, 'accepted')}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                Terima
                              </Button>
                              <Button 
                                onClick={() => handleMitraStatus(application.id, 'rejected')}
                                variant="destructive"
                              >
                                Tolak
                              </Button>
                              <Button 
                                onClick={() => handleMitraStatus(application.id, 'pending')}
                                variant="outline"
                              >
                                Proses
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Kelola Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg">{order.customerName}</h3>
                              <p className="text-gray-600">Layanan: {order.service}</p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Mitra Assigned:</p>
                              <p>{order.mitraAssigned || 'Belum ditugaskan'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Waktu Pesan:</p>
                              <p>{order.createdAt}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pengaturan Layanan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Cleaning</p>
                          <p className="text-sm text-gray-600">Rp 150.000</p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Laundry</p>
                          <p className="text-sm text-gray-600">Rp 25.000/kg</p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">Beberes Rumah</p>
                          <p className="text-sm text-gray-600">Rp 200.000</p>
                        </div>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Statistik Transaksi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="font-medium text-blue-800">Pesanan Hari Ini</p>
                        <p className="text-2xl font-bold text-blue-900">8</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded">
                        <p className="font-medium text-green-800">Revenue Bulan Ini</p>
                        <p className="text-2xl font-bold text-green-900">Rp 2.4M</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded">
                        <p className="font-medium text-purple-800">Mitra Aktif</p>
                        <p className="text-2xl font-bold text-purple-900">12</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
