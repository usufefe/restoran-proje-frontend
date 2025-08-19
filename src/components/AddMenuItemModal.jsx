import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Package,
  Upload,
  Camera,
  Star,
  Heart,
  Flame,
  Leaf,
  Clock,
  Users,
  ChefHat,
  Zap,
  Award,
  TrendingUp,
  Eye,
  Share2,
  Save,
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  Trash2,
  RotateCcw,
  Sparkles,
  Target,
  BarChart3,
  AlertTriangle,
  Info
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const EnhancedAddMenuItemModal = ({ isOpen, onClose, restaurantId, categories, onMenuItemAdded }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  
  // Form verileri
  const [formData, setFormData] = useState({
    // Temel bilgiler
    categoryId: '',
    name: '',
    description: '',
    price: '',
    sku: '',
    
    // Görsel bilgiler
    images: [],
    
    // Besin değerleri
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    
    // Alerjen bilgileri
    allergens: [],
    
    // Stok ve durum
    stockQuantity: '',
    isAvailable: true,
    isFeatured: false,
    isPopular: false,
    isNew: false,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
    
    // Ek bilgiler
    preparationTime: '',
    servingSize: '',
    difficulty: 'easy',
    tags: [],
    
    // Sosyal medya
    instagramHashtags: '',
    socialDescription: ''
  });

  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [createdItem, setCreatedItem] = useState(null);

  // Alerjen listesi
  const allergenOptions = [
    { id: 'gluten', label: 'Gluten', icon: '🌾' },
    { id: 'dairy', label: 'Süt Ürünleri', icon: '🥛' },
    { id: 'eggs', label: 'Yumurta', icon: '🥚' },
    { id: 'nuts', label: 'Fındık/Fıstık', icon: '🥜' },
    { id: 'soy', label: 'Soya', icon: '🫘' },
    { id: 'fish', label: 'Balık', icon: '🐟' },
    { id: 'shellfish', label: 'Kabuklu Deniz Ürünleri', icon: '🦐' },
    { id: 'sesame', label: 'Susam', icon: '🌰' }
  ];

  // Tag önerileri
  const tagSuggestions = [
    'Popüler', 'Şefin Önerisi', 'Sınırlı Süre', 'Yeni', 'Organik', 
    'Ev Yapımı', 'Geleneksel', 'Modern', 'Fusion', 'Sağlıklı',
    'Protein Açısından Zengin', 'Düşük Kalori', 'Comfort Food', 'Gourmet'
  ];

  const resetForm = () => {
    setFormData({
      categoryId: '',
      name: '',
      description: '',
      price: '',
      sku: '',
      images: [],
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      allergens: [],
      stockQuantity: '',
      isAvailable: true,
      isFeatured: false,
      isPopular: false,
      isNew: false,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isSpicy: false,
      preparationTime: '',
      servingSize: '',
      difficulty: 'easy',
      tags: [],
      instagramHashtags: '',
      socialDescription: ''
    });
    setCurrentStep(1);
    setStep(1);
    setCreatedItem(null);
    setImages([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'price' ? parseFloat(value) || 0 : value)
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, categoryId: value }));
  };

  const generateSKU = () => {
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    const categoryPrefix = selectedCategory ? selectedCategory.name.charAt(0).toUpperCase() : 'P';
    const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const sku = `${categoryPrefix}${randomNum}`;
    setFormData(prev => ({ ...prev, sku }));
  };

  // Görsel yükleme fonksiyonları
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            id: Date.now() + Math.random(),
            file: file,
            preview: e.target.result,
            name: file.name,
            size: file.size
          };
          setImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleAllergenChange = (allergenId, checked) => {
    setFormData(prev => ({
      ...prev,
      allergens: checked 
        ? [...prev.allergens, allergenId]
        : prev.allergens.filter(id => id !== allergenId)
    }));
  };

  const addTag = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const getStepProgress = () => {
    return (currentStep / 4) * 100;
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.categoryId && formData.name.trim() && formData.price;
      case 2:
        return true; // Görsel opsiyonel
      case 3:
        return true; // Besin değerleri opsiyonel
      case 4:
        return true; // Son kontrol
      default:
        return false;
    }
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
      // Temel ürün verilerini hazırla (mevcut API yapısını koruyoruz)
      const itemData = {
        categoryId: formData.categoryId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        sku: formData.sku.trim(),
        // Ek veriler meta olarak eklenebilir
        metadata: {
          nutrition: {
            calories: formData.calories,
            protein: formData.protein,
            carbs: formData.carbs,
            fat: formData.fat,
            fiber: formData.fiber
          },
          allergens: formData.allergens,
          properties: {
            isVegetarian: formData.isVegetarian,
            isVegan: formData.isVegan,
            isGlutenFree: formData.isGlutenFree,
            isSpicy: formData.isSpicy,
            isFeatured: formData.isFeatured,
            isPopular: formData.isPopular,
            isNew: formData.isNew
          },
          details: {
            preparationTime: formData.preparationTime,
            servingSize: formData.servingSize,
            difficulty: formData.difficulty,
            stockQuantity: formData.stockQuantity,
            isAvailable: formData.isAvailable
          },
          tags: formData.tags,
          social: {
            instagramHashtags: formData.instagramHashtags,
            socialDescription: formData.socialDescription
          },
          images: images.map(img => img.name) // Görsel isimleri
        }
      };

      const itemResponse = await adminAPI.createMenuItem(restaurantId, itemData);
      const newItem = itemResponse.data;
      setCreatedItem(newItem);

      // Success step'e geç
      setStep(2);
      
      // Parent component'e bildir
      onMenuItemAdded?.(newItem);

      toast({
        title: "🎉 Başarılı!",
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

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
          <Utensils className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Temel Bilgiler</h3>
        <p className="text-gray-600">Ürününüzün temel özelliklerini girin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div className="space-y-2">
          <Label htmlFor="categoryId" className="text-sm font-semibold text-gray-700 flex items-center">
            <Package className="h-4 w-4 mr-2 text-purple-500" />
            Kategori *
          </Label>
          <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger className="h-12 border-2 border-purple-200 focus:border-purple-500 rounded-2xl bg-white/50 backdrop-blur-sm">
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
          <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
            <Utensils className="h-4 w-4 mr-2 text-orange-500" />
            Ürün Adı *
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="örn: Margherita Pizza, Caesar Salata"
            className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-2xl bg-white/50 backdrop-blur-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-semibold text-gray-700 flex items-center">
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
            className="h-12 border-2 border-green-200 focus:border-green-500 rounded-2xl bg-white/50 backdrop-blur-sm"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
          <FileText className="h-4 w-4 mr-2 text-blue-500" />
          Açıklama
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Ürün hakkında detaylı açıklama yazın..."
          className="min-h-[120px] border-2 border-blue-200 focus:border-blue-500 rounded-2xl bg-white/50 backdrop-blur-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div className="space-y-2">
          <Label htmlFor="sku" className="text-sm font-semibold text-gray-700 flex items-center">
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
              className="h-12 border-2 border-teal-200 focus:border-teal-500 rounded-2xl bg-white/50 backdrop-blur-sm flex-1"
            />
            <Button 
              type="button" 
              onClick={generateSKU}
              variant="outline"
              className="h-12 px-4 border-2 border-teal-200 hover:bg-teal-50 rounded-2xl"
              disabled={!formData.categoryId}
            >
              <Hash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hızlı Özellikler */}
      <Card className="border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-gray-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
            Hızlı Özellikler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isVegetarian"
                checked={formData.isVegetarian}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVegetarian: checked }))}
              />
              <Label htmlFor="isVegetarian" className="text-sm flex items-center">
                <Leaf className="h-4 w-4 mr-1 text-green-500" />
                Vejetaryen
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isVegan"
                checked={formData.isVegan}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVegan: checked }))}
              />
              <Label htmlFor="isVegan" className="text-sm flex items-center">
                <Leaf className="h-4 w-4 mr-1 text-green-600" />
                Vegan
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isSpicy"
                checked={formData.isSpicy}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSpicy: checked }))}
              />
              <Label htmlFor="isSpicy" className="text-sm flex items-center">
                <Flame className="h-4 w-4 mr-1 text-red-500" />
                Acılı
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isGlutenFree"
                checked={formData.isGlutenFree}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGlutenFree: checked }))}
              />
              <Label htmlFor="isGlutenFree" className="text-sm flex items-center">
                <Award className="h-4 w-4 mr-1 text-blue-500" />
                Glutensiz
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4">
          <Camera className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Ürün Görselleri</h3>
        <p className="text-gray-600">Ürününüzün çekici görsellerini ekleyin</p>
      </div>

      {/* Görsel Yükleme Alanı */}
      <div
        className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
          dragActive 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Görselleri buraya sürükleyin veya seçin
            </p>
            <p className="text-sm text-gray-500 mb-4">
              PNG, JPG, JPEG formatları desteklenir (Maks. 5MB)
            </p>
            
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl px-6"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Görsel Seç
            </Button>
          </div>
        </div>
      </div>

      {/* Yüklenen Görseller */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-blue-500" />
            Yüklenen Görseller ({images.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <Button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <div className="mt-2">
                  <p className="text-xs text-gray-600 truncate">{image.name}</p>
                  <p className="text-xs text-gray-400">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Detaylı Bilgiler</h3>
        <p className="text-gray-600">Besin değerleri ve ek özellikler</p>
      </div>

      <Tabs defaultValue="nutrition" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-gray-100 p-1">
          <TabsTrigger value="nutrition" className="rounded-xl">Besin Değerleri</TabsTrigger>
          <TabsTrigger value="allergens" className="rounded-xl">Alerjenler</TabsTrigger>
          <TabsTrigger value="details" className="rounded-xl">Detaylar</TabsTrigger>
          <TabsTrigger value="marketing" className="rounded-xl">Pazarlama</TabsTrigger>
        </TabsList>

        <TabsContent value="nutrition" className="space-y-4 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Kalori</Label>
              <Input
                name="calories"
                value={formData.calories}
                onChange={handleInputChange}
                placeholder="250"
                className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-2xl bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Protein (g)</Label>
              <Input
                name="protein"
                value={formData.protein}
                onChange={handleInputChange}
                placeholder="15"
                className="h-12 border-2 border-red-200 focus:border-red-500 rounded-2xl bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Karbonhidrat (g)</Label>
              <Input
                name="carbs"
                value={formData.carbs}
                onChange={handleInputChange}
                placeholder="30"
                className="h-12 border-2 border-yellow-200 focus:border-yellow-500 rounded-2xl bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Yağ (g)</Label>
              <Input
                name="fat"
                value={formData.fat}
                onChange={handleInputChange}
                placeholder="10"
                className="h-12 border-2 border-purple-200 focus:border-purple-500 rounded-2xl bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Lif (g)</Label>
              <Input
                name="fiber"
                value={formData.fiber}
                onChange={handleInputChange}
                placeholder="5"
                className="h-12 border-2 border-green-200 focus:border-green-500 rounded-2xl bg-white/50"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="allergens" className="space-y-4 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allergenOptions.map((allergen) => (
              <div key={allergen.id} className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-2xl hover:bg-gray-50">
                <Checkbox
                  id={allergen.id}
                  checked={formData.allergens.includes(allergen.id)}
                  onCheckedChange={(checked) => handleAllergenChange(allergen.id, checked)}
                />
                <Label htmlFor={allergen.id} className="flex items-center cursor-pointer">
                  <span className="text-lg mr-2">{allergen.icon}</span>
                  <span className="text-sm font-medium">{allergen.label}</span>
                </Label>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                Hazırlık Süresi (dk)
              </Label>
              <Input
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleInputChange}
                placeholder="15"
                className="h-12 border-2 border-blue-200 focus:border-blue-500 rounded-2xl bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <Users className="h-4 w-4 mr-2 text-green-500" />
                Porsiyon Büyüklüğü
              </Label>
              <Input
                name="servingSize"
                value={formData.servingSize}
                onChange={handleInputChange}
                placeholder="1 kişilik"
                className="h-12 border-2 border-green-200 focus:border-green-500 rounded-2xl bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <ChefHat className="h-4 w-4 mr-2 text-purple-500" />
                Zorluk Seviyesi
              </Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger className="h-12 border-2 border-purple-200 focus:border-purple-500 rounded-2xl bg-white/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">🟢 Kolay</SelectItem>
                  <SelectItem value="medium">🟡 Orta</SelectItem>
                  <SelectItem value="hard">🔴 Zor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700 flex items-center">
                <Package className="h-4 w-4 mr-2 text-orange-500" />
                Stok Miktarı
              </Label>
              <Input
                name="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={handleInputChange}
                placeholder="100"
                className="h-12 border-2 border-orange-200 focus:border-orange-500 rounded-2xl bg-white/50"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6 mt-6">
          {/* Öne Çıkarma Seçenekleri */}
          <Card className="border-2 border-yellow-200 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Öne Çıkarma Seçenekleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                  />
                  <Label htmlFor="isFeatured" className="text-sm flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    Öne Çıkan
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPopular"
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPopular: checked }))}
                  />
                  <Label htmlFor="isPopular" className="text-sm flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-red-500" />
                    Popüler
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isNew"
                    checked={formData.isNew}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked }))}
                  />
                  <Label htmlFor="isNew" className="text-sm flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-blue-500" />
                    Yeni
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                  />
                  <Label htmlFor="isAvailable" className="text-sm flex items-center">
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    Mevcut
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Etiketler */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-700 flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-500" />
              Etiketler
            </Label>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {tagSuggestions.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tag)}
                  className={`rounded-full text-xs ${
                    formData.tags.includes(tag) 
                      ? 'bg-purple-100 border-purple-300 text-purple-700' 
                      : 'hover:bg-purple-50'
                  }`}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTag(tag)}
                      className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sosyal Medya */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-gray-700 flex items-center">
              <Share2 className="h-5 w-5 mr-2 text-pink-500" />
              Sosyal Medya
            </Label>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Instagram Hashtag'leri</Label>
                <Input
                  name="instagramHashtags"
                  value={formData.instagramHashtags}
                  onChange={handleInputChange}
                  placeholder="#lezzetli #taze #organik"
                  className="h-12 border-2 border-pink-200 focus:border-pink-500 rounded-2xl bg-white/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Sosyal Medya Açıklaması</Label>
                <Textarea
                  name="socialDescription"
                  value={formData.socialDescription}
                  onChange={handleInputChange}
                  placeholder="Sosyal medyada paylaşım için kısa açıklama..."
                  className="min-h-[80px] border-2 border-pink-200 focus:border-pink-500 rounded-2xl bg-white/50 resize-none"
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
          <Check className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">Son Kontrol</h3>
        <p className="text-gray-600">Bilgileri kontrol edin ve ürünü oluşturun</p>
      </div>

      <Card className="border-2 border-emerald-200 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Eye className="h-5 w-5 mr-2 text-emerald-600" />
            Ürün Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Temel Bilgiler</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Ürün Adı:</span> {formData.name}</p>
                <p><span className="font-medium">Kategori:</span> {categories.find(c => c.id === formData.categoryId)?.name}</p>
                <p><span className="font-medium">Fiyat:</span> ₺{formData.price}</p>
                {formData.sku && <p><span className="font-medium">SKU:</span> {formData.sku}</p>}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Özellikler</h4>
              <div className="flex flex-wrap gap-1">
                {formData.isVegetarian && <Badge variant="secondary" className="text-xs">🌱 Vejetaryen</Badge>}
                {formData.isVegan && <Badge variant="secondary" className="text-xs">🌿 Vegan</Badge>}
                {formData.isSpicy && <Badge variant="secondary" className="text-xs">🌶️ Acılı</Badge>}
                {formData.isGlutenFree && <Badge variant="secondary" className="text-xs">🚫 Glutensiz</Badge>}
                {formData.isFeatured && <Badge variant="secondary" className="text-xs">⭐ Öne Çıkan</Badge>}
                {formData.isPopular && <Badge variant="secondary" className="text-xs">🔥 Popüler</Badge>}
                {formData.isNew && <Badge variant="secondary" className="text-xs">✨ Yeni</Badge>}
              </div>
            </div>
          </div>

          {/* Görseller */}
          {images.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Görseller ({images.length})</h4>
              <div className="flex space-x-2 overflow-x-auto">
                {images.slice(0, 4).map((image) => (
                  <div key={image.id} className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img src={image.preview} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {images.length > 4 && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-600">+{images.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Açıklama */}
          {formData.description && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Açıklama</h4>
              <p className="text-sm text-gray-600 bg-white p-3 rounded-xl border">{formData.description}</p>
            </div>
          )}

          {/* Etiketler */}
          {formData.tags.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Etiketler</h4>
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] overflow-hidden flex flex-col p-0">
        {step === 1 ? (
          <>
            <DialogHeader className="flex-shrink-0 px-4 lg:px-8 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Yeni Ürün Oluştur
                    </DialogTitle>
                    <DialogDescription className="text-lg text-gray-600">
                      Gelişmiş ürün ekleme sihirbazı
                    </DialogDescription>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-500">Adım {currentStep} / 4</p>
                  <Progress value={getStepProgress()} className="w-32 h-2 mt-1" />
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-4 lg:px-8">
              <form onSubmit={handleSubmit} className="space-y-8 py-6">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
              </form>
            </div>

            <DialogFooter className="flex-shrink-0 flex justify-between pt-6 pb-4 border-t px-4 lg:px-8">
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-2xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
                
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-6 py-3 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 rounded-2xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Geri
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                {currentStep < 4 ? (
                  <Button 
                    type="button"
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={!canProceedToNextStep()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl rounded-2xl"
                  >
                    İleri
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-xl rounded-2xl"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Ürün Oluştur
                      </>
                    )}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="px-4 lg:px-8 py-4 border-b">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 rounded-full flex items-center justify-center mb-6 relative">
                  <Check className="h-10 w-10 text-white" />
                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 rounded-full blur opacity-25 animate-pulse"></div>
                </div>
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  🎉 Ürün Başarıyla Oluşturuldu!
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600">
                  Ürün menüde görünmeye hazır ve müşterileriniz tarafından sipariş edilebilir
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6 overflow-y-auto px-4 lg:px-8">
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Ürün Adı</p>
                        <p className="text-2xl font-bold text-gray-800">{createdItem?.name}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Fiyat</p>
                          <Badge className="text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl px-3 py-1">
                            ₺{createdItem?.price?.toFixed(2)}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 font-medium">SKU</p>
                          <p className="text-lg font-semibold text-gray-700">{createdItem?.sku || 'Yok'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {images.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-2">Ürün Görselleri</p>
                        <div className="grid grid-cols-3 gap-2">
                          {images.slice(0, 3).map((image) => (
                            <div key={image.id} className="aspect-square rounded-xl overflow-hidden border-2 border-emerald-200">
                              <img src={image.preview} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {createdItem?.description && (
                    <div className="mt-6 pt-6 border-t border-emerald-200">
                      <p className="text-sm text-gray-600 font-medium">Açıklama</p>
                      <p className="text-gray-700 mt-1">{createdItem.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Hızlı Aksiyonlar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-12 rounded-2xl border-2 border-blue-200 hover:bg-blue-50">
                  <Eye className="h-4 w-4 mr-2" />
                  Ürünü Görüntüle
                </Button>
                
                <Button variant="outline" className="h-12 rounded-2xl border-2 border-purple-200 hover:bg-purple-50">
                  <Share2 className="h-4 w-4 mr-2" />
                  Sosyal Medyada Paylaş
                </Button>
                
                <Button variant="outline" className="h-12 rounded-2xl border-2 border-green-200 hover:bg-green-50">
                  <Plus className="h-4 w-4 mr-2" />
                  Başka Ürün Ekle
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-6 pb-4 px-4 lg:px-8 border-t">
              <Button 
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 rounded-2xl text-lg font-semibold"
              >
                <Check className="h-5 w-5 mr-2" />
                Harika! Devam Et
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddMenuItemModal;

