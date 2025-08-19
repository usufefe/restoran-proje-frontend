import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (menuItem, quantity = 1, notes = '') => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.menuItemId === menuItem.id && item.notes === notes
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].qty += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          vatRate: menuItem.vatRate,
          qty: quantity,
          notes: notes,
        }];
      }
    });
  };

  const removeItem = (menuItemId, notes = '') => {
    setItems(prevItems => 
      prevItems.filter(item => 
        !(item.menuItemId === menuItemId && item.notes === notes)
      )
    );
  };

  const updateItemQuantity = (menuItemId, notes = '', newQuantity) => {
    console.log('🔧 updateItemQuantity:', { menuItemId, notes, newQuantity });
    
    if (newQuantity <= 0) {
      removeItem(menuItemId, notes);
      return;
    }

    setItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.menuItemId === menuItemId && item.notes === notes
          ? { ...item, qty: newQuantity, _updated: Date.now() } // Force update trigger
          : item
      );
      console.log('🛒 Updated cart items:', updatedItems);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.qty, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const getVatTotal = () => {
    // KDV artık ayrı hesaplanmıyor - fiyatlar KDV dahil
    return 0;
  };

  const getGrandTotal = () => {
    // Sadece subtotal döndür - fiyatlar zaten KDV dahil
    return getSubtotal();
  };

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  const openCart = () => {
    setIsOpen(true);
  };

  const closeCart = () => {
    setIsOpen(false);
  };

  const value = {
    items,
    isOpen,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    getItemCount,
    getSubtotal,
    getVatTotal,
    getGrandTotal,
    toggleCart,
    openCart,
    closeCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

