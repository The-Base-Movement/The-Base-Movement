import { createContext } from 'react'
import type { Product } from './product'

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  customText?: string;
}

interface StoreContextType {
  wishlist: Product[];
  cart: CartItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined)
