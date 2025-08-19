import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Plus, 
  X, 
  Check,
  FolderPlus,
  Hash,
  Sparkles
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const AddCategoryModal = ({ isOpen, onClose, restaurantId, onCategoryAdded }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sort: 0
  });
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [createdCategory, setCreatedCategory] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      sort: 0
    });
    setStep(1);
    setCreatedCategory(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sort' ? parseInt(value) || 0 : value
    }));
  };

  const generateSortOrder = () => {
    // Random sıralama değeri üret (0-100 arası)
    const randomSort = Math.floor(Math.random() * 100);
    setFormData(prev => ({ ...prev, sort: randomSort }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Kategori adı zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const categoryResponse = await adminAPI.createCategory(restaurantId, {
        name: formData.name.trim(),
        sort: formData.sort
      });

      const newCategory = categoryResponse.data;
      setCreatedCategory(newCategory);

      // Success step'e geç
      setStep(2);
      
      // Parent component'e bildir
      onCategoryAdded?.(newCategory);

      toast({
        title: "Başarılı!",
        description: `${newCategory.name} kategorisi başarıyla oluşturuldu.`,
      });

    } catch (error) {
      console.error('Kategori oluşturma hatası:', error);
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Kategori oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {step === 1 ? (
          <>
            <DialogHeader>
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <FolderPlus className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Yeni Kategori Oluştur
                  </DialogTitle>
                  <DialogDescription className="text-lg text-gray-600">
                    Menünüze yeni kategori ekleyin
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg font-semibold text-gray-700 flex items-center">
                  <FolderPlus className="h-4 w-4 mr-2 text-green-500" />
                  Kategori Adı *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="örn: Başlangıçlar, Ana Yemekler, Tatlılar, İçecekler"
                  className="text-lg py-3 border-2 border-green-200 focus:border-green-500 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort" className="text-lg font-semibold text-gray-700 flex items-center">
                  <Hash className="h-4 w-4 mr-2 text-blue-500" />
                  Sıralama (İsteğe bağlı)
                </Label>
                <div className="flex space-x-2">
                  <Input
                    id="sort"
                    name="sort"
                    type="number"
                    min="0"
                    max="999"
                    value={formData.sort}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="text-lg py-3 border-2 border-blue-200 focus:border-blue-500 rounded-xl flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={generateSortOrder}
                    variant="outline"
                    className="px-4 border-2 border-blue-200 hover:bg-blue-50"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Küçük sayılar menüde üstte görünür</p>
              </div>

              <DialogFooter className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Kategori Oluştur
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">
                  🎉 Kategori Başarıyla Oluşturuldu!
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600">
                  Artık bu kategoriye ürün ekleyebilirsiniz
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Kategori Adı</p>
                      <p className="text-xl font-bold text-gray-800">{createdCategory?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Sıralama</p>
                      <Badge className="text-lg font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        #{createdCategory?.sort}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Durum</p>
                      <Badge className="bg-green-500 text-white">✅ Aktif</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Oluşturulma</p>
                      <p className="text-lg font-semibold text-gray-700">Şimdi</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="pt-6">
              <Button 
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3"
              >
                <Check className="h-4 w-4 mr-2" />
                Tamam
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModal;
