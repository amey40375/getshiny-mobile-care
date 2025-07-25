import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Settings, UserCheck, Shield, Sparkles, Clock, CheckCircle } from "lucide-react";
import LoginModal from "@/components/LoginModal";
import MitraRegisterModal from "@/components/MitraRegisterModal";
import AdminPinLoginModal from "@/components/AdminPinLoginModal";
import AdminDashboard from "@/components/AdminDashboard";
import MitraDashboard from "@/components/MitraDashboard";
import LiveChat from "@/components/LiveChat";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMitraProfile } from "@/hooks/useMitraProfile";
import { useServices } from "@/hooks/useServices";
import { useOrders } from "@/hooks/useOrders";

const Index = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMitraRegister, setShowMitraRegister] = useState(false);
  const [showAdminPinLogin, setShowAdminPinLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showMitraDashboard, setShowMitraDashboard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');

  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const { profile: mitraProfile, refetch: refetchMitraProfile } = useMitraProfile();
  const { services } = useServices();
  const { createOrder } = useOrders();
  const { toast } = useToast();

  // Check mitra status and redirect if needed
  useEffect(() => {
    if (user && mitraProfile) {
      console.log('Checking mitra profile status:', mitraProfile.status);
      if (mitraProfile.status === 'accepted' && !showAdminDashboard) {
        console.log('Mitra profile is accepted, redirecting to dashboard');
        setShowMitraDashboard(true);
      }
    }
  }, [user, mitraProfile, showAdminDashboard]);

  const handleAdminPinLogin = () => {
    console.log('Admin PIN login successful, redirecting to admin dashboard');
    setShowAdminPinLogin(false);
    setShowAdminDashboard(true);
    setShowMitraDashboard(false);
  };

  const handleMitraAccess = () => {
    if (user && mitraProfile && mitraProfile.status === 'accepted') {
      console.log('User is logged in and mitra profile is accepted, redirecting to mitra dashboard');
      setShowMitraDashboard(true);
    } else {
      console.log('User needs to login first');
      setShowLoginModal(true);
    }
  };

  const handleMitraLoginSuccess = async () => {
    console.log('Mitra login successful, checking profile status...');
    setShowLoginModal(false);
    
    // Refetch mitra profile to get latest status
    await refetchMitraProfile();
    
    // Small delay to ensure profile data is loaded
    setTimeout(async () => {
      // Refetch again to make sure we have the latest data
      await refetchMitraProfile();
      
      if (mitraProfile && mitraProfile.status === 'accepted') {
        console.log('Mitra profile is accepted, redirecting to dashboard');
        setShowMitraDashboard(true);
      } else {
        console.log('Mitra profile status:', mitraProfile?.status);
        if (mitraProfile?.status === 'pending') {
          toast({
            title: "Login Berhasil",
            description: "Silakan tunggu konfirmasi dari admin untuk mengakses dashboard mitra",
          });
        } else if (mitraProfile?.status === 'rejected') {
          toast({
            title: "Akses Ditolak",
            description: "Pendaftaran mitra Anda telah ditolak. Silakan hubungi admin.",
            variant: "destructive"
          });
        }
      }
    }, 1500);
  };

  const handleMitraLogout = () => {
    console.log('Mitra logged out, returning to user page');
    setShowMitraDashboard(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Admin Dashboard if PIN authenticated
  if (showAdminDashboard) {
    return <AdminDashboard onBackToUser={() => setShowAdminDashboard(false)} />;
  }

  // Show Mitra Dashboard if accessing mitra mode
  if (showMitraDashboard && mitraProfile && mitraProfile.status === 'accepted') {
    return <MitraDashboard onLogout={handleMitraLogout} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerAddress || !serviceType || !customerWhatsapp) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive"
      });
      return;
    }

    console.log('Form submission:', { customerName, customerAddress, serviceType, customerWhatsapp });

    const success = await createOrder({
      customer_name: customerName,
      customer_address: customerAddress,
      service_type: serviceType,
      customer_whatsapp: customerWhatsapp,
    });

    if (success) {
      toast({
        title: "Pesanan Berhasil!",
        description: "Pesanan Anda telah diterima dan akan segera diproses",
      });
      
      // Reset form
      setCustomerName('');
      setCustomerAddress('');
      setServiceType('');
      setCustomerWhatsapp('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">GetShiny</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Admin Access Button */}
              <Button
                onClick={() => setShowAdminPinLogin(true)}
                variant="outline"
                className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Button>

              {/* Settings Button */}
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Menu
              </Button>

              {/* Live Chat Button */}
              <Button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
              >
                <MessageCircle className="w-4 h-4" />
                Live Chat
              </Button>
            </div>
          </div>

          {/* Settings Dropdown */}
          {showSettings && (
            <div className="absolute right-4 top-16 bg-white border rounded-lg shadow-lg p-4 z-50">
              <div className="space-y-3">
                <Button
                  onClick={handleMitraAccess}
                  variant="outline"
                  className="w-full flex items-center gap-2 text-left"
                >
                  <UserCheck className="w-4 h-4" />
                  Beralih ke Mode Mitra
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Layanan Kebersihan Profesional
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Cleaning, Laundry, dan Beberes Rumah dengan mitra terpercaya
            </p>
            
            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {services.map((service) => (
                <Card key={service.id} className="border-2 hover:border-blue-300 transition-colors">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{service.service_name}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="text-2xl font-bold text-blue-600">
                      Rp {parseInt(service.price).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Form */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-blue-800">
                Pesan Layanan Sekarang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="customerName" className="text-lg font-medium">
                      Nama Lengkap *
                    </Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="mt-2"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerWhatsapp" className="text-lg font-medium">
                      Nomor WhatsApp *
                    </Label>
                    <Input
                      id="customerWhatsapp"
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      placeholder="08123456789"
                      className="mt-2"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="serviceType" className="text-lg font-medium">
                    Pilih Layanan *
                  </Label>
                  <Select value={serviceType} onValueChange={setServiceType} required>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Pilih jenis layanan" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.service_name}>
                          {service.service_name} - Rp {parseInt(service.price).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customerAddress" className="text-lg font-medium">
                    Alamat Lengkap *
                  </Label>
                  <Textarea
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Masukkan alamat lengkap untuk layanan"
                    className="mt-2"
                    rows={3}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Pesan Sekarang
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-8">
              Cara Pemesanan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Isi Form</h4>
                <p className="text-gray-600">Lengkapi data dan pilih layanan yang diinginkan</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-blue-600">2</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Konfirmasi</h4>
                <p className="text-gray-600">Mitra kami akan menghubungi untuk konfirmasi</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Layanan</h4>
                <p className="text-gray-600">Nikmati layanan profesional di lokasi Anda</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleMitraLoginSuccess}
        onRegisterClick={() => {
          setShowLoginModal(false);
          setShowMitraRegister(true);
        }}
      />

      <MitraRegisterModal
        isOpen={showMitraRegister}
        onClose={() => setShowMitraRegister(false)}
        onSuccess={() => {
          setShowMitraRegister(false);
          setShowLoginModal(true);
        }}
      />

      <AdminPinLoginModal
        isOpen={showAdminPinLogin}
        onClose={() => setShowAdminPinLogin(false)}
        onAdminLogin={handleAdminPinLogin}
      />

      <LiveChat
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        currentUserType="mitra"
        currentUserName="Customer"
      />
    </div>
  );
};

export default Index;
