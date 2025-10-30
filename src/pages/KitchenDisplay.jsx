import { useState, useEffect, useCallback } from 'react';
import logoImage from '../assets/logo.png';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Clock, CheckCircle, AlertCircle, LogOut, User } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const KitchenDisplay = () => {
  const { restaurantId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Auth kontrolü
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // loadOrders fonksiyonunu useEffect'lerden önce tanımla
  const loadOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await ordersAPI.getRestaurantOrders(restaurantId, {
        status: 'PENDING,IN_PROGRESS',
        limit: 20
      });
      setOrders(response.data);
    } catch (error) {
      // Sessiz hata
    } finally {
      setLoading(false);
    }
  }, [restaurantId, isAuthenticated]);

  // WebSocket için ayrı useEffect - loadOrders'dan sonra çalışsın
  useEffect(() => {
    if (!restaurantId || !socket) return;
    
    // Listen for new orders
    socket.on('order.created', (orderData) => {
      toast({
        title: "Yeni Sipariş!",
        description: `Masa ${orderData.tableCode} - ${orderData.itemCount} ürün`,
      });
      loadOrders();
    });

    // Listen for order updates
    socket.on('order.updated', (orderData) => {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderData.orderId
            ? { ...order, status: orderData.status }
            : order
        )
      );
    });

    // Listen for order cancellations
    socket.on('order.cancelled', (orderData) => {
      toast({
        title: "Sipariş İptal Edildi",
        description: `Masa ${orderData.tableCode} - Sebep: ${getCancelReasonText(orderData.reason)}`,
        variant: "destructive",
      });
      // Remove from active orders list
      setOrders(prevOrders =>
        prevOrders.filter(order => order.id !== orderData.orderId)
      );
    });

    return () => {
      socket.off('order.created');
      socket.off('order.updated');
      socket.off('order.cancelled');
    };
  }, [socket, loadOrders, restaurantId, toast]);

  useEffect(() => {
    if (!restaurantId) return;
    
    // Initialize WebSocket connection with better config
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    setSocket(newSocket);

    // Connection handlers
    newSocket.on('connect', () => {
      // Join kitchen room after connection
      newSocket.emit('join-kitchen', { restaurantId, station: 'HOT' });
    });

    newSocket.on('connect_error', (error) => {
      // Sessiz hata
    });

    newSocket.on('disconnect', (reason) => {
      // Sessiz disconnect
    });

    // Cleanup function
    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [restaurantId]); // SADECE restaurantId değiştiğinde yeniden bağlan

  useEffect(() => {
    if (!restaurantId || !isAuthenticated) return;
    
    // İlk yüklemede hemen çağır
    loadOrders();
    
    // 10 saniyede bir yenile
    const interval = setInterval(() => {
      loadOrders();
    }, 10000); // 10 saniye
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, isAuthenticated]); // loadOrders dependency'den çıkarıldı

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );

      toast({
        title: "Durum Güncellendi",
        description: `Sipariş durumu ${getStatusText(newStatus)} olarak güncellendi.`,
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast({
        title: "Hata",
        description: "Sipariş durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'PENDING': 'Bekliyor',
      'IN_PROGRESS': 'Hazırlanıyor',
      'READY': 'Hazır',
      'SERVED': 'Servis Edildi'
    };
    return statusMap[status] || status;
  };

  const getCancelReasonText = (reason) => {
    const reasonMap = {
      'changed_mind': 'Fikrim değişti',
      'wrong_order': 'Yanlış sipariş',
      'too_long': 'Çok uzun sürdü',
      'duplicate': 'Yanlışlıkla iki kez sipariş verildi',
      'other': 'Diğer'
    };
    return reasonMap[reason] || reason;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'READY': 'bg-green-100 text-green-800',
      'SERVED': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    return diffInMinutes;
  };

  const getTimeColor = (minutes) => {
    if (minutes < 10) return 'text-green-600';
    if (minutes < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Mutfak ekranı yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={logoImage} alt="Logo" className="h-12 w-12 mr-3 rounded-lg object-cover" />
              <ChefHat className="h-6 w-6 text-orange-500 mr-2" />
              <h1 className="text-2xl font-bold">Mutfak Ekranı</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-white border-white hidden sm:flex">
                {orders.length} Aktif Sipariş
              </Badge>
              
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.name}</span>
              </div>
              
              <div className="text-sm text-gray-300">
                {new Date().toLocaleTimeString('tr-TR')}
              </div>
              
              {/* Logout Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  logout();
                  navigate('/admin/login');
                }}
                className="text-white border-white hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <ChefHat className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">
              Bekleyen sipariş yok
            </h2>
            <p className="text-gray-500">
              Yeni siparişler geldiğinde burada görünecek
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => {
              const elapsedMinutes = getElapsedTime(order.createdAt);
              return (
                <Card key={order.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white text-lg">
                          {order.table.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Kod: {order.table.code}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                        <div className={`text-sm mt-1 flex items-center ${getTimeColor(elapsedMinutes)}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {elapsedMinutes}dk
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Order Items */}
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start p-2 bg-gray-700 rounded">
                          <div className="flex-1">
                            <p className="font-medium text-white">{item.name}</p>
                            {item.notes && (
                              <p className="text-sm text-yellow-400 mt-1">
                                Not: {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-2">
                            <span className="text-lg font-bold text-orange-400">
                              {item.qty}x
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`ml-2 text-xs ${getStatusColor(item.status)}`}
                            >
                              {getStatusText(item.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-3 border-t border-gray-600">
                      {order.status === 'PENDING' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'IN_PROGRESS')}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Hazırlamaya Başla
                        </Button>
                      )}
                      
                      {order.status === 'IN_PROGRESS' && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'READY')}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Hazır
                        </Button>
                      )}

                      <div className="text-xs text-gray-400 text-center">
                        Sipariş #{order.id.slice(-8)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDisplay;

