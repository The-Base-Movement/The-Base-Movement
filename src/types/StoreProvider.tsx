import React, { useState, useEffect } from 'react'
import type { Product } from './product'
import { StoreContext } from './StoreContext'
import type { CartItem } from './StoreContext'
import { adminService } from '@/services/adminService'
import { authService } from '@/services/authService'

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<Product[]>([])
  // Initialize cart from localStorage if available
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('the_base_cart')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Failed to parse cart from local storage', e)
      return []
    }
  })

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('the_base_cart', JSON.stringify(cart))
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

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity } : item))
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
