import React, { useState, useEffect } from 'react'
import type { Product } from './product'
import { StoreContext } from './StoreContext'
import type { CartItem } from './StoreContext'
import { adminService } from '@/services/adminService'
import { authService } from '@/services/authService'
import { useIsClient } from '@/hooks/useIsClient'

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isClient = useIsClient()
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])

  // Initialize cart from localStorage if available (Client-side only)
  useEffect(() => {
    if (isClient) {
      const handle = requestAnimationFrame(() => {
        try {
          const saved = localStorage.getItem('the_base_cart')
          if (saved) {
            setCart(JSON.parse(saved))
          }
        } catch (e) {
          console.error('Failed to parse cart from local storage', e)
        }
      })
      return () => cancelAnimationFrame(handle)
    }
  }, [isClient])

  // Sync cart to localStorage whenever it changes (Client-side only)
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('the_base_cart', JSON.stringify(cart))
    }
  }, [cart])

  useEffect(() => {
    const fetchInitialWishlist = async () => {
      const user = authService.getUser()
      if (user) {
        const dbWishlist = await adminService.getWishlist(user.id)
        setWishlist(dbWishlist)
      }
    }
    fetchInitialWishlist()
  }, [])

  const addToWishlist = async (product: Product) => {
    setWishlist(prev => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, product];
    });

    const user = authService.getUser()
    if (user) {
      await adminService.addToWishlist(user.id, product.id)
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));

    const user = authService.getUser()
    if (user) {
      await adminService.removeFromWishlist(user.id, productId)
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor)
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + item.quantity } : i)
      }
      return [...prev, item]
    })
  }

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && item.selectedSize === size && item.selectedColor === color)
    ))
  }

  const updateCartQuantity = (productId: string, quantity: number, size?: string, color?: string) => {
    setCart(prev => prev.map(item => 
      (item.id === productId && item.selectedSize === size && item.selectedColor === color)
        ? { ...item, quantity } 
        : item
    ))
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <StoreContext.Provider value={{ 
      wishlist, 
      cart, 
      addToWishlist, 
      removeFromWishlist, 
      isInWishlist,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart
    }}>
      {children}
    </StoreContext.Provider>
  )
}
