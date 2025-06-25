
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
}

const LoginModal = ({ isOpen, onClose, onLoginSuccess, onRegisterClick }: LoginModalProps) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple demo login - in real app this would check against database
    if (loginData.email && loginData.password) {
      toast({
        title: "Login Berhasil!",
        description: "Selamat datang di dashboard mitra",
      });
      onLoginSuccess();
    } else {
      toast({
        title: "Error",
        description: "Mohon lengkapi email dan password",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Login Mitra</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              placeholder="nama@email.com"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              placeholder="Password Anda"
              className="mt-1"
            />
          </div>
          
          <div className="space-y-3">
            <Button type="submit" className="w-full">
              Login
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Belum punya akun mitra?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={onRegisterClick}
                className="w-full"
              >
                Daftar Sebagai Mitra
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
