import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Users, 
  ChefHat, 
  Settings, 
  LogOut, 
  Plus, 
  Eye,
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  BarChart3,
  Calendar,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, sessionAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeCustomers: 0,
    avgRating: 0
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load restaurants
      const restaurantsResponse = await adminAPI.getRestaurants();
      setRestaurants(restaurantsResponse.data);
      
      if (restaurantsResponse.data.length > 0) {
        const firstRestaurant = restaurantsResponse.data[0];
        setSelectedRestaurant(firstRestaurant);
        
        // Load tables and menu for first restaurant
        const [tablesResponse, menuResponse] = await Promise.all([
          adminAPI.getTables(firstRestaurant.id),
          adminAPI.getMenu(firstRestaurant.id)
        ]);
        
        setTables(tablesResponse.data);
        setMenu(menuResponse.data);
      }

      // Load users (admin only)
      if (user?.role === 'ADMIN') {
        const usersResponse = await adminAPI.getUsers();
        setUsers(usersResponse.data);
      }

      // Mock dashboard stats - replace with real API calls
      setDashboardStats({
        todayOrders: 127,
        todayRevenue: 8450.50,
        activeCustomers: 23,
        avgRating: 4.8
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestaurantChange = async (restaurant) => {
    if (!restaurant) {
      toast({
        title: "Hata",
        description: "Geçersiz restoran seçimi.",
        variant: "destructive",
      });
      return;
    }

    setSelectedRestaurant(restaurant);
    setIsLoading(true);
    
    try {
      const [tablesResponse, menuResponse] = await Promise.all([
        adminAPI.getTables(restaurant.id),
        adminAPI.getMenu(restaurant.id)
      ]);
      
      setTables(tablesResponse.data || []);
      setMenu(menuResponse.data || []);
    } catch (error) {
      console.error('Failed to load restaurant data:', error);
      toast({
        title: "Hata",
        description: "Restoran verileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
      // Reset to previous state on error
      setTables([]);
      setMenu([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewQR = async (table) => {
    if (!selectedRestaurant) {
      toast({
        title: "Hata",
        description: "Önce bir restoran seçiniz.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await sessionAPI.getQRCode(table.id);
      const qrData = response.data;
      
      // Open QR code in new window with enhanced styling
      const newWindow = window.open('', '_blank', 'width=500,height=700');
      newWindow.document.write(`
        <html>
          <head>
            <title>QR Kod - ${table.name}</title>
            <style>
              body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                text-align: center; 
                padding: 40px 20px;
                margin: 0;
                background: linear-gradient(135deg, #FF6B35 0%, #4ECDC4 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .qr-container {
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 350px;
                width: 100%;
              }
              .restaurant-logo {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #FF6B35, #4ECDC4);
                border-radius: 15px;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
              }
              h1 {
                color: #2C3E50;
                font-size: 24px;
                margin: 0 0 10px 0;
                font-weight: 700;
              }
              h2 {
                color: #FF6B35;
                font-size: 18px;
                margin: 0 0 30px 0;
                font-weight: 600;
              }
              img {
                max-width: 100%;
                height: auto;
                border-radius: 15px;
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
              }
              .info {
                margin: 30px 0;
                padding: 20px;
                background: #F8F9FA;
                border-radius: 15px;
                border: 2px dashed #4ECDC4;
              }
              .instructions {
                color: #666;
                font-size: 14px;
                line-height: 1.6;
                margin: 20px 0;
              }
              .print-btn {
                background: linear-gradient(135deg, #FF6B35, #F39C12);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 5px 15px rgba(255, 107, 53, 0.3);
              }
              .print-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
                color: #9CA3AF;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="restaurant-logo">🍽️</div>
              <h1>${selectedRestaurant.name}</h1>
              <h2>${table.name} (${table.code})</h2>
              <div class="info">
                <img src="${qrData.qrCodeImage}" alt="QR Kod" />
              </div>
              <div class="instructions">
                <strong>📱 Nasıl Kullanılır?</strong><br>
                Müşteriler bu QR kodu telefonlarıyla okuyarak<br>
                dijital menüye anında erişebilir
              </div>
              <button onclick="window.print()" class="print-btn">🖨️ Yazdır</button>
              <div class="footer">
                Gastro Admin - Restoran Yönetim Sistemi
              </div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "Hata",
        description: "QR kod oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-teal-400 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Gastro Admin</h3>
          <p className="text-gray-500">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-teal-600 bg-clip-text text-transparent">
                  Gastro Admin
                </h1>
                <p className="text-sm text-gray-500">Restoran Yönetim Sistemi</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Search className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">Hoş geldin,</p>
                  <p className="text-xs text-gray-500">{user?.name}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-teal-400 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <Badge 
                  variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0"
                >
                  {user?.role}
                </Badge>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Restaurant Selector with Enhanced Design */}
        {restaurants.length > 1 && (
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-white to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Aktif Restoran
                  </label>
                  <select
                    value={selectedRestaurant?.id || ''}
                    onChange={(e) => {
                      const restaurant = restaurants.find(r => r.id === e.target.value);
                      handleRestaurantChange(restaurant);
                    }}
                    className="block w-full max-w-md px-4 py-3 bg-white border border-orange-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                  >
                    {restaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedRestaurant && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm border border-orange-100 rounded-xl p-1 mb-8">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger 
                value="tables"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Masalar
              </TabsTrigger>
              <TabsTrigger 
                value="menu"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200"
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Menü
              </TabsTrigger>
              {user?.role === 'ADMIN' && (
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white rounded-lg font-medium transition-all duration-200"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Kullanıcılar
                </TabsTrigger>
              )}
            </TabsList>

            {/* Enhanced Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium opacity-90">
                      Bugünkü Siparişler
                    </CardTitle>
                    <TrendingUp className="h-5 w-5 opacity-80" />
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">{dashboardStats.todayOrders}</div>
                    <p className="text-xs opacity-80 mt-1">
                      <span className="text-green-200">+12%</span> önceki güne göre
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium opacity-90">
                      Günlük Gelir
                    </CardTitle>
                    <DollarSign className="h-5 w-5 opacity-80" />
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">₺{dashboardStats.todayRevenue.toLocaleString()}</div>
                    <p className="text-xs opacity-80 mt-1">
                      <span className="text-green-200">+8%</span> önceki güne göre
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium opacity-90">
                      Aktif Masalar
                    </CardTitle>
                    <Users className="h-5 w-5 opacity-80" />
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">{tables.filter(table => table.isActive).length}</div>
                    <p className="text-xs opacity-80 mt-1">
                      {tables.length} toplam masa
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-medium opacity-90">
                      Müşteri Puanı
                    </CardTitle>
                    <Star className="h-5 w-5 opacity-80" />
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-3xl font-bold">{dashboardStats.avgRating}</div>
                    <p className="text-xs opacity-80 mt-1">
                      5 üzerinden ortalama
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Hızlı İşlemler</CardTitle>
                      <CardDescription>
                        Sık kullanılan işlemlere hızlı erişim
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                      onClick={() => navigate(`/kitchen/${selectedRestaurant.id}`)}
                      className="h-20 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-col space-y-2"
                    >
                      <ChefHat className="h-6 w-6" />
                      <span className="font-medium">Mutfak Ekranı</span>
                    </Button>
                    <Button
                      onClick={() => navigate(`/waiter/${selectedRestaurant.id}`)}
                      className="h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-col space-y-2"
                    >
                      <Users className="h-6 w-6" />
                      <span className="font-medium">Garson Paneli</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (selectedRestaurant && tables.length > 0) {
                          window.open(`/menu/${selectedRestaurant.tenantId}/${selectedRestaurant.id}/${tables[0].id}`, '_blank');
                        } else {
                          toast({
                            title: "Uyarı",
                            description: "Demo menü için önce masa seçimi yapılmalı.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="h-20 border-2 border-orange-200 hover:bg-orange-50 text-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 flex-col space-y-2"
                    >
                      <QrCode className="h-6 w-6" />
                      <span className="font-medium">Demo Menü</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 border-2 border-teal-200 hover:bg-teal-50 text-teal-600 shadow-lg hover:shadow-xl transition-all duration-200 flex-col space-y-2"
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span className="font-medium">Raporlar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Son Aktiviteler</CardTitle>
                        <CardDescription>
                          Sistemdeki son hareketler
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Yenile
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "Yeni sipariş alındı", table: "Masa 5", time: "2 dakika önce", type: "order" },
                      { action: "QR kod oluşturuldu", table: "Masa 12", time: "5 dakika önce", type: "qr" },
                      { action: "Menü güncellendi", table: "Tatlılar kategorisi", time: "15 dakika önce", type: "menu" },
                      { action: "Yeni kullanıcı eklendi", table: "Garson - Ahmet K.", time: "1 saat önce", type: "user" }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'order' ? 'bg-green-500' :
                          activity.type === 'qr' ? 'bg-blue-500' :
                          activity.type === 'menu' ? 'bg-orange-500' : 'bg-purple-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.table}</p>
                        </div>
                        <span className="text-xs text-gray-400">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Tables Tab */}
            <TabsContent value="tables" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Masa Yönetimi</h2>
                  <p className="text-gray-600 mt-1">QR kodları ve masa durumları</p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrele
                  </Button>
                  {user?.role === 'ADMIN' && (
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Masa
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map((table) => (
                  <Card key={table.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
                            table.isActive 
                              ? 'bg-gradient-to-br from-green-500 to-green-600' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            {table.name.split(' ')[1] || table.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{table.name}</CardTitle>
                            <CardDescription className="font-mono text-sm">
                              Kod: {table.code}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={table.isActive ? 'default' : 'secondary'}
                          className={`${
                            table.isActive 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          } border`}
                        >
                          {table.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQR(table)}
                          className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 group-hover:border-orange-300 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          QR Kodu Görüntüle
                        </Button>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Son güncelleme</span>
                          <span>2 saat önce</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Enhanced Menu Tab */}
            <TabsContent value="menu" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Menü Yönetimi</h2>
                  <p className="text-gray-600 mt-1">Kategoriler ve ürün yönetimi</p>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                    <Download className="h-4 w-4 mr-2" />
                    Dışa Aktar
                  </Button>
                  {user?.role === 'ADMIN' && (
                    <div className="flex space-x-2">
                      <Button variant="outline" className="border-teal-200 text-teal-600 hover:bg-teal-50">
                        <Plus className="h-4 w-4 mr-2" />
                        Kategori Ekle
                      </Button>
                      <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Ürün Ekle
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {menu.map((category) => (
                  <Card key={category.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl flex items-center justify-center">
                            <ChefHat className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{category.name}</CardTitle>
                            <CardDescription className="text-base">
                              {category.items?.length || 0} ürün
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={category.isActive ? 'default' : 'secondary'}
                            className={`${
                              category.isActive 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            } border`}
                          >
                            {category.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {category.items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-200 group">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-teal-400 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                🍽️
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-xl text-orange-600 mb-2">
                                ₺{item.price.toFixed(2)}
                              </p>
                              <Badge 
                                variant={item.isActive ? 'default' : 'secondary'} 
                                className={`text-xs ${
                                  item.isActive 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                } border`}
                              >
                                {item.isActive ? 'Aktif' : 'Pasif'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Enhanced Users Tab (Admin Only) */}
            {user?.role === 'ADMIN' && (
              <TabsContent value="users" className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">Kullanıcı Yönetimi</h2>
                    <p className="text-gray-600 mt-1">Sistem kullanıcıları ve yetkileri</p>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kullanıcı
                  </Button>
                </div>

                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-orange-50 to-teal-50">
                          <tr>
                            <th className="text-left p-4 font-semibold text-gray-700">Kullanıcı</th>
                            <th className="text-left p-4 font-semibold text-gray-700">E-posta</th>
                            <th className="text-left p-4 font-semibold text-gray-700">Rol</th>
                            <th className="text-left p-4 font-semibold text-gray-700">Durum</th>
                            <th className="text-left p-4 font-semibold text-gray-700">Son Giriş</th>
                            <th className="text-left p-4 font-semibold text-gray-700">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((userData, index) => (
                            <tr key={userData.id} className="border-t border-gray-100 hover:bg-orange-50/50 transition-colors duration-200">
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-teal-400 rounded-full flex items-center justify-center text-white font-semibold">
                                    {userData.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{userData.name}</p>
                                    <p className="text-sm text-gray-500">ID: {userData.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span className="text-gray-700">{userData.email}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge 
                                  variant={userData.role === 'ADMIN' ? 'default' : 'secondary'}
                                  className={`${
                                    userData.role === 'ADMIN' 
                                      ? 'bg-purple-100 text-purple-800 border-purple-200' 
                                      : 'bg-blue-100 text-blue-800 border-blue-200'
                                  } border`}
                                >
                                  {userData.role}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge 
                                  variant="default"
                                  className="bg-green-100 text-green-800 border-green-200 border"
                                >
                                  Aktif
                                </Badge>
                              </td>
                              <td className="p-4 text-gray-600">
                                {index === 0 ? 'Şu anda çevrimiçi' : `${Math.floor(Math.random() * 24)} saat önce`}
                              </td>
                              <td className="p-4">
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50">
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                                    <LogOut className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

