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

      // Detailed error logging for SELECT failure
      if (error) {
        console.error('Supabase SELECT Error Details:', JSON.stringify(error, null, 2));
      }

      // We handle PGRST116 (No rows found) or if data is just null without an error code
      if (!data && (error?.code === 'PGRST116' || !error || error?.message?.includes('JSON object requested, multiple (or no) rows returned'))) {
        console.log('No profile found in DB. Attempting to insert a new profile for:', authUserEmail);

        if (authUserEmail === 'kushalchalla981@gmail.com') {
          // Designated owner logic
          console.log('Recognized Owner email. Inserting with role: owner');
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email: authUserEmail, role: 'owner' }])
            .select()
            .single()

          if (insertError) {
            console.error('Database INSERT Error Details (Owner):', JSON.stringify(insertError, null, 2));
            alert(`Failed to create owner profile: ${insertError.message}. Check your Supabase database constraints and RLS policies.`);
            throw insertError;
          }
          data = newProfile
          console.log('Successfully created Owner profile:', newProfile);

        } else if (authUserEmail) {
          // Standard user logic
          const { data: allowedUser, error: allowedUserError } = await supabase
            .from('allowed_users')
            .select('*')
            .eq('email', authUserEmail)
            .single()

          if (allowedUserError && allowedUserError.code !== 'PGRST116') {
             console.error('Error checking allowed_users:', allowedUserError);
          }

          const assignedRole = allowedUser ? allowedUser.role : 'pending';
          console.log(`User found in allowed_users: ${!!allowedUser}. Assigning role: ${assignedRole}`);

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              email: authUserEmail,
              role: assignedRole,
              shop_location: allowedUser ? allowedUser.shop_location : null
            }])
            .select()
            .single()

          if (insertError) {
            console.error('Database INSERT Error Details (Standard User):', JSON.stringify(insertError, null, 2));
            alert(`Failed to create user profile: ${insertError.message}. Check your Supabase constraints and RLS policies.`);
            throw insertError;
          }
          data = newProfile
          console.log('Successfully created User profile:', newProfile);
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error('Unexpected SELECT error:', error);
        alert(`Database error fetching your profile: ${error.message}`);
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
        console.error('Profile data is still null. Insertion might have failed silently.');
      }
    } catch (err: unknown) {
      console.error('Critical Error fetching/creating profile:', err)
      if (err instanceof Error && err.message) {
        alert(`A critical error occurred while logging you in: ${err.message}`);
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
         alert(`A critical error occurred while logging you in: ${(err as {message: string}).message}`);
      }
    } finally {
      setLoading(false)
    }
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
