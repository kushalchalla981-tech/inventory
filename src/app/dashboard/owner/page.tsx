'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRightOnRectangleIcon, CubeIcon, ClipboardDocumentListIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface Request {
  id: number
  status: string
  total_cost: number
  created_at: string
  shopkeeper: { name: string; phone_number: string }
}

interface InventoryItem {
  id: number
  name: string
  unit_cost: number
  quantity_available: number
}

export default function OwnerDashboard() {
  const { profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'owner')) {
      router.push('/login')
    }
  }, [profile, authLoading, router])

  useEffect(() => {
    if (profile?.role === 'owner') {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    setLoading(true)
    const [requestsRes, inventoryRes] = await Promise.all([
      supabase.from('requests').select('*, shopkeeper:profiles(name, phone_number)').order('created_at', { ascending: false }).limit(10),
      supabase.from('inventory_items').select('*').order('name')
    ])
    setRequests(requestsRes.data || [])
    setInventory(inventoryRes.data || [])
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading || !profile || profile.role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.unit_cost * item.quantity_available), 0)
  const pendingRequests = requests.filter(r => r.status !== 'Completed').length
  const completedRequests = requests.filter(r => r.status === 'Completed').length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Owner Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{profile.name || profile.phone_number}</span>
              <button onClick={handleSignOut} className="p-2 text-gray-500 hover:text-red-600">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CubeIcon className="h-10 w-10 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-10 w-10 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-10 w-10 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedRequests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-10 w-10 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">₹{totalInventoryValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h2>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-200 rounded"></div>)}
              </div>
            ) : requests.length === 0 ? (
              <p className="text-gray-500">No requests yet</p>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Request #{request.id}</p>
                      <p className="text-sm text-gray-500">{request.shopkeeper?.name || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'Placed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">₹{request.total_cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h2>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}
              </div>
            ) : (
              <div className="space-y-3">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-gray-900">{item.name}</span>
                    <span className="text-gray-500">₹{item.unit_cost} × {item.quantity_available}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
