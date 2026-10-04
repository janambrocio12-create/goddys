'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  variantId: string;
  productSlug: string;
  productName: string;
  size: string;
  color: string;
  sku: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

// Keyed per account, not one fixed key for the whole browser - otherwise
// two different accounts signed into the same browser would see each
// other's cart (account A adds items, logs out, account B logs in and
// still sees A's cart). Browsing with nobody signed in uses GUEST_KEY.
const GUEST_KEY = 'goddys-cart:guest';
function storageKeyFor(userId: string | null) {
  return userId ? `goddys-cart:${userId}` : GUEST_KEY;
}

export function CartProvider({
  children,
  userId = null,
}: {
  children: React.ReactNode;
  userId?: string | null;
}) {
  const storageKey = storageKeyFor(userId);
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Re-runs whenever storageKey changes (sign-in or sign-out), not just on
  // mount - that is what keeps each account's cart separate.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        setItems(JSON.parse(raw));
      } else if (storageKey !== GUEST_KEY) {
        // First time this account has its own cart - if something was
        // added while browsing signed out, carry it over instead of
        // dropping it, then clear the guest bucket so it is not handed
        // to a different account that logs in next on this browser.
        const guestRaw = window.localStorage.getItem(GUEST_KEY);
        if (guestRaw) {
          setItems(JSON.parse(guestRaw));
          window.localStorage.removeItem(GUEST_KEY);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch {
      // Corrupt or inaccessible storage — start with an empty cart.
      setItems([]);
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Persist on every change, once the initial load has happened (so we
  // don't immediately overwrite stored data with the empty initial state).
  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Storage full or unavailable — cart just won't persist this change.
    }
  }, [items, isLoaded, storageKey]);

  function addItem(item: Omit<CartItem, 'quantity'>, quantity: number) {
    setItems((current) => {
      const existing = current.find((i) => i.variantId === item.variantId);
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, existing.maxStock);
        return current.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: nextQuantity } : i,
        );
      }
      return [...current, { ...item, quantity: Math.min(quantity, item.maxStock) }];
    });
  }

  function updateQuantity(variantId: string, quantity: number) {
    setItems((current) =>
      current.map((i) =>
        i.variantId === variantId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
          : i,
      ),
    );
  }

  function removeItem(variantId: string) {
    setItems((current) => current.filter((i) => i.variantId !== variantId));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  );
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQuantity, removeItem, clear, subtotal, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
