import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  QrCode, 
  Plus, 
  X, 
  Check,
  Hash,
  MapPin,
  Sparkles
} from 'lucide-react';
import { adminAPI, sessionAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const AddTableModal = ({ isOpen, onClose, restaurantId, onTableAdded }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const [step, setStep] = useState(1); // 1: Form, 2: Success with QR
  const [createdTable, setCreatedTable] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      code: ''
    });
    setStep(1);
    setCreatedTable(null);
    setQrCodeData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateTableCode = () => {
    const randomCode = 'T' + Math.random().toString(36).substr(2, 3).toUpperCase();
    setFormData(prev => ({ ...prev, code: randomCode }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Masa adı ve kodu zorunludur.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Masayı oluştur
      const tableResponse = await adminAPI.createTable(restaurantId, {
        name: formData.name.trim(),
        code: formData.code.trim()
      });

      const newTable = tableResponse.data;
      setCreatedTable(newTable);

      // 2. QR kod oluştur
      try {
        const qrResponse = await sessionAPI.getQRCode(newTable.id);
        setQrCodeData(qrResponse.data);
      } catch (qrError) {
        console.error('QR kod oluşturulamadı:', qrError);
        // QR oluşturulamazsa bile masa oluşturuldu, devam et
      }

      // 3. Success step'e geç
      setStep(2);
      
      // 4. Parent component'e bildir
      onTableAdded?.(newTable);

      toast({
        title: "Başarılı!",
        description: `${newTable.name} başarıyla oluşturuldu ve QR kod hazırlandı.`,
      });

    } catch (error) {
      console.error('Masa oluşturma hatası:', error);
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Masa oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQR = () => {
    if (!createdTable || !qrCodeData) return;

    // QR kodu yeni pencerede göster
    const newWindow = window.open('', '_blank', 'width=600,height=800');
    newWindow.document.write(`
      <html>
        <head>
          <title>QR Kod - ${createdTable.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .qr-container {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(20px);
              border-radius: 30px;
              padding: 50px;
              box-shadow: 0 30px 60px rgba(0,0,0,0.2);
              max-width: 450px;
              width: 100%;
              text-align: center;
              border: 1px solid rgba(255, 255, 255, 0.3);
            }
            h1 {
              color: #2C3E50;
              font-size: 28px;
              margin: 0 0 15px 0;
              font-weight: 800;
            }
            h2 {
              color: #FF6B35;
              font-size: 20px;
              margin: 0 0 40px 0;
              font-weight: 600;
            }
            .qr-section {
              margin: 40px 0;
              padding: 30px;
              background: linear-gradient(135deg, #f8f9fa, #e9ecef);
              border-radius: 25px;
              border: 3px dashed #4ECDC4;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 20px;
              box-shadow: 0 15px 30px rgba(0,0,0,0.15);
            }
            .print-btn {
              background: linear-gradient(135deg, #FF6B35, #F39C12);
              color: white;
              border: none;
              padding: 18px 25px;
              border-radius: 15px;
              font-size: 16px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.3s ease;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>🍽️ ${createdTable.name}</h1>
            <h2>📋 ${createdTable.code}</h2>
            <div class="qr-section">
              <img src="${qrCodeData.qrCodeImage}" alt="QR Kod" />
            </div>
            <button onclick="window.print()" class="print-btn">
              🖨️ Yazdır
            </button>
          </div>
        </body>
      </html>
    `);
    newWindow.document.close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          <>
            <DialogHeader>
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-800">
                    Yeni Masa Oluştur
                  </DialogTitle>
                  <DialogDescription className="text-lg text-gray-600">
                    Masa bilgilerini girin ve QR kod otomatik oluşturulsun
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-lg font-semibold text-gray-700 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                    Masa Adı *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="örn: Masa 1, VIP Masa, Balkon Masa"
                    className="text-lg py-3 border-2 border-orange-200 focus:border-orange-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-lg font-semibold text-gray-700 flex items-center">
                    <Hash className="h-4 w-4 mr-2 text-teal-500" />
                    Masa Kodu *
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="örn: T01, A1, VIP1"
                      className="text-lg py-3 border-2 border-teal-200 focus:border-teal-500 rounded-xl flex-1"
                      required
                    />
                    <Button 
                      type="button" 
                      onClick={generateTableCode}
                      variant="outline"
                      className="px-4 border-2 border-teal-200 hover:bg-teal-50"
                    >
                      <Sparkles className="h-4 w-4" />
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
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white shadow-xl"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Masa Oluştur & QR Üret
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
                  🎉 Masa Başarıyla Oluşturuldu!
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600">
                  QR kod hazırlandı ve kullanıma hazır
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Masa Adı</p>
                      <p className="text-xl font-bold text-gray-800">{createdTable?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Masa Kodu</p>
                      <Badge className="text-lg font-bold bg-gradient-to-r from-orange-500 to-teal-500 text-white">
                        {createdTable?.code}
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

              <div className="text-center space-y-4">
                <Button
                  onClick={handleViewQR}
                  disabled={!qrCodeData}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl px-8 py-3"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  QR Kodu Görüntüle & Yazdır
                </Button>
                {!qrCodeData && (
                  <p className="text-sm text-amber-600">
                    ⚠️ QR kod oluşturulamadı, ancak masa başarıyla eklendi
                  </p>
                )}
              </div>
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

export default AddTableModal;
