import { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
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
  Mail,
  Activity,
  Zap,
  Target,
  Award,
  Sparkles,
  Layers,
  Globe,
  Shield,
  Wifi,
  Database
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
      
      // Open QR code in new window with premium styling
      const newWindow = window.open('', '_blank', 'width=600,height=800');
      newWindow.document.write(`
        <html>
          <head>
            <title>QR Kod - ${table.name}</title>
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
              .header-section {
                margin-bottom: 40px;
              }
              .restaurant-logo {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #FF6B35, #4ECDC4);
                border-radius: 20px;
                margin: 0 auto 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 32px;
                font-weight: bold;
                box-shadow: 0 15px 30px rgba(255, 107, 53, 0.3);
                animation: pulse 2s infinite;
              }
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              h1 {
                color: #2C3E50;
                font-size: 28px;
                margin: 0 0 15px 0;
                font-weight: 800;
                letter-spacing: -0.5px;
              }
              h2 {
                color: #FF6B35;
                font-size: 20px;
                margin: 0 0 40px 0;
                font-weight: 600;
                background: linear-gradient(135deg, #FF6B35, #4ECDC4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }
              .qr-section {
                margin: 40px 0;
                padding: 30px;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-radius: 25px;
                border: 3px dashed #4ECDC4;
                position: relative;
                overflow: hidden;
              }
              .qr-section::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(78, 205, 196, 0.1), transparent);
                animation: shimmer 3s infinite;
              }
              @keyframes shimmer {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
              }
              img {
                max-width: 100%;
                height: auto;
                border-radius: 20px;
                box-shadow: 0 15px 30px rgba(0,0,0,0.15);
                position: relative;
                z-index: 1;
              }
              .instructions {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 25px;
                border-radius: 20px;
                margin: 30px 0;
                font-size: 16px;
                line-height: 1.8;
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
              }
              .instructions strong {
                display: block;
                font-size: 18px;
                margin-bottom: 10px;
                color: #FFE66D;
              }
              .action-buttons {
                display: flex;
                gap: 15px;
                margin-top: 30px;
              }
              .print-btn {
                flex: 1;
                background: linear-gradient(135deg, #FF6B35, #F39C12);
                color: white;
                border: none;
                padding: 18px 25px;
                border-radius: 15px;
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4);
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .print-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 30px rgba(255, 107, 53, 0.5);
              }
              .share-btn {
                flex: 1;
                background: linear-gradient(135deg, #4ECDC4, #44A08D);
                color: white;
                border: none;
                padding: 18px 25px;
                border-radius: 15px;
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 8px 20px rgba(78, 205, 196, 0.4);
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .share-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 30px rgba(78, 205, 196, 0.5);
              }
              .footer {
                margin-top: 40px;
                padding-top: 25px;
                border-top: 2px solid #E5E7EB;
                color: #6B7280;
                font-size: 14px;
                font-weight: 500;
              }
              .footer .brand {
                background: linear-gradient(135deg, #FF6B35, #4ECDC4);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 700;
              }
              .stats {
                display: flex;
                justify-content: space-around;
                margin: 25px 0;
                padding: 20px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 15px;
                backdrop-filter: blur(10px);
              }
              .stat-item {
                text-align: center;
              }
              .stat-number {
                font-size: 24px;
                font-weight: 800;
                color: #2C3E50;
                display: block;
              }
              .stat-label {
                font-size: 12px;
                color: #6B7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="header-section">
                <div class="restaurant-logo">🍽️</div>
                <h1>${selectedRestaurant.name}</h1>
                <h2>${table.name} • ${table.code}</h2>
              </div>
              
              <div class="stats">
                <div class="stat-item">
                  <span class="stat-number">4.8</span>
                  <div class="stat-label">Rating</div>
                </div>
                <div class="stat-item">
                  <span class="stat-number">127</span>
                  <div class="stat-label">Orders</div>
                </div>
                <div class="stat-item">
                  <span class="stat-number">24/7</span>
                  <div class="stat-label">Service</div>
                </div>
              </div>
              
              <div class="qr-section">
                <img src="${qrData.qrCodeImage}" alt="QR Kod" />
              </div>
              
              <div class="instructions">
                <strong>📱 Dijital Menü Erişimi</strong>
                Müşterileriniz bu QR kodu telefonlarıyla okuyarak<br>
                interaktif dijital menüye anında erişebilir ve<br>
                sipariş verebilirler.
              </div>
              
              <div class="action-buttons">
                <button onclick="window.print()" class="print-btn">
                  🖨️ Yazdır
                </button>
                <button onclick="navigator.share ? navigator.share({title: '${selectedRestaurant.name} - ${table.name}', url: window.location.href}) : alert('Paylaşım desteklenmiyor')" class="share-btn">
                  📤 Paylaş
                </button>
              </div>
              
              <div class="footer">
                <div class="brand">Gastro Admin</div>
                Premium Restoran Yönetim Sistemi
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-gradient-to-r from-teal-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative mb-8">
            {/* Multi-layered Loading Animation */}
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 border-4 border-orange-200 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              <div className="absolute inset-4 border-4 border-purple-300 border-t-transparent rounded-full animate-spin" style={{animationDuration: '2s'}}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-orange-500 animate-bounce" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-teal-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Gastro Admin
            </h3>
            <p className="text-gray-600 mb-4">Premium Restoran Yönetim Sistemi</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Database className="h-4 w-4 animate-pulse" />
              <span>Veriler yükleniyor...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,53,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(78,205,196,0.1),transparent_50%)]"></div>
      </div>

      {/* Premium Header */}
      <header className="bg-white/90 backdrop-blur-xl shadow-2xl border-b border-white/20 sticky top-0 z-50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-teal-500/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <img 
                  src={logoImage} 
                  alt="Logo" 
                  className="relative w-16 h-16 rounded-xl shadow-xl ring-2 ring-white/50" 
                />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-orange-600 via-teal-600 to-purple-600 bg-clip-text text-transparent">
                  Gastro Admin
                </h1>
                <p className="text-sm text-gray-600 font-medium">Premium Restoran Yönetim Sistemi</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              {/* Enhanced Notification Area */}
              <div className="hidden lg:flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative group">
                  <Bell className="h-5 w-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">3</span>
                </Button>
                <Button variant="ghost" size="sm" className="group">
                  <Search className="h-5 w-5 text-gray-600 group-hover:text-teal-500 transition-colors" />
                </Button>
                <Button variant="ghost" size="sm" className="group">
                  <Activity className="h-5 w-5 text-gray-600 group-hover:text-purple-500 transition-colors" />
                </Button>
              </div>
              
              {/* Premium User Section */}
              <div className="flex items-center space-x-4 pl-6 border-l border-gray-200/50">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">Hoş geldin,</p>
                  <p className="text-xs text-gray-500 font-medium">{user?.name}</p>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-teal-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-orange-400 via-teal-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-xl">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                </div>
                <Badge 
                  variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}
                  className="bg-gradient-to-r from-orange-500 via-teal-500 to-purple-500 text-white border-0 px-3 py-1 font-semibold shadow-lg"
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {user?.role}
                </Badge>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="border-2 border-orange-200 text-orange-600 hover:bg-gradient-to-r hover:from-orange-500 hover:to-teal-500 hover:text-white hover:border-transparent transition-all duration-300 shadow-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        {/* Premium Restaurant Selector */}
        {restaurants.length > 1 && (
          <Card className="mb-10 border-0 shadow-2xl bg-gradient-to-r from-white via-orange-50/30 to-teal-50/30 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-teal-500/5"></div>
            <CardContent className="p-8 relative">
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-orange-500" />
                    Aktif Restoran Lokasyonu
                  </label>
                  <select
                    value={selectedRestaurant?.id || ''}
                    onChange={(e) => {
                      const restaurant = restaurants.find(r => r.id === e.target.value);
                      handleRestaurantChange(restaurant);
                    }}
                    className="block w-full max-w-lg px-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-orange-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 text-lg font-medium"
                  >
                    {restaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        🏪 {restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>Çevrimiçi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Aktif</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedRestaurant && (
          <Tabs defaultValue="overview" className="w-full">
            {/* Premium Tab Navigation */}
            <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-2 mb-10 shadow-2xl">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-xl font-semibold transition-all duration-300 py-4"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger 
                value="tables"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-xl font-semibold transition-all duration-300 py-4"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Masa Yönetimi
              </TabsTrigger>
              <TabsTrigger 
                value="menu"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-xl font-semibold transition-all duration-300 py-4"
              >
                <ChefHat className="h-5 w-5 mr-2" />
                Menü Sistemi
              </TabsTrigger>
              {user?.role === 'ADMIN' && (
                <TabsTrigger 
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-xl rounded-xl font-semibold transition-all duration-300 py-4"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Kullanıcı Yönetimi
                </TabsTrigger>
              )}
            </TabsList>

            {/* Premium Overview Tab */}
            <TabsContent value="overview" className="space-y-10">
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white overflow-hidden relative group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold opacity-90 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Bugünkü Siparişler
                    </CardTitle>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Target className="h-6 w-6" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black mb-2">{dashboardStats.todayOrders}</div>
                    <p className="text-sm opacity-80 flex items-center">
                      <Sparkles className="h-3 w-3 mr-1 text-green-300" />
                      <span className="text-green-300 font-semibold">+12%</span>
                      <span className="ml-1">önceki güne göre</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 text-white overflow-hidden relative group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold opacity-90 flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Günlük Gelir
                    </CardTitle>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Award className="h-6 w-6" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black mb-2">₺{dashboardStats.todayRevenue.toLocaleString()}</div>
                    <p className="text-sm opacity-80 flex items-center">
                      <Sparkles className="h-3 w-3 mr-1 text-green-300" />
                      <span className="text-green-300 font-semibold">+8%</span>
                      <span className="ml-1">önceki güne göre</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white overflow-hidden relative group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold opacity-90 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Aktif Masalar
                    </CardTitle>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Layers className="h-6 w-6" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black mb-2">{tables.filter(table => table.isActive).length}</div>
                    <p className="text-sm opacity-80">
                      <span className="font-semibold">{tables.length}</span> toplam masa
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-600 text-white overflow-hidden relative group hover:scale-105 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                    <CardTitle className="text-sm font-semibold opacity-90 flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Müşteri Puanı
                    </CardTitle>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-black mb-2">{dashboardStats.avgRating}</div>
                    <p className="text-sm opacity-80">
                      <span className="font-semibold">5</span> üzerinden ortalama
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Premium Quick Actions */}
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-teal-500/5"></div>
                <CardHeader className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                      <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800">Hızlı İşlem Merkezi</CardTitle>
                      <CardDescription className="text-lg text-gray-600">
                        Sık kullanılan işlemlere premium erişim
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8 relative">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Button
                      onClick={() => navigate(`/kitchen/${selectedRestaurant.id}`)}
                      className="h-24 bg-gradient-to-br from-red-500 via-red-600 to-pink-600 hover:from-red-600 hover:via-red-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex-col space-y-3 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <ChefHat className="h-8 w-8 relative z-10" />
                      <span className="font-bold text-lg relative z-10">Mutfak Ekranı</span>
                    </Button>
                    <Button
                      onClick={() => navigate(`/waiter/${selectedRestaurant.id}`)}
                      className="h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex-col space-y-3 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Users className="h-8 w-8 relative z-10" />
                      <span className="font-bold text-lg relative z-10">Garson Paneli</span>
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
                      className="h-24 border-4 border-orange-200 hover:bg-gradient-to-br hover:from-orange-500 hover:to-orange-600 text-orange-600 hover:text-white hover:border-transparent shadow-2xl hover:shadow-3xl transition-all duration-300 flex-col space-y-3 group"
                    >
                      <QrCode className="h-8 w-8" />
                      <span className="font-bold text-lg">Demo Menü</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-24 border-4 border-teal-200 hover:bg-gradient-to-br hover:from-teal-500 hover:to-teal-600 text-teal-600 hover:text-white hover:border-transparent shadow-2xl hover:shadow-3xl transition-all duration-300 flex-col space-y-3 group"
                    >
                      <BarChart3 className="h-8 w-8" />
                      <span className="font-bold text-lg">Raporlar</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Recent Activity */}
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5"></div>
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                        <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-xl">
                          <Activity className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">Canlı Aktivite Akışı</CardTitle>
                        <CardDescription className="text-lg text-gray-600">
                          Sistemdeki gerçek zamanlı hareketler
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="lg" className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50">
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Yenile
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-6">
                    {[
                      { action: "Yeni sipariş alındı", table: "Masa 5", time: "2 dakika önce", type: "order", icon: "🍽️" },
                      { action: "QR kod oluşturuldu", table: "Masa 12", time: "5 dakika önce", type: "qr", icon: "📱" },
                      { action: "Menü güncellendi", table: "Tatlılar kategorisi", time: "15 dakika önce", type: "menu", icon: "📋" },
                      { action: "Yeni kullanıcı eklendi", table: "Garson - Ahmet K.", time: "1 saat önce", type: "user", icon: "👤" }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-6 p-6 bg-gradient-to-r from-gray-50 via-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                        <div className="text-2xl">{activity.icon}</div>
                        <div className={`w-4 h-4 rounded-full ${
                          activity.type === 'order' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          activity.type === 'qr' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          activity.type === 'menu' ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-purple-400 to-purple-600'
                        } shadow-lg animate-pulse`}></div>
                        <div className="flex-1">
                          <p className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                            {activity.action}
                          </p>
                          <p className="text-sm text-gray-600 font-medium">{activity.table}</p>
                        </div>
                        <span className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                          {activity.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Premium Tables Tab */}
            <TabsContent value="tables" className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-4xl font-black bg-gradient-to-r from-orange-600 to-teal-600 bg-clip-text text-transparent">
                    Masa Yönetim Merkezi
                  </h2>
                  <p className="text-xl text-gray-600 mt-2">QR kodları ve masa durumları</p>
                </div>
                <div className="flex space-x-4">
                  <Button variant="outline" className="border-2 border-orange-200 text-orange-600 hover:bg-orange-50 px-6 py-3">
                    <Filter className="h-5 w-5 mr-2" />
                    Filtrele
                  </Button>
                  {user?.role === 'ADMIN' && (
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-2xl px-6 py-3">
                      <Plus className="h-5 w-5 mr-2" />
                      Yeni Masa Ekle
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {tables.map((table) => (
                  <Card key={table.id} className="border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-white/90 backdrop-blur-xl group hover:scale-105 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <CardHeader className="pb-4 relative">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl ${
                            table.isActive 
                              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-600'
                          }`}>
                            {table.name.split(' ')[1] || table.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-800">{table.name}</CardTitle>
                            <CardDescription className="font-mono text-lg font-semibold text-gray-600">
                              🏷️ {table.code}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={table.isActive ? 'default' : 'secondary'}
                          className={`text-sm px-3 py-1 font-bold ${
                            table.isActive 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {table.isActive ? '🟢 Aktif' : '🔴 Pasif'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="space-y-4">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleViewQR(table)}
                          className="w-full border-2 border-orange-200 text-orange-600 hover:bg-gradient-to-r hover:from-orange-500 hover:to-teal-500 hover:text-white hover:border-transparent group-hover:border-orange-300 transition-all duration-300 py-4"
                        >
                          <Eye className="h-5 w-5 mr-2" />
                          QR Kodu Görüntüle
                        </Button>
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Son güncelleme</span>
                            <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full">2 saat önce</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Premium Menu Tab */}
            <TabsContent value="menu" className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-4xl font-black bg-gradient-to-r from-orange-600 to-teal-600 bg-clip-text text-transparent">
                    Menü Yönetim Sistemi
                  </h2>
                  <p className="text-xl text-gray-600 mt-2">Kategoriler ve ürün yönetimi</p>
                </div>
                <div className="flex space-x-4">
                  <Button variant="outline" className="border-2 border-orange-200 text-orange-600 hover:bg-orange-50 px-6 py-3">
                    <Download className="h-5 w-5 mr-2" />
                    Dışa Aktar
                  </Button>
                  {user?.role === 'ADMIN' && (
                    <div className="flex space-x-3">
                      <Button variant="outline" className="border-2 border-teal-200 text-teal-600 hover:bg-teal-50 px-6 py-3">
                        <Plus className="h-5 w-5 mr-2" />
                        Kategori Ekle
                      </Button>
                      <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-2xl px-6 py-3">
                        <Plus className="h-5 w-5 mr-2" />
                        Ürün Ekle
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {menu.map((category) => (
                  <Card key={category.id} className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-teal-500/5"></div>
                    <CardHeader className="relative">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-6">
                          <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-teal-500 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                              <ChefHat className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-bold text-gray-800">{category.name}</CardTitle>
                            <CardDescription className="text-lg text-gray-600">
                              📋 {category.items?.length || 0} ürün mevcut
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={category.isActive ? 'default' : 'secondary'}
                            className={`text-sm px-4 py-2 font-bold ${
                              category.isActive 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {category.isActive ? '✅ Aktif' : '❌ Pasif'}
                          </Badge>
                          <Button variant="ghost" size="lg" className="text-gray-600 hover:text-orange-600">
                            <Settings className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {category.items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-50 via-white to-orange-50/30 rounded-2xl border-2 border-orange-100 hover:shadow-xl transition-all duration-300 group hover:scale-102">
                            <div className="flex items-center space-x-6">
                              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 via-teal-400 to-purple-400 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                                🍽️
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                                  {item.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-orange-600 mb-3">
                                ₺{item.price.toFixed(2)}
                              </p>
                              <Badge 
                                variant={item.isActive ? 'default' : 'secondary'} 
                                className={`text-sm px-3 py-1 font-bold ${
                                  item.isActive 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {item.isActive ? '✅ Aktif' : '❌ Pasif'}
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

            {/* Premium Users Tab (Admin Only) */}
            {user?.role === 'ADMIN' && (
              <TabsContent value="users" className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-4xl font-black bg-gradient-to-r from-orange-600 to-teal-600 bg-clip-text text-transparent">
                      Kullanıcı Yönetim Merkezi
                    </h2>
                    <p className="text-xl text-gray-600 mt-2">Sistem kullanıcıları ve yetkileri</p>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-2xl px-6 py-3">
                    <Plus className="h-5 w-5 mr-2" />
                    Yeni Kullanıcı Ekle
                  </Button>
                </div>

                <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5"></div>
                  <CardContent className="p-0 relative">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-orange-50 via-teal-50 to-purple-50">
                          <tr>
                            <th className="text-left p-6 font-bold text-gray-800 text-lg">👤 Kullanıcı</th>
                            <th className="text-left p-6 font-bold text-gray-800 text-lg">📧 E-posta</th>
                            <th className="text-left p-6 font-bold text-gray-800 text-lg">🛡️ Rol</th>
                            <th className="text-left p-6 font-bold text-gray-800 text-lg">📊 Durum</th>
                            <th className="text-left p-6 font-bold text-gray-800 text-lg">⏰ Son Giriş</th>
                            <th className="text-left p-6 font-bold text-gray-800 text-lg">⚙️ İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((userData, index) => (
                            <tr key={userData.id} className="border-t-2 border-gray-100 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-teal-50/50 transition-all duration-300">
                              <td className="p-6">
                                <div className="flex items-center space-x-4">
                                  <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-teal-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                                    <div className="relative w-14 h-14 bg-gradient-to-br from-orange-400 via-teal-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xl">
                                      {userData.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-lg font-bold text-gray-900">{userData.name}</p>
                                    <p className="text-sm text-gray-500 font-medium">ID: {userData.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center space-x-3">
                                  <Mail className="h-5 w-5 text-gray-400" />
                                  <span className="text-gray-700 font-medium">{userData.email}</span>
                                </div>
                              </td>
                              <td className="p-6">
                                <Badge 
                                  variant={userData.role === 'ADMIN' ? 'default' : 'secondary'}
                                  className={`text-sm px-4 py-2 font-bold ${
                                    userData.role === 'ADMIN' 
                                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg' 
                                      : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                                  }`}
                                >
                                  {userData.role === 'ADMIN' ? '👑 ADMIN' : '👤 USER'}
                                </Badge>
                              </td>
                              <td className="p-6">
                                <Badge 
                                  variant="default"
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg px-4 py-2 font-bold"
                                >
                                  🟢 Aktif
                                </Badge>
                              </td>
                              <td className="p-6 text-gray-600 font-medium">
                                {index === 0 ? '🔴 Şu anda çevrimiçi' : `⏰ ${Math.floor(Math.random() * 24)} saat önce`}
                              </td>
                              <td className="p-6">
                                <div className="flex space-x-3">
                                  <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50 p-3">
                                    <Settings className="h-5 w-5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 p-3">
                                    <LogOut className="h-5 w-5" />
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

