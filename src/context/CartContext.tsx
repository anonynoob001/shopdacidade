// Shop Carajás - Multi-Store Shopping Cart Context
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  product_id: string;
  name: string;
  image_url: string;
  price: number;
  promotional_price?: number;
  store_id: string;
  store_name: string;
  delivery_fee_base: number;
  free_delivery_minimum?: number;
  quantity: number;
  selected_variation?: string;
}

export interface StoreCartGroup {
  store_id: string;
  store_name: string;
  delivery_fee_base: number;
  free_delivery_minimum?: number;
  subtotal: number;
  delivery_fee: number;
  items: CartItem[];
}

interface CartContextType {
  items: CartItem[];
  groups: StoreCartGroup[];
  totalItemCount: number;
  totalProductsAmount: number;
  totalDeliveryAmount: number;
  grandTotal: number;
  addItem: (product: any, quantity?: number, variation?: string) => void;
  removeItem: (productId: string, variation?: string) => void;
  updateQuantity: (productId: string, quantity: number, variation?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('shop_carajas_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('shop_carajas_cart', JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  const addItem = (product: any, quantity = 1, variation?: string) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        it => it.product_id === product.id && it.selected_variation === (variation || undefined)
      );

      const effectivePrice = product.promotional_price && product.promotional_price > 0
        ? product.promotional_price
        : product.price;

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }

      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          image_url: product.image_url,
          price: effectivePrice,
          promotional_price: product.promotional_price,
          store_id: product.store_id,
          store_name: product.store_name || 'Loja Parceira',
          delivery_fee_base: Number(product.delivery_fee_base) || 7.00,
          free_delivery_minimum: product.free_delivery_minimum ? Number(product.free_delivery_minimum) : undefined,
          quantity,
          selected_variation: variation
        }
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number, variation?: string) => {
    setItems(prev => {
      if (quantity <= 0) {
        return prev.filter(it => !(it.product_id === productId && it.selected_variation === variation));
      }
      return prev.map(it => {
        if (it.product_id === productId && it.selected_variation === variation) {
          return { ...it, quantity };
        }
        return it;
      });
    });
  };

  const removeItem = (productId: string, variation?: string) => {
    setItems(prev => prev.filter(it => !(it.product_id === productId && it.selected_variation === variation)));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Group items by store and calculate distinct subtotals & delivery fees
  const storeMap = new Map<string, StoreCartGroup>();

  for (const item of items) {
    if (!storeMap.has(item.store_id)) {
      storeMap.set(item.store_id, {
        store_id: item.store_id,
        store_name: item.store_name,
        delivery_fee_base: item.delivery_fee_base,
        free_delivery_minimum: item.free_delivery_minimum,
        subtotal: 0,
        delivery_fee: 0,
        items: []
      });
    }
    const group = storeMap.get(item.store_id)!;
    group.items.push(item);
    group.subtotal += item.price * item.quantity;
  }

  // Calculate delivery fee per store group
  const groups = Array.from(storeMap.values()).map(g => {
    let fee = g.delivery_fee_base;
    if (g.free_delivery_minimum && g.subtotal >= g.free_delivery_minimum) {
      fee = 0;
    }
    return {
      ...g,
      subtotal: Number(g.subtotal.toFixed(2)),
      delivery_fee: Number(fee.toFixed(2))
    };
  });

  const totalItemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const totalProductsAmount = Number(groups.reduce((acc, g) => acc + g.subtotal, 0).toFixed(2));
  const totalDeliveryAmount = Number(groups.reduce((acc, g) => acc + g.delivery_fee, 0).toFixed(2));
  const grandTotal = Number((totalProductsAmount + totalDeliveryAmount).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        items,
        groups,
        totalItemCount,
        totalProductsAmount,
        totalDeliveryAmount,
        grandTotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
