
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMitraProfile } from "@/hooks/useMitraProfile";
import { useAuth } from "@/hooks/useAuth";

interface MitraRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MitraRegisterModal = ({ isOpen, onClose, onSuccess }: MitraRegisterModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    whatsapp: '',
    email: '',
    work_location: '',
    password: '',
    confirmPassword: '',
    ktp: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { createProfile } = useMitraProfile();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validasi semua field
    if (!formData.name || !formData.address || !formData.whatsapp || !formData.email || !formData.work_location || !formData.password) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validasi email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Error",
        description: "Format email tidak valid",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validasi password
    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password minimal 6 karakter",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Konfirmasi password tidak cocok",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validasi nomor WhatsApp
    const whatsappRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    if (!whatsappRegex.test(formData.whatsapp)) {
      toast({
        title: "Error",
        description: "Format nomor WhatsApp tidak valid. Contoh: 081234567890",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Creating auth account for mitra...');
      
      // Buat akun autentikasi terlebih dahulu
      const { error: authError } = await signUp(formData.email.trim(), formData.password);
      if (authError) {
        console.error('Auth signup error:', authError);
        toast({
          title: "Error",
          description: "Gagal membuat akun. Email mungkin sudah terdaftar.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log('Auth account created, now creating mitra profile...');

      // Tunggu sebentar untuk memastikan user sudah terbuat
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Buat profil mitra
      const profileData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        whatsapp: formData.whatsapp.trim(),
        email: formData.email.trim(),
        work_location: formData.work_location.trim(),
        ktp_url: formData.ktp ? formData.ktp.name : ''
      };

      console.log('Creating mitra profile with data:', profileData);

      const result = await createProfile(profileData);
      if (result) {
        console.log('Mitra profile created successfully:', result);
        
        // Reset form
        setFormData({
          name: '',
          address: '',
          whatsapp: '',
          email: '',
          work_location: '',
          password: '',
          confirmPassword: '',
          ktp: null
        });
        
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: "Gagal membuat profil mitra. Silakan coba lagi.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat pendaftaran. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validasi ukuran file (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran file maksimal 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setFormData({ ...formData, ktp: file });
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        address: '',
        whatsapp: '',
        email: '',
        work_location: '',
        password: '',
        confirmPassword: '',
        ktp: null
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Daftar Sebagai Mitra</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nama sesuai KTP"
              className="mt-1"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="nama@email.com"
              className="mt-1"
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimal 6 karakter"
              className="mt-1"
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Ulangi password"
              className="mt-1"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="address">Alamat Lengkap *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat sesuai KTP"
              className="mt-1"
              rows={2}
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="whatsapp">Nomor WhatsApp *</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="081234567890"
              className="mt-1"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="workLocation">Lokasi Kerja Pilihan *</Label>
            <Input
              id="workLocation"
              type="text"
              value={formData.work_location}
              onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
              placeholder="Contoh: Jakarta Selatan, Depok, dll"
              className="mt-1"
              disabled={loading}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="ktp">Upload KTP (Opsional)</Label>
            <Input
              id="ktp"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="mt-1"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: JPG, PNG, atau PDF (Max 5MB)
            </p>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Mendaftar..." : "Kirim Pendaftaran"}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              Data Anda akan direview oleh admin dalam 1-2 hari kerja
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MitraRegisterModal;
