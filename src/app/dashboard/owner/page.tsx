'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  ArrowRightOnRectangleIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon, 
  UserGroupIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface Request {
  id: number
  status: string
  total_cost: number
  created_at: string
  shopkeeper: { name: string | null; phone_number: string }
}

interface InventoryItem {
  id: number
  name: string
  unit_cost: number
  quantity_available: number
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  'Placed': { color: 'text-blue-700', bg: 'bg-blue-50' },
  'Received': { color: 'text-purple-700', bg: 'bg-purple-50' },
  'Reviewed': { color: 'text-indigo-700', bg: 'bg-indigo-50' },
  'Scheduled': { color: 'text-cyan-700', bg: 'bg-cyan-50' },
  'Delivered': { color: 'text-orange-700', bg: 'bg-orange-50' },
  'Photo Uploaded': { color: 'text-pink-700', bg: 'bg-pink-50' },
  'Verified': { color: 'text-green-700', bg: 'bg-green-50' },
  'Completed': { color: 'text-emerald-700', bg: 'bg-emerald-50' },
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
      supabase.from('requests').select('*, shopkeeper:profiles(name, phone_number)').order('created_at', { ascending: false }).limit(20),
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const STATUS_ORDER = ['Placed', 'Received', 'Reviewed', 'Scheduled', 'Delivered', 'Photo Uploaded', 'Verified', 'Completed']

  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.unit_cost * item.quantity_available), 0)
  const pendingRequests = requests.filter(r => r.status !== 'Completed').length
  const completedRequests = requests.filter(r => r.status === 'Completed').length
  const totalRevenue = requests.reduce((sum, r) => sum + r.total_cost, 0)

  const statusCounts = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = requests.filter(r => r.status === status).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Owner Dashboard</h1>
                  <p className="text-xs text-purple-100">Overview & Analytics</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{profile.name || 'Owner'}</p>
                <p className="text-xs text-purple-100">{profile.phone_number}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="p-2 text-purple-100 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <CurrencyRupeeIcon className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inventory Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">₹{totalInventoryValue.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                <CubeIcon className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Requests</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{pendingRequests}</p>
              </div>
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                <ClockIcon className="h-7 w-7 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{completedRequests}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <CheckCircleIcon className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Requests */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClipboardDocumentListIcon className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.slice(0, 8).map(request => {
                    const config = statusConfig[request.status] || statusConfig['Placed']
                    return (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">#{request.id}</span>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{request.shopkeeper?.name || request.shopkeeper?.phone_number || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{request.total_cost.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Status Overview & Inventory */}
          <div className="space-y-8">
            {/* Status Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Request Status Overview</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {STATUS_ORDER.map(status => {
                    const count = statusCounts[status] || 0
                    const percentage = requests.length > 0 ? (count / requests.length) * 100 : 0
                    const config = statusConfig[status] || statusConfig['Placed']
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`font-medium ${config.color}`}>{status}</span>
                          <span className="text-gray-500">{count} requests</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${config.bg.replace('bg-', 'bg-').split(' ')[0].replace('50', '500')}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Inventory Overview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Inventory Overview</h2>
                  <span className="text-sm text-gray-500">{inventory.length} items</span>
                </div>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded"></div>)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inventory.slice(0, 6).map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.quantity_available} units</p>
                        </div>
                        <p className="font-semibold text-gray-900">₹{item.unit_cost}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
