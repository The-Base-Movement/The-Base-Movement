import { createContext } from 'react'
import type { Product } from './product'

interface StoreContextType {
  wishlist: Product[];
  cart: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined)
