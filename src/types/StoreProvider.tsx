import React, { useState } from 'react'
import type { Product } from './product'
import { StoreContext } from './StoreContext'

const initialProducts: Product[] = [
  {
    id: 6,
    name: 'Founding Member Pin',
    slug: 'member-pin',
    price: 'GHS 25.00',
    description: 'Enamel pin with polished gold finish and secure clasp.',
    status: 'Available',
    category: 'Limited Edition',
    rating: 4.9
  },
  {
    id: 4,
    name: 'Executive Movement Notebook',
    slug: 'movement-notebook',
    price: 'GHS 35.00',
    description: 'Hardcover A5 with gold foil branding and 120gsm paper.',
    status: 'Available',
    category: 'Stationery',
    rating: 4.9
  }
]

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>(initialProducts)
  const [cart] = useState<Product[]>([])

  const addToWishlist = (product: Product) => {
    setWishlist(prev => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: number) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some(item => item.id === productId);
  };

  return (
    <StoreContext.Provider value={{ wishlist, cart, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </StoreContext.Provider>
  )
}

