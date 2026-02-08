import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ProductType = 'SOFT' | 'PRINTED' | 'BOTH';

export interface CartItem {
  productId: string;
  selectedType: ProductType;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, selectedType: ProductType) => void;
  removeFromCart: (productId: string, selectedType: ProductType) => void;
  updateQuantity: (productId: string, selectedType: ProductType, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('shopCart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('shopCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (productId: string, selectedType: ProductType) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId && item.selectedType === selectedType);
      if (existing) {
        return prev.map(item => 
          item.productId === productId && item.selectedType === selectedType
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, selectedType, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string, selectedType: ProductType) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.selectedType === selectedType)));
  };

  const updateQuantity = (productId: string, selectedType: ProductType, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId && item.selectedType === selectedType) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('shopCart');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
