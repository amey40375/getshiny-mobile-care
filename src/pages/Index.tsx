
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Settings, Home, Sparkles } from "lucide-react";
import LoginModal from "@/components/LoginModal";
import MitraRegisterModal from "@/components/MitraRegisterModal";
import MitraDashboard from "@/components/MitraDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { useServices } from "@/hooks/useServices";
import { useOrders } from "@/hooks/useOrders";

const Index = () => {
  const [currentRole, setCurrentRole] = useState<'user' | 'mitra' | 'admin'>('user');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    service: '',
    whatsapp: ''
  });
  
  const { toast } = useToast();
  const { services, loading: servicesLoading } = useServices();
  const { createOrder } = useOrders();

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.service || !formData.whatsapp) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }
    
    const orderData = {
      customer_name: formData.name,
      customer_address: formData.address,
      customer_whatsapp: formData.whatsapp,
      service_type: formData.service
    };

    const result = await createOrder(orderData);
    if (result) {
      setFormData({ name: '', address: '', service: '', whatsapp: '' });
    }
  };

  const handleRoleSwitch = (role: 'user' | 'mitra' | 'admin') => {
    if (role === 'mitra') {
      setShowLoginModal(true);
    } else if (role === 'admin') {
      // For demo purposes, directly switch to admin
      setCurrentRole('admin');
    } else {
      setCurrentRole(role);
    }
  };

  if (currentRole === 'mitra') {
    return <MitraDashboard onBackToUser={() => setCurrentRole('user')} />;
  }

  if (currentRole === 'admin') {
    return <AdminDashboard onBackToUser={() => setCurrentRole('user')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">GetShiny</h1>
                <p className="text-sm text-gray-500">Layanan Kebersihan Terpercaya</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRoleSwitch('mitra')}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Mitra
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRoleSwitch('admin')}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Rumah Bersih, Hidup Lebih Nyaman
            </h2>
            <p className="text-gray-600 mb-6">
              Pesan layanan cleaning, laundry, dan beberes rumah profesional dengan mudah
            </p>
          </div>

          {/* Service Cards */}
          {!servicesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {services.map((service, index) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {service.service_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {service.description}
                    </p>
                    <p className="text-blue-600 font-semibold">{service.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Order Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-xl text-gray-800">
                Pesan Layanan Sekarang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masukkan nama lengkap Anda"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Alamat Lengkap</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Masukkan alamat lengkap beserta detail (RT/RW, Kelurahan, dll)"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="service">Pilih Layanan</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, service: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Pilih jenis layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.service_key} value={service.service_key}>
                          <div className="flex flex-col">
                            <span>{service.service_name} - {service.description}</span>
                            <span className="text-sm text-blue-600">{service.price}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="08123456789"
                    className="mt-1"
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  Pesan Sekarang
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setCurrentRole('mitra');
          setShowLoginModal(false);
        }}
        onRegisterClick={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <MitraRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => {
          setShowRegisterModal(false);
          toast({
            title: "Pendaftaran Berhasil!",
            description: "Data Anda telah dikirim ke admin untuk review. Mohon tunggu konfirmasi.",
          });
        }}
      />
    </div>
  );
};

export default Index;
