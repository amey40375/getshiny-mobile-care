
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
}

const LoginModal = ({ isOpen, onClose, onLoginSuccess, onRegisterClick }: LoginModalProps) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      return;
    }

    if (isSignUp) {
      const { error } = await signUp(loginData.email, loginData.password);
      if (!error) {
        onLoginSuccess();
      }
    } else {
      const { error } = await signIn(loginData.email, loginData.password);
      if (!error) {
        onLoginSuccess();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isSignUp ? 'Daftar Akun Mitra' : 'Login Mitra'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              {isSignUp ? 'Daftar' : 'Login'}
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
              </Button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Ingin daftar sebagai mitra?
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
