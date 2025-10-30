import { useState, useEffect } from 'react';
import logoImage from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AddTableModal from '../components/AddTableModal';
import AddCategoryModal from '../components/AddCategoryModal';
import AddMenuItemModal from '../components/AddMenuItemModal';
import EditMenuItemModal from '../components/EditMenuItemModal';
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
  TrendingUp,
  Star,
  DollarSign,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Globe,
  Shield,
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, sessionAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddMenuItemModalOpen, setIsAddMenuItemModalOpen] = useState(false);
  const [isEditMenuItemModalOpen, setIsEditMenuItemModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeCustomers: 0,
    avgRating: 0
  });
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [currentQRData, setCurrentQRData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const summaryCards = [
    {
      title: 'Siparişler',
      value: dashboardStats.todayOrders,
      change: '+12%',
      subtitle: 'Bugün alınan siparişler',
      tone: 'blue',
      icon: TrendingUp
    },
    {
      title: 'Gelir',
      value: `₺${dashboardStats.todayRevenue.toLocaleString()}`,
      change: '+8%',
      subtitle: 'Güncel brüt gelir',
      tone: 'emerald',
      icon: DollarSign
    },
    {
      title: 'Aktif Masalar',
      value: tables.filter((table) => table.isActive).length,
      change: `${tables.length} toplam`,
      subtitle: 'Servise açık masa sayısı',
      tone: 'orange',
      icon: Layers
    },
    {
      title: 'Ortalama Puan',
      value: dashboardStats.avgRating,
      change: '5 üzerinden',
      subtitle: 'Müşteri değerlendirmeleri',
      tone: 'indigo',
      icon: Star
    }
  ];

  const activityFeed = [
    { label: 'Yeni sipariş alındı', context: 'Masa 5', time: '2 dakika önce', tone: 'emerald', icon: '🍽️' },
    { label: 'QR kod oluşturuldu', context: 'Masa 12', time: '5 dakika önce', tone: 'blue', icon: '📱' },
    { label: 'Menü güncellendi', context: 'Tatlılar kategorisi', time: '15 dakika önce', tone: 'orange', icon: '📋' },
    { label: 'Yeni kullanıcı eklendi', context: 'Garson - Ahmet K.', time: '1 saat önce', tone: 'indigo', icon: '👤' }
  ];

  const toneStyles = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    slate: 'bg-slate-100 text-slate-600'
  };

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

    setQrLoading(true);
    
    try {
      const response = await sessionAPI.getQRCode(table.id);
      const qrData = response.data;
      
      // Mobil cihazlarda modal kullan, desktop'ta pop-up
      if (isMobile) {
        setCurrentQRData({
          ...qrData,
          table: table,
          restaurant: selectedRestaurant
        });
        setIsQRModalOpen(true);
      } else {
        // Desktop için mevcut pop-up yöntemi
        openQRPopup(qrData, table, selectedRestaurant);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      
      let errorMessage = "QR kod oluşturulurken bir hata oluştu.";
      
      if (error.response?.status === 404) {
        errorMessage = "Masa bulunamadı. Lütfen masa bilgilerini kontrol edin.";
      } else if (error.response?.status === 500) {
        errorMessage = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = "İnternet bağlantınızı kontrol edin ve tekrar deneyin.";
      }
      
      toast({
        title: "QR Kod Hatası",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setQrLoading(false);
    }
  };

  const openQRPopup = (qrData, table, restaurant) => {
    try {
      // Check if popup blocker might interfere
      const newWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes,resizable=yes');
      
      if (!newWindow) {
        // Popup blocked, fallback to modal
        setCurrentQRData({
          ...qrData,
          table: table,
          restaurant: restaurant
        });
        setIsQRModalOpen(true);
        return;
      }
      
      newWindow.document.write(`
        <html>
          <head>
            <title>QR Kod - ${table.name}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: #f3f4f6;
                color: #1f2937;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 32px;
              }
              .qr-container {
                width: 100%;
                max-width: 440px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
                padding: 32px;
              }
              .header {
                text-align: center;
                margin-bottom: 24px;
              }
              .header h1 {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 4px;
              }
              .header p {
                font-size: 14px;
                color: #64748b;
              }
              .badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                border-radius: 999px;
                background: #f1f5f9;
                color: #475569;
                font-size: 12px;
                font-weight: 600;
              }
              .qr-box {
                border: 1px dashed #cbd5f5;
                border-radius: 12px;
                padding: 16px;
                background: #f8fafc;
                margin-bottom: 24px;
              }
              .qr-box img {
                width: 100%;
                border-radius: 8px;
                display: block;
              }
              .info {
                font-size: 13px;
                color: #475569;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
                line-height: 1.6;
              }
              .actions {
                display: flex;
                gap: 12px;
              }
              .actions button {
                flex: 1;
                border: none;
                border-radius: 8px;
                padding: 12px 16px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
              }
              .primary {
                background: #1f2937;
                color: #ffffff;
              }
              .primary:hover {
                background: #111827;
              }
              .secondary {
                background: #ffffff;
                color: #1f2937;
                border: 1px solid #d1d5db;
              }
              .secondary:hover {
                background: #f3f4f6;
              }
              .meta {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #94a3b8;
                margin-top: 16px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="header">
                <span class="badge">${restaurant.name}</span>
                <h1>${table.name}</h1>
                <p>${table.code}</p>
              </div>
              <div class="qr-box">
                <img src="${qrData.qrCodeImage}" alt="QR Kod" />
              </div>
              <div class="info">
                Müşterileriniz bu kodu telefon kameralarıyla tarayarak dijital menünüze ulaşabilir ve sipariş verebilir.
              </div>
              <div class="actions">
                <button class="primary" onclick="window.print()">Yazdır</button>
                <button class="secondary" onclick="navigator.clipboard.writeText('${qrData.qrUrl}'); alert('Bağlantı panoya kopyalandı.');">Bağlantıyı Kopyala</button>
              </div>
              <div class="meta">
                <span>QR ID: ${table.id}</span>
                <span>PardonChef Admin</span>
              </div>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      console.error('Failed to open QR popup:', error);
      // Fallback to modal if popup fails
      setCurrentQRData({
        ...qrData,
        table: table,
        restaurant: restaurant
      });
      setIsQRModalOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTableAdded = (newTable) => {
    setTables(prevTables => [...prevTables, newTable]);
  };

  const handleCategoryAdded = (newCategory) => {
    setMenu(prevMenu => [...prevMenu, { ...newCategory, items: [] }]);
  };

  const handleMenuItemAdded = (newItem) => {
    setMenu(prevMenu => 
      prevMenu.map(category => 
        category.id === newItem.categoryId 
          ? { ...category, items: [...(category.items || []), newItem] }
          : category
      )
    );
  };

  const handleEditMenuItem = (item) => {
    setSelectedMenuItem(item);
    setIsEditMenuItemModalOpen(true);
  };

  const handleMenuItemUpdated = (updatedItem) => {
    setMenu(prevMenu => 
      prevMenu.map(category => ({
        ...category,
        items: category.items?.map(item => 
          item.id === updatedItem.id 
            ? { ...updatedItem, categoryId: item.categoryId }
            : item
        ) || []
      }))
    );
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-300 border-t-transparent animate-spin" aria-hidden="true" />
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <ChefHat className="h-5 w-5" />
              <span className="font-semibold">PardonChef Admin</span>
            </div>
            <p className="text-sm text-slate-500">Veriler yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 items-center justify-between px-3 sm:h-20 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center gap-3">
            <img
              src={logoImage}
              alt="Logo"
              className="h-12 w-12 rounded-xl border border-slate-200 object-cover shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">PardonChef Admin</h1>
              <p className="hidden text-xs text-slate-500 sm:block">Restoran yönetim paneli</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <Badge
              variant={user?.role === 'ADMIN' ? 'default' : 'secondary'}
              className="hidden items-center gap-1 bg-slate-100 text-xs font-medium text-slate-700 sm:flex"
            >
              <Shield className="h-3 w-3" />
              {user?.role}
            </Badge>
            <div className="hidden text-right sm:flex sm:flex-col">
              <span className="text-xs text-slate-500">Hoş geldiniz</span>
              <span className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{user?.name}</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-600">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Premium Restaurant Selector */}
        {restaurants.length > 1 && (
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardContent className="flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Globe className="h-4 w-4" />Aktif restoran
                  </p>
                  <p className="text-base font-semibold text-slate-800">{selectedRestaurant?.name}</p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <select
                  value={selectedRestaurant?.id || ''}
                  onChange={(e) => {
                    const restaurant = restaurants.find((r) => r.id === e.target.value);
                    handleRestaurantChange(restaurant);
                  }}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-0"
                >
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedRestaurant && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex flex-wrap gap-2 border-b border-slate-200 bg-transparent p-0 pb-2">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition data-[state=active]:border-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
              >
                <BarChart3 className="h-4 w-4" />
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger
                value="tables"
                className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition data-[state=active]:border-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
              >
                <QrCode className="h-4 w-4" />
                Masa Yönetimi
              </TabsTrigger>
              <TabsTrigger
                value="menu"
                className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition data-[state=active]:border-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
              >
                <ChefHat className="h-4 w-4" />
                Menü Sistemi
              </TabsTrigger>
              {user?.role === 'ADMIN' && (
                <TabsTrigger
                  value="users"
                  className="flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-slate-600 transition data-[state=active]:border-slate-400 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
                >
                  <Users className="h-4 w-4" />
                  Kullanıcı Yönetimi
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.title} className="border border-slate-200 shadow-sm">
                      <CardHeader className="flex items-start justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">{card.title}</CardTitle>
                        <span className={`rounded-full p-2 ${toneStyles[card.tone] ?? toneStyles.slate}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <p className="text-3xl font-semibold text-slate-900">{card.value}</p>
                        <p className="text-sm font-medium text-slate-600">{card.change}</p>
                        <p className="text-xs text-slate-500">{card.subtitle}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Hızlı işlemler</CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Sık kullanılan ekranlara tek dokunuşla erişin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Button
                      onClick={() => navigate(`/kitchen/${selectedRestaurant.id}`)}
                      className="inline-flex h-auto w-full items-center justify-between gap-4 rounded-lg bg-slate-900 px-4 py-4 text-left text-white hover:bg-slate-800"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Mutfak Ekranı</span>
                        <span className="text-xs text-slate-200/80">Sipariş akışını takip edin</span>
                      </div>
                      <ChefHat className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => navigate(`/waiter/${selectedRestaurant.id}`)}
                      className="inline-flex h-auto w-full items-center justify-between gap-4 rounded-lg bg-slate-700 px-4 py-4 text-left text-white hover:bg-slate-600"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Garson Paneli</span>
                        <span className="text-xs text-slate-200/80">Siparişleri anında iletin</span>
                      </div>
                      <Users className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (selectedRestaurant && tables.length > 0) {
                          window.open(`/menu/${selectedRestaurant.tenantId}/${selectedRestaurant.id}/${tables[0].id}`, '_blank');
                        } else {
                          toast({
                            title: 'Uyarı',
                            description: 'Demo menü için önce masa seçimi yapılmalı.',
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="inline-flex h-auto w-full items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-4 text-left text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Demo Menü</span>
                        <span className="text-xs text-slate-500">Müşteri deneyimini önizleyin</span>
                      </div>
                      <QrCode className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toast({ title: 'Yakında', description: 'Rapor modülü üzerinde çalışıyoruz.' })}
                      className="inline-flex h-auto w-full items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-4 text-left text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">Raporlar</span>
                        <span className="text-xs text-slate-500">Operasyonel performansı inceleyin</span>
                      </div>
                      <BarChart3 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Son hareketler</CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Sistem genelindeki güncel aktiviteler
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={loadData} className="text-slate-600">
                    <RefreshCw className="mr-2 h-4 w-4" />Yenile
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activityFeed.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl" aria-hidden>
                            {item.icon}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.context}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${toneStyles[item.tone] ?? toneStyles.slate}`}></span>
                          <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tables" className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Masa yönetimi</h2>
                  <p className="text-sm text-slate-500">QR kodları ve masa durumlarını yönetin</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    className="justify-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Filter className="h-4 w-4" />
                    Filtrele
                  </Button>
                  {user?.role === 'ADMIN' && (
                    <Button
                      onClick={() => setIsAddTableModalOpen(true)}
                      className="justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                      Yeni Masa Ekle
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {tables.map((table) => (
                  <Card key={table.id} className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-600">
                            {table.code}
                          </div>
                          <div>
                            <CardTitle className="text-base font-semibold text-slate-900">{table.name}</CardTitle>
                            <CardDescription className="text-sm text-slate-500">Masa kapasitesi: {table.capacity ?? '—'}</CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={table.isActive ? 'default' : 'secondary'}
                          className={table.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                        >
                          {table.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQR(table)}
                        disabled={qrLoading}
                        className="w-full justify-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed"
                      >
                        {qrLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <QrCode className="h-4 w-4" />
                        )}
                        {qrLoading ? 'QR kod hazırlanıyor...' : 'QR Kodu Görüntüle'}
                      </Button>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Son güncelleme</span>
                        <span>2 saat önce</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="menu" className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Menü yönetimi</h2>
                  <p className="text-sm text-slate-500">Kategoriler ve ürünleri düzenleyin</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    className="justify-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Dışa aktar
                  </Button>
                  {user?.role === 'ADMIN' && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddCategoryModalOpen(true)}
                        className="justify-center gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Plus className="h-4 w-4" />
                        Kategori ekle
                      </Button>
                      <Button
                        onClick={() => setIsAddMenuItemModalOpen(true)}
                        className="justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800"
                      >
                        <Plus className="h-4 w-4" />
                        Ürün ekle
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {menu.map((category) => (
                  <Card key={category.id} className="border border-slate-200 bg-white shadow-sm">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                          <ChefHat className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-slate-900">{category.name}</CardTitle>
                          <CardDescription className="text-sm text-slate-500">
                            {(category.items?.length ?? 0)} ürün
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={category.isActive ? 'default' : 'secondary'}
                          className={category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                        >
                          {category.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {category.items?.length ? (
                        category.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleEditMenuItem({ ...item, categoryId: category.id })}
                            className="w-full rounded-md border border-slate-100 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                              </div>
                              <div className="flex flex-col items-start gap-1 text-left sm:items-end sm:text-right">
                                <span className="text-sm font-semibold text-slate-900">₺{item.price.toFixed(2)}</span>
                                <Badge
                                  variant={item.isActive ? 'default' : 'secondary'}
                                  className={item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                                >
                                  {item.isActive ? 'Aktif' : 'Pasif'}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                          Bu kategoride ürün bulunmuyor.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {user?.role === 'ADMIN' && (
              <TabsContent value="users" className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Kullanıcı yönetimi</h2>
                    <p className="text-sm text-slate-500">Sistem kullanıcıları ve yetkileri</p>
                  </div>
                  <Button className="justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800">
                    <Plus className="h-4 w-4" />
                    Yeni kullanıcı ekle
                  </Button>
                </div>

                <Card className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Kullanıcı
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Rol
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Durum
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Son giriş
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {users.map((userData, index) => (
                          <tr key={userData.id} className="bg-white hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                                  {userData.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{userData.name}</p>
                                  <p className="text-xs text-slate-500">{userData.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={userData.role === 'ADMIN' ? 'default' : 'secondary'}
                                className={userData.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}
                              >
                                {userData.role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={userData.isActive ? 'default' : 'secondary'}
                                className={userData.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
                              >
                                {userData.isActive ? 'Aktif' : 'Pasif'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              {index === 0 ? 'Şu anda çevrimiçi' : `${Math.floor(Math.random() * 24)} saat önce`}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700">
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600">
                                  <LogOut className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}

        {/* Add Table Modal */}
        <AddTableModal
          isOpen={isAddTableModalOpen}
          onClose={() => setIsAddTableModalOpen(false)}
          restaurantId={selectedRestaurant?.id}
          onTableAdded={handleTableAdded}
        />

        {/* Add Category Modal */}
        <AddCategoryModal
          isOpen={isAddCategoryModalOpen}
          onClose={() => setIsAddCategoryModalOpen(false)}
          restaurantId={selectedRestaurant?.id}
          onCategoryAdded={handleCategoryAdded}
        />

        {/* Add Menu Item Modal */}
        <AddMenuItemModal
          isOpen={isAddMenuItemModalOpen}
          onClose={() => setIsAddMenuItemModalOpen(false)}
          restaurantId={selectedRestaurant?.id}
          categories={menu}
          onMenuItemAdded={handleMenuItemAdded}
        />

        {/* Edit Menu Item Modal */}
        <EditMenuItemModal
          isOpen={isEditMenuItemModalOpen}
          onClose={() => setIsEditMenuItemModalOpen(false)}
          restaurantId={selectedRestaurant?.id}
          categories={menu}
          menuItem={selectedMenuItem}
          onMenuItemUpdated={handleMenuItemUpdated}
        />

        {/* QR Code Modal for Mobile & Desktop */}
        <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 bg-white p-6 shadow-xl">
            <DialogHeader className="space-y-1 text-center">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                QR Kod · {currentQRData?.table?.name}
              </DialogTitle>
              <p className="text-sm text-slate-500">{currentQRData?.restaurant?.name}</p>
            </DialogHeader>
            {currentQRData && (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{currentQRData.table?.code}</span>
                  <p className="text-sm font-medium text-slate-700">{currentQRData.table?.name}</p>
                </div>
                <div className="rounded-md border border-slate-200 p-4">
                  <img
                    src={currentQRData.qrCodeImage}
                    alt="QR Kod"
                    className="mx-auto h-auto w-full max-w-[260px] rounded"
                    style={{ minHeight: '200px', objectFit: 'contain' }}
                  />
                </div>
                <div className="rounded-md bg-slate-50 p-3 text-center text-xs text-slate-600">
                  Müşterileriniz bu kodu okutarak menüye ve sipariş ekranına ulaşabilir.
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => {
                        if (navigator.share) {
                          navigator
                            .share({
                              title: `${currentQRData.restaurant?.name} - ${currentQRData.table?.name}`,
                              text: 'QR Menü',
                              url: currentQRData.qrUrl,
                            })
                            .catch(() => {
                              navigator.clipboard.writeText(currentQRData.qrUrl);
                              toast({
                                title: 'Başarılı',
                                description: 'QR kod bağlantısı kopyalandı.',
                              });
                            });
                        } else {
                          navigator.clipboard.writeText(currentQRData.qrUrl);
                          toast({
                            title: 'Başarılı',
                            description: 'QR kod bağlantısı kopyalandı.',
                          });
                        }
                      }}
                      className="flex-1 justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Paylaş / Kopyala
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (isMobile) {
                          const link = document.createElement('a');
                          link.href = currentQRData.qrCodeImage;
                          link.download = `QR-${currentQRData.table?.name}-${currentQRData.restaurant?.name}.png`;
                          link.click();
                        } else {
                          window.print();
                        }
                      }}
                      className="flex-1 justify-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      {isMobile ? 'İndir' : 'Yazdır'}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsQRModalOpen(false)}
                    className="justify-center border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;

