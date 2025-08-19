import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus, X, Receipt } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { menuAPI, sessionAPI, ordersAPI } from '../services/api';
import { useToast } from '@/hooks/use-toast';
import OrderTracking from '../components/OrderTracking';

const MenuPage = () => {
  const { tenantId, restaurantId, tableId } = useParams();
  const { toast } = useToast();
  const {
    items: cartItems,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    getItemCount,
    getGrandTotal,
    isOpen: isCartOpen,
    toggleCart,
    closeCart
  } = useCart();

  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      try {
        // Open session for this table
        const sessionResponse = await sessionAPI.openSession({
          tenantId,
          restaurantId,
          tableId
        });
        setSession(sessionResponse.data);

        // Load menu
        const menuResponse = await menuAPI.getMenu(restaurantId);
        setMenu(menuResponse.data);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        toast({
          title: "Hata",
          description: "Menü yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [tenantId, restaurantId, tableId]);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setItemQuantity(1);
    setItemNotes('');
    setIsItemDialogOpen(true);
  };

  const handleAddToCart = () => {
    if (selectedItem) {
      addItem(selectedItem, itemQuantity, itemNotes);
      setIsItemDialogOpen(false);
      toast({
        title: "Sepete Eklendi",
        description: `${selectedItem.name} sepete eklendi.`,
      });
    }
  };

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Sepet Boş",
        description: "Sipariş vermek için sepete ürün ekleyin.",
        variant: "destructive",
      });
      return;
    }

    setIsOrderSubmitting(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          menuItemId: item.menuItemId,
          qty: item.qty,
          notes: item.notes
        })),
        tenantId,
        restaurantId,
        tableId
      };

      const response = await ordersAPI.createOrder(orderData);
      
      clearCart();
      closeCart();
      
      toast({
        title: "Sipariş Alındı!",
        description: `Sipariş numaranız: ${response.data.orderId.slice(-8)}`,
        variant: "success",
      });

      // Automatically show order tracking after successful order
      setTimeout(() => {
        setShowOrderTracking(true);
      }, 1000);
    } catch (error) {
      console.error('Order submission failed:', error);
      toast({
        title: "Hata",
        description: "Sipariş gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Menü yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Menü bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img src="/pardonbakarmisin%20logo.png" alt="QR Menü" className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{menu.restaurant.name}</h1>
                {session && (
                  <p className="text-sm text-gray-600">
                    {session.table.name} ({session.table.code})
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowOrderTracking(true)}
                className="hidden sm:flex"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Siparişlerim
              </Button>
              <Button
                onClick={toggleCart}
                className="relative bg-orange-600 hover:bg-orange-700"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Sepet
                {getItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                    {getItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Mobile Order Tracking Button */}
        <div className="sm:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowOrderTracking(true)}
            className="w-full"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Siparişlerimi Görüntüle
          </Button>
        </div>

        <Tabs defaultValue={menu.categories[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
            {menu.categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-sm">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {menu.categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid gap-4">
                {category.items.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleItemClick(item)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          {item.description && (
                            <CardDescription className="mt-1">
                              {item.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-orange-600">
                            {item.price.toFixed(2)} {menu.restaurant.currency}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Item Detail Sheet */}
      <Sheet open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <SheetContent>
          {selectedItem && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedItem.name}</SheetTitle>
                <SheetDescription>
                  {selectedItem.description}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Fiyat:</span>
                  <span className="text-lg font-bold text-orange-600">
                    {selectedItem.price.toFixed(2)} {menu.restaurant.currency}
                  </span>
                </div>

                <div>
                  <Label htmlFor="quantity">Adet</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Not (Opsiyonel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Özel isteklerinizi buraya yazabilirsiniz..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-lg font-semibold">Toplam:</span>
                  <span className="text-lg font-bold text-orange-600">
                    {(selectedItem.price * itemQuantity).toFixed(2)} {menu.restaurant.currency}
                  </span>
                </div>

                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Sepete Ekle
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={toggleCart}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sepetim</SheetTitle>
            <SheetDescription>
              Sipariş vermek için ürünlerinizi kontrol edin
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sepetiniz boş</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={`${item.menuItemId}-${item.notes}-${item.qty}-${item._updated || index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        {item.notes && (
                          <p className="text-sm text-gray-600">{item.notes}</p>
                        )}
                        <p className="text-sm text-orange-600 font-medium">
                          {item.price.toFixed(2)} {menu.restaurant.currency} x {item.qty}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.menuItemId, item.notes, item.qty - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(item.menuItemId, item.notes, item.qty + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.menuItemId, item.notes)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Toplam:</span>
                    <span className="text-orange-600">
                      {getGrandTotal().toFixed(2)} {menu.restaurant.currency}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={isOrderSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isOrderSubmitting ? 'Gönderiliyor...' : 'Siparişi Gönder'}
                  </Button>
                  <Button
                    onClick={clearCart}
                    variant="outline"
                    className="w-full"
                  >
                    Sepeti Temizle
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Order Tracking Sheet */}
      <Sheet open={showOrderTracking} onOpenChange={setShowOrderTracking}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <div className="h-full flex flex-col">
            <OrderTracking 
              tableId={tableId}
              tenantId={tenantId}
              restaurantId={restaurantId}
              onClose={() => setShowOrderTracking(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MenuPage;

