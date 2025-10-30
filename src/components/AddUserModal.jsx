import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '../services/api';
import { UserPlus, Loader2 } from 'lucide-react';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Geçersiz Şifre",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authAPI.register(formData);
      
      toast({
        title: "Kullanıcı Eklendi",
        description: `${formData.name} başarıyla eklendi.`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: ''
      });

      // Notify parent
      if (onUserAdded) {
        onUserAdded(response.data.user);
      }

      onClose();
    } catch (error) {
      console.error('Failed to create user:', error);
      toast({
        title: "Hata",
        description: error.response?.data?.error || "Kullanıcı eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: ''
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-slate-900">
            <UserPlus className="h-5 w-5 mr-2" />
            Yeni Kullanıcı Ekle
          </DialogTitle>
          <DialogDescription>
            Sisteme yeni personel ekleyin (Garson, Şef, Kasiyer veya Admin)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              İsim Soyisim <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Örn: Ahmet Yılmaz"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              E-posta <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Şifre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="En az 6 karakter"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={isSubmitting}
              required
              minLength={6}
            />
            <p className="text-xs text-slate-500">
              Kullanıcı ilk girişte şifresini değiştirebilir
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Rol <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleChange('role', value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Rol seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">
                  <div className="flex items-center">
                    <span className="font-medium">Admin</span>
                    <span className="ml-2 text-xs text-slate-500">Tam yetki</span>
                  </div>
                </SelectItem>
                <SelectItem value="WAITER">
                  <div className="flex items-center">
                    <span className="font-medium">Garson</span>
                    <span className="ml-2 text-xs text-slate-500">Servis yönetimi</span>
                  </div>
                </SelectItem>
                <SelectItem value="CHEF">
                  <div className="flex items-center">
                    <span className="font-medium">Şef</span>
                    <span className="ml-2 text-xs text-slate-500">Mutfak ekranı</span>
                  </div>
                </SelectItem>
                <SelectItem value="CASHIER">
                  <div className="flex items-center">
                    <span className="font-medium">Kasiyer</span>
                    <span className="ml-2 text-xs text-slate-500">Ödeme işlemleri</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ekleniyor...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Kullanıcı Ekle
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;

