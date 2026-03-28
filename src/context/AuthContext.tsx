'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  name: string | null
  email: string | null
  role: 'owner' | 'transporter' | 'shopkeeper' | 'pending'
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
        fetchProfile(session.user.id, session.user.email)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async (userId: string, authUserEmail?: string) => {
    try {
      // Check if profile exists
      const { data: initialData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      let data = initialData

      // If no profile, we need to handle new user signup logic
      if (!data && (error?.code === 'PGRST116' || !error)) {
        console.log('No profile found. Attempting to create one for:', authUserEmail);
        if (authUserEmail === 'kushalchalla981@gmail.com') {
          // Designated owner
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email: authUserEmail, role: 'owner' }])
            .select()
            .single()
          if (insertError) {
            console.error('Failed to create owner profile:', insertError);
            alert(`Setup Error: Failed to create your profile in the database. Please ensure your Supabase RLS policies allow authenticated users to INSERT into the 'profiles' table. Details: ${insertError.message}`);
            throw insertError;
          }
          data = newProfile
        } else if (authUserEmail) {
          // Check if they are in the allowed_users table
          const { data: allowedUser, error: allowedUserError } = await supabase
            .from('allowed_users')
            .select('*')
            .eq('email', authUserEmail)
            .single()

          if (allowedUserError && allowedUserError.code !== 'PGRST116') {
             console.error('Error checking allowed_users:', allowedUserError);
          }

          console.log('Allowed user data:', allowedUser);

          // Insert them into profiles with role from allowed_users or 'pending'
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              email: authUserEmail,
              role: allowedUser ? allowedUser.role : 'pending',
              shop_location: allowedUser ? allowedUser.shop_location : null
            }])
            .select()
            .single()

          if (insertError) {
            console.error('Failed to create user profile:', insertError);
            alert(`Setup Error: Failed to create your profile in the database. Please ensure your Supabase RLS policies allow authenticated users to INSERT into the 'profiles' table. Details: ${insertError.message}`);
            throw insertError;
          }
          data = newProfile
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error fetching initial profile:', error);
        throw error
      }

      if (data) {
        setProfile(data as Profile)
        setUser({ id: userId, email: data.email } as User)

        const fcmToken = await requestFcmToken()
        if (fcmToken && !data.fcm_token) {
          await supabase.from('profiles').update({ fcm_token: fcmToken }).eq('id', userId)
          setProfile({ ...data, fcm_token: fcmToken } as Profile)
        }
      } else {
        console.error('Data is still null after attempted creation.');
      }
    } catch (err) {
      console.error('Error fetching/creating profile (Caught):', err)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    const redirectUrl = process.env.NODE_ENV === 'production'
      ? 'https://inventory-taupe-zeta.vercel.app/dashboard'
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
