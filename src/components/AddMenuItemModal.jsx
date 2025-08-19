import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Utensils,
  DollarSign,
  Hash,
  FileText,
  Package
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const AddMenuItemModal = ({ isOpen, onClose, restaurantId, categories, onMenuItemAdded }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    sku: ''
  });
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [createdItem, setCreatedItem] = useState(null);

  const resetForm = () => {
    setFormData({
      categoryId: '',
      name: '',
      description: '',
      price: '',
      sku: ''
    });
    setStep(1);
    setCreatedItem(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, categoryId: value }));
  };

  const generateSKU = () => {
    // Basit SKU üret (kategori adının ilk harfi + random sayı)
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    const categoryPrefix = selectedCategory ? selectedCategory.name.charAt(0).toUpperCase() : 'P';
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const sku = `${categoryPrefix}${randomNum}`;
    setFormData(prev => ({ ...prev, sku }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.categoryId || !formData.name.trim() || !formData.price) {
      toast({
        title: "Eksik Bilgi",
        description: "Kategori, ürün adı ve fiyat zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const itemResponse = await adminAPI.createMenuItem(restaurantId, {
        categoryId: formData.categoryId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        sku: formData.sku.trim()
      });

      const newItem = itemResponse.data;
      setCreatedItem(newItem);

      // Success step'e geç
      setStep(2);
      
      // Parent component'e bildir
      onMenuItemAdded?.(newItem);

      toast({
        title: "Başarılı!",
        description: `${newItem.name} ürünü başarıyla oluşturuldu.`,
      });

    } catch (error) {
      console.error('Ürün oluşturma hatası:', error);
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Ürün oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          <>
            <DialogHeader>
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Utensils className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Yeni Ürün Oluştur
                  </DialogTitle>
                  <DialogDescription className="text-lg text-gray-600">
                    Menünüze yeni ürün ekleyin
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="categoryId" className="text-lg font-semibold text-gray-700 flex items-center">
                    <Package className="h-4 w-4 mr-2 text-purple-500" />
                    Kategori *
                  </Label>
                  <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="text-lg py-3 border-2 border-purple-200 focus:border-purple-500 rounded-xl">
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          📁 {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg font-semibold text-gray-700 flex items-center">
                    <Utensils className="h-4 w-4 mr-2 text-orange-500" />
                    Ürün Adı *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="örn: Margherita Pizza, Caesar Salata"
                    className="text-lg py-3 border-2 border-orange-200 focus:border-orange-500 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-lg font-semibold text-gray-700 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Açıklama (İsteğe bağlı)
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Ürün hakkında açıklama yazın (malzemeler, özellikler vb.)"
                  className="text-lg py-3 border-2 border-blue-200 focus:border-blue-500 rounded-xl min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-lg font-semibold text-gray-700 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                    Fiyat (₺) *
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="text-lg py-3 border-2 border-green-200 focus:border-green-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku" className="text-lg font-semibold text-gray-700 flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-teal-500" />
                    SKU Kodu
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="P0001"
                      className="text-lg py-3 border-2 border-teal-200 focus:border-teal-500 rounded-xl flex-1"
                    />
                    <Button 
                      type="button" 
                      onClick={generateSKU}
                      variant="outline"
                      className="px-4 border-2 border-teal-200 hover:bg-teal-50"
                      disabled={!formData.categoryId}
                    >
                      <Hash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ürün Oluştur
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
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <DialogTitle className="text-2xl font-bold text-gray-800 mb-2">
                  🎉 Ürün Başarıyla Oluşturuldu!
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600">
                  Ürün menüde görünmeye hazır
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Ürün Adı</p>
                      <p className="text-xl font-bold text-gray-800">{createdItem?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Fiyat</p>
                      <Badge className="text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 text-white">
                        ₺{createdItem?.price?.toFixed(2)}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 font-medium">SKU</p>
                      <p className="text-lg font-semibold text-gray-700">{createdItem?.sku || 'Yok'}</p>
                    </div>
                  </div>
                  {createdItem?.description && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm text-gray-600 font-medium">Açıklama</p>
                      <p className="text-gray-700 mt-1">{createdItem.description}</p>
                    </div>
                  )}
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

export default AddMenuItemModal;
