import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

export function usePushNotifications() {
  const { user } = useAuth()

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupported || !user) {
      setLoading(false)
      return
    }
    supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsSubscribed(!!data)
        setLoading(false)
      })
  }, [user, isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported || !user || !VAPID_PUBLIC_KEY) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      await supabase
        .from('push_subscriptions')
        .upsert({ user_id: user.id, subscription: sub.toJSON() }, { onConflict: 'user_id' })

      setIsSubscribed(true)
    } finally {
      setLoading(false)
    }
  }, [user, isSupported])

  const unsubscribe = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      await sub?.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
      setIsSubscribed(false)
    } finally {
      setLoading(false)
    }
  }, [user])

  return { isSupported, isSubscribed, loading, subscribe, unsubscribe }
}
