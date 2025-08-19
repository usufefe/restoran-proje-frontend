import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, CheckCircle, Utensils, AlertCircle } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import { io } from 'socket.io-client';

const WaiterPanel = () => {
  const { restaurantId } = useParams();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('ready');

  // WebSocket için ayrı useEffect - loadOrders'dan sonra çalışsın
  useEffect(() => {
    if (!restaurantId || !socket) return;
    
    // Listen for order updates
    socket.on('order.updated', (orderData) => {
      console.log('🔄 Waiter: Sipariş güncellendi:', orderData);
      if (orderData.status === 'READY') {
        toast({
          title: "Sipariş Hazır!",
          description: `Masa ${orderData.tableCode} siparişi servise hazır`,
        });
      }
      loadOrders();
    });

    socket.on('order.created', (orderData) => {
      console.log('🆕 Waiter: Yeni sipariş:', orderData);
      loadOrders();
    });

    return () => {
      socket.off('order.updated');
      socket.off('order.created');
    };
  }, [socket, loadOrders, restaurantId, toast]);

  useEffect(() => {
    if (!restaurantId) return;
    
    console.log('🔌 Waiter WebSocket bağlantısı kuruluyor...');
    
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
      console.log('✅ Waiter WebSocket bağlandı:', newSocket.id);
      // Join restaurant room after connection
      newSocket.emit('join-restaurant', { restaurantId });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Waiter WebSocket bağlantı hatası:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Waiter WebSocket bağlantısı kesildi:', reason);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Waiter WebSocket temizleniyor...');
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [restaurantId]); // SADECE restaurantId değiştiğinde yeniden bağlan

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const loadOrders = useCallback(async () => {
    try {
      const response = await ordersAPI.getRestaurantOrders(restaurantId, {
        limit: 50
      });
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
  }, [restaurantId, toast]);

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
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Garson Paneli</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {orders.length} Toplam Sipariş
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                {filterOrdersByStatus('READY').length} Servise Hazır
              </Badge>
              <div className="text-sm text-gray-600">
                {new Date().toLocaleTimeString('tr-TR')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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

