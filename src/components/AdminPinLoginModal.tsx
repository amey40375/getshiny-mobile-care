
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock } from "lucide-react";

interface AdminPinLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLogin: () => void;
}

const AdminPinLoginModal = ({ isOpen, onClose, onAdminLogin }: AdminPinLoginModalProps) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const ADMIN_PIN = "011090";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (pin === ADMIN_PIN) {
      toast({
        title: "Login Admin Berhasil!",
        description: "Selamat datang Admin, mengarahkan ke dashboard...",
      });
      
      handleClose();
      setTimeout(() => {
        onAdminLogin();
      }, 100);
    } else {
      toast({
        title: "PIN Salah",
        description: "PIN yang Anda masukkan tidak valid. Silakan coba lagi.",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Admin Access
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 text-center">
            <strong>Masukkan PIN Admin untuk mengakses Dashboard Admin</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-pin">PIN Admin</Label>
            <div className="relative">
              <Input
                id="admin-pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN Admin"
                required
                className="w-full pr-10"
                maxLength={6}
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 text-center">
              <strong>PIN Admin:</strong> 011090
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={loading || !pin}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifikasi...
                </div>
              ) : (
                'Login Admin'
              )}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600 mt-4">
          <p>Masukkan PIN yang benar untuk mengakses sistem admin</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPinLoginModal;
