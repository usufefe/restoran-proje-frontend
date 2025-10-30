import { useState, useEffect, useCallback } from 'react';
import logoImage from '../assets/logo.png';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, CheckCircle, Utensils, AlertCircle, Bell, CreditCard, Check, X, LogOut, User } from 'lucide-react';
import { ordersAPI, waiterCallAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

const WaiterPanel = () => {
  const { restaurantId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('ready');
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);

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
        limit: 50
      });
      setOrders(response.data);
    } catch (error) {
      // Sessiz hata - auth yoksa zaten redirect olacak
    } finally {
      setLoading(false);
    }
  }, [restaurantId, isAuthenticated]);

  const loadCalls = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setCallsLoading(true);
      const response = await waiterCallAPI.getRestaurantCalls(restaurantId, {
        status: 'PENDING,ACKNOWLEDGED'
      });
      setWaiterCalls(response.data);
    } catch (error) {
      // Sessizce başarısız ol, spam yaratma
    } finally {
      setCallsLoading(false);
    }
  }, [restaurantId, isAuthenticated]);

  const handleAcknowledgeCall = async (callId) => {
    try {
      await waiterCallAPI.updateCallStatus(callId, 'ACKNOWLEDGED');
      toast({
        title: "Çağrı Kabul Edildi",
        description: "Müşteriye doğru yönlendiriliyorsunuz.",
      });
      loadCalls();
    } catch (error) {
      console.error('Failed to acknowledge call:', error);
      toast({
        title: "Hata",
        description: "Çağrı kabul edilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteCall = async (callId) => {
    try {
      await waiterCallAPI.updateCallStatus(callId, 'COMPLETED');
      toast({
        title: "Çağrı Tamamlandı",
        description: "Çağrı başarıyla tamamlandı.",
      });
      loadCalls();
    } catch (error) {
      console.error('Failed to complete call:', error);
      toast({
        title: "Hata",
        description: "Çağrı tamamlanırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleCancelCall = async (callId) => {
    try {
      await waiterCallAPI.deleteCall(callId);
      toast({
        title: "Çağrı İptal Edildi",
        description: "Çağrı iptal edildi.",
      });
      loadCalls();
    } catch (error) {
      console.error('Failed to cancel call:', error);
      toast({
        title: "Hata",
        description: "Çağrı iptal edilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // WebSocket için ayrı useEffect - loadOrders'dan sonra çalışsın
  useEffect(() => {
    if (!restaurantId || !socket) return;
    
    // Listen for order updates
    socket.on('order.updated', (orderData) => {
      if (orderData.status === 'READY') {
        toast({
          title: "Sipariş Hazır!",
          description: `Masa ${orderData.tableCode} siparişi servise hazır`,
        });
      }
      loadOrders();
    });

    socket.on('order.created', (orderData) => {
      loadOrders();
    });

    // Listen for order cancellations
    socket.on('order.cancelled', (orderData) => {
      toast({
        title: "Sipariş İptal Edildi",
        description: `Masa ${orderData.tableCode} (${orderData.tableName}) - Müşteri siparişi iptal etti`,
        variant: "destructive",
      });
      loadOrders();
    });

    // Listen for waiter calls
    socket.on('waiter.call.created', (callData) => {
      toast({
        title: callData.type === 'CALL_WAITER' ? "Garson Çağrısı!" : "Hesap İstendi!",
        description: `Masa ${callData.tableCode} (${callData.tableName})`,
      });
      loadCalls();
    });

    socket.on('waiter.call.updated', (callData) => {
      loadCalls();
    });

    socket.on('waiter.call.deleted', (callData) => {
      loadCalls();
    });

    return () => {
      socket.off('order.updated');
      socket.off('order.created');
      socket.off('order.cancelled');
      socket.off('waiter.call.created');
      socket.off('waiter.call.updated');
      socket.off('waiter.call.deleted');
    };
  }, [socket, loadOrders, loadCalls, restaurantId, toast]);

  useEffect(() => {
    if (!restaurantId) return;
    
    // Initialize WebSocket connection with error handling
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
      // Join restaurant room after connection
      newSocket.emit('join-restaurant', { restaurantId });
    });

    newSocket.on('connect_error', (error) => {
      // Sessiz hata - spam yaratma
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
    loadCalls();
    
    // 10 saniyede bir yenile
    const interval = setInterval(() => {
      loadOrders();
      loadCalls();
    }, 10000); // 10 saniye
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, isAuthenticated]); // loadOrders ve loadCalls dependency'den çıkardık

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
      'READY': 'Servise Hazır',
      'SERVED': 'Servis Edildi',
      'CLOSED': 'Kapatıldı'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'READY': 'bg-green-100 text-green-800',
      'SERVED': 'bg-purple-100 text-purple-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getElapsedTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    return diffInMinutes;
  };

  const filterOrdersByStatus = (status) => {
    return orders.filter(order => order.status === status);
  };

  const groupOrdersByTable = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      const tableKey = `${order.table.code}-${order.table.name}`;
      if (!grouped[tableKey]) {
        grouped[tableKey] = {
          table: order.table,
          orders: []
        };
      }
      grouped[tableKey].orders.push(order);
    });
    return Object.values(grouped);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Garson paneli yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src={logoImage} alt="Logo" className="h-12 w-12 mr-3 rounded-lg object-cover" />
              <Users className="h-6 w-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Garson Paneli</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="hidden sm:flex">
                {orders.length} Toplam Sipariş
              </Badge>
              <Badge className="bg-green-100 text-green-800 hidden sm:flex">
                {filterOrdersByStatus('READY').length} Servise Hazır
              </Badge>
              {waiterCalls.length > 0 && (
                <Badge className="bg-orange-500 text-white animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  {waiterCalls.length}
                </Badge>
              )}
              
              {/* User Info */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.name}</span>
              </div>
              
              {/* Logout Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  logout();
                  navigate('/admin/login');
                }}
                className="text-gray-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="calls" className="relative">
              Çağrılar
              {waiterCalls.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs animate-pulse">
                  {waiterCalls.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative">
              Servise Hazır
              {filterOrdersByStatus('READY').length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                  {filterOrdersByStatus('READY').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress">Hazırlanıyor</TabsTrigger>
            <TabsTrigger value="served">Servis Edildi</TabsTrigger>
            <TabsTrigger value="all">Tüm Siparişler</TabsTrigger>
          </TabsList>

          {/* Waiter Calls Tab */}
          <TabsContent value="calls" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Müşteri Çağrıları</h2>
              <Badge className="bg-orange-100 text-orange-800">
                {waiterCalls.length} aktif çağrı
              </Badge>
            </div>

            {waiterCalls.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Bekleyen çağrı yok
                </h3>
                <p className="text-gray-500">
                  Müşteri çağrıları buraya düşecek
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {waiterCalls.map((call) => {
                  const elapsedMinutes = getElapsedTime(call.createdAt);
                  const isUrgent = elapsedMinutes > 5;
                  
                  return (
                    <Card key={call.id} className={`${isUrgent ? 'border-red-300 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {call.type === 'CALL_WAITER' ? (
                                <Bell className="h-5 w-5 mr-2 text-orange-600" />
                              ) : (
                                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                              )}
                              {call.table.name}
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                              {call.table.code} • {elapsedMinutes}dk önce
                            </CardDescription>
                          </div>
                          <Badge className={call.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                            {call.status === 'PENDING' ? 'Bekliyor' : 'Kabul Edildi'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-sm font-medium text-gray-900">
                            {call.type === 'CALL_WAITER' ? '🔔 Garson Çağrısı' : '💳 Hesap Talebi'}
                          </p>
                          {call.note && (
                            <p className="text-sm text-gray-600 mt-1">{call.note}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {call.status === 'PENDING' && (
                            <Button
                              onClick={() => handleAcknowledgeCall(call.id)}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              size="sm"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Kabul Et
                            </Button>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleCompleteCall(call.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Tamamla
                            </Button>
                            
                            <Button
                              onClick={() => handleCancelCall(call.id)}
                              variant="outline"
                              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                              size="sm"
                            >
                              <X className="h-4 w-4 mr-1" />
                              İptal
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Ready Orders */}
          <TabsContent value="ready" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Servise Hazır Siparişler</h2>
              <Badge className="bg-green-100 text-green-800">
                {filterOrdersByStatus('READY').length} sipariş
              </Badge>
            </div>

            {filterOrdersByStatus('READY').length === 0 ? (
              <div className="text-center py-16">
                <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Servise hazır sipariş yok
                </h3>
                <p className="text-gray-500">
                  Hazır olan siparişler burada görünecek
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterOrdersByStatus('READY').map((order) => {
                  const elapsedMinutes = getElapsedTime(order.createdAt);
                  return (
                    <Card key={order.id} className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-green-800">
                              {order.table.name}
                            </CardTitle>
                            <CardDescription>
                              Kod: {order.table.code}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-600 text-white">
                              SERVİSE HAZIR
                            </Badge>
                            <div className="text-sm text-gray-600 mt-1 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {elapsedMinutes}dk önce
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.notes && (
                                  <p className="text-sm text-gray-600">{item.notes}</p>
                                )}
                              </div>
                              <span className="font-bold text-green-600">
                                {item.qty}x
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t">
                          <Button
                            onClick={() => updateOrderStatus(order.id, 'SERVED')}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Servis Edildi
                          </Button>
                        </div>

                        <div className="text-xs text-gray-500 text-center">
                          Toplam: {order.grandTotal.toFixed(2)} TRY
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* In Progress Orders */}
          <TabsContent value="in-progress" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Hazırlanan Siparişler</h2>
              <Badge className="bg-blue-100 text-blue-800">
                {filterOrdersByStatus('IN_PROGRESS').length} sipariş
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterOrdersByStatus('IN_PROGRESS').map((order) => {
                const elapsedMinutes = getElapsedTime(order.createdAt);
                return (
                  <Card key={order.id} className="border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{order.table.name}</CardTitle>
                          <CardDescription>Kod: {order.table.code}</CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-blue-100 text-blue-800">
                            HAZIRLANIYOR
                          </Badge>
                          <div className="text-sm text-gray-600 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {elapsedMinutes}dk
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.notes && (
                                <p className="text-sm text-gray-600">{item.notes}</p>
                              )}
                            </div>
                            <span className="font-bold text-blue-600">
                              {item.qty}x
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-3">
                        Toplam: {order.grandTotal.toFixed(2)} TRY
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Served Orders */}
          <TabsContent value="served" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Servis Edilen Siparişler</h2>
              <Badge className="bg-purple-100 text-purple-800">
                {filterOrdersByStatus('SERVED').length} sipariş
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterOrdersByStatus('SERVED').map((order) => (
                <Card key={order.id} className="border-purple-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.table.name}</CardTitle>
                        <CardDescription>Kod: {order.table.code}</CardDescription>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        SERVİS EDİLDİ
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <p className="text-sm">{item.name}</p>
                          <span className="text-sm font-medium">{item.qty}x</span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{order.items.length - 3} ürün daha
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-3 pt-3 border-t">
                      Toplam: {order.grandTotal.toFixed(2)} TRY
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* All Orders */}
          <TabsContent value="all" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tüm Siparişler</h2>
              <Badge variant="outline">
                {orders.length} sipariş
              </Badge>
            </div>

            <div className="space-y-4">
              {orders.map((order) => {
                const elapsedMinutes = getElapsedTime(order.createdAt);
                return (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-semibold">{order.table.name}</h3>
                            <p className="text-sm text-gray-600">
                              {order.items.length} ürün • {order.grandTotal.toFixed(2)} TRY
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {elapsedMinutes}dk
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WaiterPanel;

