'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  name: string | null
  email: string | null
  role: 'owner' | 'transporter' | 'shopkeeper'
  shop_location: string | null
  fcm_token: string | null
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

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
      setUser({ id: userId, email: data.email } as User)
      
      const fcmToken = await requestFcmToken()
      if (fcmToken && !data.fcm_token) {
        await supabase.from('profiles').update({ fcm_token: fcmToken }).eq('id', userId)
        setProfile({ ...data, fcm_token: fcmToken } as Profile)
      }
    }
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? 'https://kushalchalla981-techs-projects-inventory.vercel.app/dashboard'
      : `${window.location.origin}/dashboard`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    })
    
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
