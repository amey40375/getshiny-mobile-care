
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminPinModal = ({ isOpen, onClose, onSuccess }: AdminPinModalProps) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (pin === '011090') {
      toast({
        title: "Akses Berhasil!",
        description: "Selamat datang Admin",
      });
      onSuccess();
      setPin('');
    } else {
      toast({
        title: "PIN Salah!",
        description: "PIN yang Anda masukkan tidak valid",
        variant: "destructive"
      });
      setPin('');
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
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Akses Admin
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center text-gray-600 text-sm">
            Masukkan PIN Admin untuk mengakses dashboard
          </div>
          
          <div>
            <Label htmlFor="pin">PIN Admin</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN 6 digit"
              className="mt-1 text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />
          </div>
          
          <div className="flex gap-3">
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
              className="flex-1"
              disabled={loading || pin.length !== 6}
            >
              {loading ? "Memverifikasi..." : "Masuk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPinModal;
