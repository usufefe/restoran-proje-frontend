import { useState, useEffect, useCallback } from 'react';
import logoImage from '../assets/logo.png';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, CheckCircle, Utensils, AlertCircle, RefreshCw, X } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import { io } from 'socket.io-client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const OrderTracking = ({ tableId, tenantId, restaurantId, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getTableOrders(tableId);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    if (!tableId || !restaurantId || !tenantId) return;
    
    // Load orders once
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await ordersAPI.getTableOrders(tableId);
        setOrders(response.data);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // Initialize WebSocket connection
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000
    });
    
    socket.on('connect', () => {
      socket.emit('join-table', { tenantId, restaurantId, tableId });
    });

    socket.on('order.updated', (orderData) => {
      setOrders(prev =>
        prev.map(order =>
          order.id === orderData.orderId
            ? { ...order, status: orderData.status }
            : order
        )
      );
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [tableId, tenantId, restaurantId]);

  const openCancelDialog = (order) => {
    setSelectedOrderToCancel(order);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedOrderToCancel) return;
    
    if (!cancelReason) {
      toast({
        title: "İptal Sebebi Gerekli",
        description: "Lütfen iptal sebebini seçiniz.",
        variant: "destructive",
      });
      return;
    }

    try {
      await ordersAPI.cancelOrder(selectedOrderToCancel.id, {
        reason: cancelReason
      });
      
      toast({
        title: "Sipariş İptal Edildi",
        description: "Siparişiniz başarıyla iptal edildi.",
      });
      
      // Update orders state directly instead of reloading
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrderToCancel.id
            ? { ...order, status: 'CANCELLED' }
            : order
        )
      );
      
      setCancelDialogOpen(false);
      setSelectedOrderToCancel(null);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast({
        title: "Hata",
        description: error.response?.data?.error || "Sipariş iptal edilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Sipariş Alındı',
      'IN_PROGRESS': 'Hazırlanıyor',
      'READY': 'Servise Hazır',
      'SERVED': 'Servis Edildi',
      'CANCELLED': 'İptal Edildi',
      'CLOSED': 'Kapatıldı'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800 border-blue-200',
      'READY': 'bg-green-100 text-green-800 border-green-200',
      'SERVED': 'bg-purple-100 text-purple-800 border-purple-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
      'CLOSED': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'PENDING': <Clock className="h-4 w-4" />,
      'IN_PROGRESS': <ChefHat className="h-4 w-4" />,
      'READY': <CheckCircle className="h-4 w-4" />,
      'SERVED': <Utensils className="h-4 w-4" />,
      'CANCELLED': <X className="h-4 w-4" />,
      'CLOSED': <CheckCircle className="h-4 w-4" />
    };
    return iconMap[status] || <AlertCircle className="h-4 w-4" />;
  };

  const getElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `${hours}s ${minutes}d önce`;
  };

  const getProgressPercentage = (status) => {
    const statusProgress = {
      'PENDING': 25,
      'IN_PROGRESS': 50,
      'READY': 75,
      'SERVED': 100,
      'CANCELLED': 0,
      'CLOSED': 100
    };
    return statusProgress[status] || 0;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={logoImage} alt="Logo" className="h-8 w-8 mr-2 rounded-lg object-cover" />
            <h2 className="text-lg font-semibold">Siparişleriniz</h2>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={logoImage} alt="Logo" className="h-8 w-8 mr-2 rounded-lg object-cover" />
            <h2 className="text-lg font-semibold">Siparişleriniz</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <ChefHat className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <p className="text-gray-600">Siparişiniz hazırlanıyor</p>
            <p className="text-sm text-gray-500 mt-2">
              Siparişiniz henüz görünmüyor olabilir. Lütfen birkaç saniye bekleyin.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadOrders}
              className="mt-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 mr-2 rounded" />
          <h2 className="text-lg font-semibold">Siparişleriniz</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={loadOrders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Sipariş #{order.id.slice(-8)}
                  </CardTitle>
                  <CardDescription>
                    {getElapsedTime(order.createdAt)} • {order.items.length} ürün
                  </CardDescription>
                </div>
                <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1`}>
                  {getStatusIcon(order.status)}
                  <span>{getStatusText(order.status)}</span>
                </Badge>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-orange-600'
                  }`}
                  style={{ width: `${getProgressPercentage(order.status)}%` }}
                ></div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Order Items */}
              <div className="space-y-2 mb-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{item.qty}x</span>
                      <span>{item.name}</span>
                      {item.notes && (
                        <span className="text-gray-500 text-xs">({item.notes})</span>
                      )}
                    </div>
                    <span className="font-medium">
                      {(item.unitPrice * item.qty).toFixed(2)} ₺
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-3 flex justify-between items-center font-semibold">
                <span>Toplam</span>
                <span className="text-lg">{order.grandTotal.toFixed(2)} ₺</span>
              </div>

              {/* Status Message and Actions */}
              <div className="mt-3 space-y-3">
                <div className={`p-3 rounded-lg ${order.status === 'CANCELLED' ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-700">
                    {order.status === 'PENDING' && "Siparişiniz alındı ve mutfağa iletildi."}
                    {order.status === 'IN_PROGRESS' && "Siparişiniz hazırlanıyor. Lütfen bekleyiniz."}
                    {order.status === 'READY' && "Siparişiniz hazır! Garsonumuz masanıza getiriyor."}
                    {order.status === 'SERVED' && "Siparişiniz servis edildi. Afiyet olsun!"}
                    {order.status === 'CANCELLED' && "❌ Bu sipariş iptal edildi."}
                    {order.status === 'CLOSED' && "✅ Sipariş tamamlandı ve kapatıldı."}
                  </p>
                </div>
                
                {/* Action Buttons */}
                {(order.status === 'PENDING' || order.status === 'IN_PROGRESS') && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="w-full"
                      onClick={() => openCancelDialog(order)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Siparişi İptal Et
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Siparişi İptal Et
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOrderToCancel && (
                <>
                  <span className="font-semibold">Sipariş #{selectedOrderToCancel.id.slice(-8)}</span> iptal edilecek.
                  Bu işlem geri alınamaz.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 px-6">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason" className="text-gray-700 font-medium">
                İptal Sebebi <span className="text-red-500">*</span>
              </Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger id="cancel-reason" className="w-full">
                  <SelectValue placeholder="Lütfen bir sebep seçiniz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="changed_mind">Fikrim değişti</SelectItem>
                  <SelectItem value="wrong_order">Yanlış sipariş verdim</SelectItem>
                  <SelectItem value="too_long">Çok uzun sürdü</SelectItem>
                  <SelectItem value="duplicate">Yanlışlıkla iki kez sipariş verdim</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedOrderToCancel && selectedOrderToCancel.status === 'IN_PROGRESS' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Siparişiniz mutfakta hazırlanıyor. İptal etmeniz durumunda fire oluşabilir.
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Vazgeç
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelOrder}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
              disabled={!cancelReason}
            >
              Evet, İptal Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderTracking;

