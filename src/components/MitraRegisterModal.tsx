
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
    ktp: null as File | null
  });
  const { toast } = useToast();
  const { createProfile } = useMitraProfile();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.whatsapp || !formData.email || !formData.work_location) {
      toast({
        title: "Error",
        description: "Mohon lengkapi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    // First create auth account
    const { error: authError } = await signUp(formData.email, 'temporaryPassword123');
    if (authError) {
      return;
    }

    // Then create mitra profile
    const profileData = {
      name: formData.name,
      address: formData.address,
      whatsapp: formData.whatsapp,
      email: formData.email,
      work_location: formData.work_location,
      ktp_url: formData.ktp ? formData.ktp.name : undefined
    };

    const result = await createProfile(profileData);
    if (result) {
      onSuccess();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, ktp: e.target.files[0] });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            />
          </div>
          
          <div>
            <Label htmlFor="whatsapp">Nomor WhatsApp *</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="08123456789"
              className="mt-1"
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
            />
          </div>
          
          <div>
            <Label htmlFor="ktp">Upload KTP *</Label>
            <Input
              id="ktp"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: JPG, PNG, atau PDF (Max 5MB)
            </p>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button type="submit" className="w-full">
              Kirim Pendaftaran
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
