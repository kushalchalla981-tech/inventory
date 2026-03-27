'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && profile) {
      switch (profile.role) {
        case 'owner':
          router.push('/dashboard/owner')
          break
        case 'transporter':
          router.push('/dashboard/transporter')
          break
        case 'shopkeeper':
          router.push('/dashboard/shopkeeper')
          break
        default:
          router.push('/login')
      }
    } else if (!loading && !user) {
      router.push('/login')
    }
  }, [user, profile, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
