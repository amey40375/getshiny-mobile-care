
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield } from "lucide-react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminLogin: () => void;
}

const AdminLoginModal = ({ isOpen, onClose, onAdminLogin }: AdminLoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { createProfile } = useProfile();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Error",
          description: "Email atau password salah",
          variant: "destructive"
        });
        return;
      }

      // Create or update profile as admin
      await createProfile(email, '', 'admin');
      
      toast({
        title: "Login Berhasil!",
        description: "Selamat datang Admin",
      });

      onAdminLogin();
      onClose();
      
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat login admin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Admin Login
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">
            <strong>Cara Akses Admin:</strong>
          </p>
          <ul className="text-sm text-red-700 mt-2 space-y-1">
            <li>1. Buat akun baru dengan email dan password</li>
            <li>2. Login menggunakan form ini</li>
            <li>3. Akun akan otomatis dibuat sebagai Admin</li>
            <li>4. Anda dapat mengakses semua fitur admin</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email Admin</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@getshiny.com"
              required
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password Admin</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password admin"
                required
                className="w-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Contoh untuk testing:</strong><br/>
              Email: admin@getshiny.com<br/>
              Password: admin123
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
              disabled={loading || !email || !password}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Login...
                </div>
              ) : (
                'Login Admin'
              )}
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600 mt-4">
          <p>Hanya untuk administrator sistem GetShiny</p>
          <p className="text-xs mt-1">
            Jika belum punya akun, buat akun baru dengan email dan password yang mudah diingat
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLoginModal;
