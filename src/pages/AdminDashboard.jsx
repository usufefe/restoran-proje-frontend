import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { QrCode, Users, ChefHat, Settings, LogOut, Plus, Eye } from 'lucide-react';
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
    setSelectedRestaurant(restaurant);
    try {
      const [tablesResponse, menuResponse] = await Promise.all([
        adminAPI.getTables(restaurant.id),
        adminAPI.getMenu(restaurant.id)
      ]);
      
      setTables(tablesResponse.data);
      setMenu(menuResponse.data);
    } catch (error) {
      console.error('Failed to load restaurant data:', error);
      toast({
        title: "Hata",
        description: "Restoran verileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleViewQR = async (table) => {
    try {
      const response = await sessionAPI.getQRCode(table.id);
      const qrData = response.data;
      
      // Open QR code in new window
      const newWindow = window.open('', '_blank', 'width=400,height=500');
      newWindow.document.write(`
        <html>
          <head>
            <title>QR Kod - ${table.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .qr-container {
                max-width: 300px;
                margin: 0 auto;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              .info {
                margin: 20px 0;
                padding: 15px;
                background: #f5f5f5;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h2>${selectedRestaurant.name}</h2>
              <h3>${table.name} (${table.code})</h3>
              <div class="info">
                <img src="${qrData.qrCodeImage}" alt="QR Kod" />
              </div>
              <p><small>Müşteriler bu QR kodu okuyarak menüye erişebilir</small></p>
              <button onclick="window.print()" style="padding: 10px 20px; background: #f97316; color: white; border: none; border-radius: 4px; cursor: pointer;">Yazdır</button>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-orange-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel Himmet</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hoş geldin, {user?.name}
              </span>
              <Badge variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                {user?.role}
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Restaurant Selector */}
        {restaurants.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restoran Seçin:
            </label>
            <select
              value={selectedRestaurant?.id || ''}
              onChange={(e) => {
                const restaurant = restaurants.find(r => r.id === e.target.value);
                handleRestaurantChange(restaurant);
              }}
              className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
            >
              {restaurants.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedRestaurant && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="tables">Masalar</TabsTrigger>
              <TabsTrigger value="menu">Menü</TabsTrigger>
              {user?.role === 'ADMIN' && (
                <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Toplam Masa
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tables.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Menü Kategorileri
                    </CardTitle>
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{menu.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Toplam Ürün
                    </CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {menu.reduce((total, category) => total + category.items.length, 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Aktif Masalar
                    </CardTitle>
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {tables.filter(table => table.isActive).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Hızlı İşlemler</CardTitle>
                  <CardDescription>
                    Sık kullanılan işlemlere hızlı erişim
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => navigate(`/kitchen/${selectedRestaurant.id}`)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <ChefHat className="h-4 w-4 mr-2" />
                      Mutfak Ekranı
                    </Button>
                    <Button
                      onClick={() => navigate(`/waiter/${selectedRestaurant.id}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Garson Paneli
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/menu/demo/restaurant/table`, '_blank')}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Demo Menü
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tables Tab */}
            <TabsContent value="tables" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Masalar</h2>
                {user?.role === 'ADMIN' && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Masa
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tables.map((table) => (
                  <Card key={table.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{table.name}</CardTitle>
                          <CardDescription>Kod: {table.code}</CardDescription>
                        </div>
                        <Badge variant={table.isActive ? 'default' : 'secondary'}>
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
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          QR Kod
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Menu Tab */}
            <TabsContent value="menu" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Menü Yönetimi</h2>
                {user?.role === 'ADMIN' && (
                  <div className="space-x-2">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Kategori Ekle
                    </Button>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Ürün Ekle
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {menu.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{category.name}</CardTitle>
                          <CardDescription>
                            {category.items.length} ürün
                          </CardDescription>
                        </div>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-600">{item.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-orange-600">
                                {item.price.toFixed(2)} TRY
                              </p>
                              <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-xs">
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

            {/* Users Tab (Admin Only) */}
            {user?.role === 'ADMIN' && (
              <TabsContent value="users" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Kullanıcı Yönetimi</h2>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kullanıcı
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((user) => (
                    <Card key={user.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{user.name}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                          </div>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline">{user.role}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

