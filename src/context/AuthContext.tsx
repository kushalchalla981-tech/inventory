'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  name: string | null
  phone_number: string
  role: 'owner' | 'transporter' | 'shopkeeper'
  shop_location: string | null
  fcm_token: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  sendOTP: (phone: string) => Promise<void>
  verifyOTP: (phone: string, code: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function formatPhoneNumber(phone: string): string {
  // Remove all spaces and special characters
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  
  // Add + if not present
  if (!cleaned.startsWith('+')) {
    // Assume +91 for India if no country code
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = '+' + cleaned
    } else if (cleaned.length === 10) {
      cleaned = '+91' + cleaned
    } else {
      cleaned = '+' + cleaned
    }
  }
  
  return cleaned
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const SUPABASE_URL = 'https://mutvlvsukfhgvkkfljbk.supabase.co'
  const SUPABASE_ANON_KEY = 'sb_publishable_GeEil265QmOcSZNsuLgDKw_6LGHefUs'

  const requestFcmToken = async () => {
    try {
      const { requestFcmToken } = await import('@/lib/firebase')
      return await requestFcmToken()
    } catch {
      return null
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) {
      setProfile(data as Profile)
      setUser({ id: userId, phone: data.phone_number } as User)
      
      const fcmToken = await requestFcmToken()
      if (fcmToken && !data.fcm_token) {
        await supabase.from('profiles').update({ fcm_token: fcmToken }).eq('id', userId)
        setProfile({ ...data, fcm_token: fcmToken } as Profile)
      }
    }
    setLoading(false)
  }

  const sendOTP = async (phone: string) => {
    const formattedPhone = formatPhoneNumber(phone)
    console.log('Sending OTP to:', formattedPhone)
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone: formattedPhone, action: 'send' })
      })
      
      const data = await response.json()
      console.log('OTP Response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }
    } catch (err: any) {
      console.error('OTP Error:', err)
      throw new Error(err.message || 'Failed to send OTP')
    }
  }

  const verifyOTP = async (phone: string, code: string) => {
    const formattedPhone = formatPhoneNumber(phone)
    console.log('Verifying OTP for:', formattedPhone)
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone: formattedPhone, code, action: 'verify' })
      })
      
      const data = await response.json()
      console.log('Verify Response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP')
      }
      
      // If user was created, we need to establish a session
      // For now, we'll just check if verification was successful
      // and redirect - the profile will be fetched on next page load
    } catch (err: any) {
      console.error('Verify Error:', err)
      throw new Error(err.message || 'Failed to verify OTP')
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, sendOTP, verifyOTP, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
