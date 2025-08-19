import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, CheckCircle, Utensils, AlertCircle, RefreshCw } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import { io } from 'socket.io-client';

const OrderTracking = ({ tableId, tenantId, restaurantId, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!tableId || !restaurantId || !tenantId) return;
    
    console.log('🔌 Customer WebSocket bağlantısı kuruluyor...');
    
    // Initialize WebSocket connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000
    });
    
    setSocket(newSocket);

    // Connection handlers
    newSocket.on('connect', () => {
      console.log('✅ Customer WebSocket bağlandı:', newSocket.id);
      // Join table room after connection
      newSocket.emit('join-table', { tenantId, restaurantId, tableId });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Customer WebSocket bağlantı hatası:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Customer WebSocket bağlantısı kesildi:', reason);
    });

    // Listen for order updates
    newSocket.on('order.updated', (orderData) => {
      console.log('🔄 Customer: Sipariş güncellendi:', orderData);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderData.orderId
            ? { ...order, status: orderData.status }
            : order
        )
      );

      // Show notification for status changes
      if (orderData.status === 'READY') {
        toast({
          title: "Siparişiniz Hazır!",
          description: "Siparişiniz servise hazır, garsonumuz masanıza getirmek üzere.",
          variant: "success",
        });
      } else if (orderData.status === 'IN_PROGRESS') {
        toast({
          title: "Siparişiniz Hazırlanıyor",
          description: "Mutfağımız siparişinizi hazırlamaya başladı.",
        });
      }
    });

    // Cleanup function
    return () => {
      console.log('🧹 Customer WebSocket temizleniyor...');
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [tableId, tenantId, restaurantId]); // Bu bileşende bu parametreler değişebilir

  useEffect(() => {
    loadOrders();
  }, [tableId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getTableOrders(tableId);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: "Hata",
        description: "Siparişler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await ordersAPI.updateOrderStatus(orderId, 'CANCELLED');
      toast({
        title: "Sipariş İptal Edildi",
        description: "Siparişiniz başarıyla iptal edildi.",
        variant: "success",
      });
      loadOrders(); // Refresh orders
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast({
        title: "Hata",
        description: "Sipariş iptal edilirken bir hata oluştu.",
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
      'CANCELLED': 'İptal Edildi'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800 border-blue-200',
      'READY': 'bg-green-100 text-green-800 border-green-200',
      'SERVED': 'bg-purple-100 text-purple-800 border-purple-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'PENDING': <Clock className="h-4 w-4" />,
      'IN_PROGRESS': <ChefHat className="h-4 w-4" />,
      'READY': <CheckCircle className="h-4 w-4" />,
      'SERVED': <Utensils className="h-4 w-4" />,
      'CANCELLED': <X className="h-4 w-4" />
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
      'SERVED': 100
    };
    return statusProgress[status] || 0;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src="/pardonbakarmisin-logo.png" alt="Logo" className="h-6 w-6 mr-2 rounded" />
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
            <img src="/pardonbakarmisin-logo.png" alt="Logo" className="h-6 w-6 mr-2 rounded" />
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
          <img src="/pardonbakarmisin-logo.png" alt="Logo" className="h-6 w-6 mr-2 rounded" />
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
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
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
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {order.status === 'PENDING' && "Siparişiniz alındı ve mutfağa iletildi."}
                    {order.status === 'IN_PROGRESS' && "Siparişiniz hazırlanıyor. Lütfen bekleyiniz."}
                    {order.status === 'READY' && "Siparişiniz hazır! Garsonumuz masanıza getiriyor."}
                    {order.status === 'SERVED' && "Siparişiniz servis edildi. Afiyet olsun!"}
                  </p>
                </div>
                
                {/* Action Buttons */}
                {(order.status === 'PENDING' || order.status === 'IN_PROGRESS') && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      İptal Et
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrderTracking;

