import { Link } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Users, ChefHat, UserCheck } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={logoImage} alt="QR Menü Sistemi" className="h-10 w-10 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">QR Menü Sistemi</h1>
            </div>
            <Link to="/admin/login">
              <Button variant="outline">
                Giriş Yap
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Modern Restoran Yönetim Sistemi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            QR kod ile temassız menü, gerçek zamanlı sipariş takibi, mutfak ekranı ve 
            kapsamlı yönetim paneli ile restoranınızı dijitalleştirin.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <QrCode className="h-12 w-12 text-orange-600 mb-4" />
              <CardTitle>QR Menü</CardTitle>
              <CardDescription>
                Müşteriler QR kodu okuyarak menüyü görüntüleyebilir ve sipariş verebilir
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <ChefHat className="h-12 w-12 text-red-600 mb-4" />
              <CardTitle>Mutfak Ekranı (KDS)</CardTitle>
              <CardDescription>
                Şefler gelen siparişleri gerçek zamanlı olarak görebilir ve durumlarını güncelleyebilir
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Garson Paneli</CardTitle>
              <CardDescription>
                Garsonlar masa durumlarını takip edebilir ve siparişleri yönetebilir
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <UserCheck className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Admin Paneli</CardTitle>
              <CardDescription>
                Menü yönetimi, masa düzenleme, kullanıcı yönetimi ve raporlar
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <CardTitle>Mobil Uyumlu</CardTitle>
              <CardDescription>
                Tüm cihazlarda mükemmel çalışan responsive tasarım
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <CardTitle>Gerçek Zamanlı</CardTitle>
              <CardDescription>
                WebSocket ile anlık sipariş güncellemeleri ve bildirimler
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Demo Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Demo Hesapları
          </h3>
          <p className="text-gray-600 mb-6">
            Sistemi test etmek için aşağıdaki demo hesaplarını kullanabilirsiniz:
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin</CardTitle>
                <CardDescription>
                  <strong>Email:</strong> admin@demo.com<br />
                  <strong>Şifre:</strong> admin123
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Şef</CardTitle>
                <CardDescription>
                  <strong>Email:</strong> chef@demo.com<br />
                  <strong>Şifre:</strong> chef123
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Garson</CardTitle>
                <CardDescription>
                  <strong>Email:</strong> waiter@demo.com<br />
                  <strong>Şifre:</strong> waiter123
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-8">
            <Link to="/admin/login">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                Demo'yu Deneyin
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 QR Menü Sistemi. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

