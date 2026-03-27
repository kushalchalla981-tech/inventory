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
  TruckIcon, 
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'

interface Request {
  id: number
  shopkeeper_id: string
  status: string
  total_cost: number
  expected_delivery_time: string | null
  created_at: string
  shopkeeper: { name: string | null; phone_number: string; shop_location: string | null }
  items: { id: number; name: string; quantity: number; unit_cost: number; line_total: number }[]
}

interface InventoryItem {
  id: number
  name: string
  unit_cost: number
  quantity_available: number
}

const STATUS_ORDER = ['Placed', 'Received', 'Reviewed', 'Scheduled', 'Delivered', 'Photo Uploaded', 'Verified', 'Completed']
const NEXT_STATUS: Record<string, string> = {
  'Placed': 'Received',
  'Received': 'Reviewed',
  'Reviewed': 'Scheduled',
  'Scheduled': 'Delivered',
  'Delivered': 'Photo Uploaded',
  'Photo Uploaded': 'Verified',
  'Verified': 'Completed'
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  'Placed': { color: 'text-blue-700', bg: 'bg-blue-50', label: 'New' },
  'Received': { color: 'text-purple-700', bg: 'bg-purple-50', label: 'Received' },
  'Reviewed': { color: 'text-indigo-700', bg: 'bg-indigo-50', label: 'Reviewed' },
  'Scheduled': { color: 'text-cyan-700', bg: 'bg-cyan-50', label: 'Scheduled' },
  'Delivered': { color: 'text-orange-700', bg: 'bg-orange-50', label: 'Delivered' },
  'Photo Uploaded': { color: 'text-pink-700', bg: 'bg-pink-50', label: 'Photo Ready' },
  'Verified': { color: 'text-green-700', bg: 'bg-green-50', label: 'Verified' },
  'Completed': { color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Completed' },
}

export default function TransporterDashboard() {
  const { profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showInventoryModal, setShowInventoryModal] = useState(false)

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'transporter')) {
      router.push('/login')
    }
  }, [profile, authLoading, router])

  useEffect(() => {
    if (profile?.role === 'transporter') {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    setLoading(true)
    const [requestsRes, inventoryRes] = await Promise.all([
      supabase.from('requests').select('*, shopkeeper:profiles(name, phone_number, shop_location), items:request_items(item_id, quantity, unit_cost, line_total, inventory_items(name))').order('created_at', { ascending: false }),
      supabase.from('inventory_items').select('*').order('name')
    ])
    
    const formattedRequests = (requestsRes.data || []).map((r: any) => ({
      ...r,
      items: r.items?.map((item: any) => ({
        ...item,
        name: item.inventory_items?.name
      })) || []
    }))
    
    setRequests(formattedRequests)
    setInventory(inventoryRes.data || [])
    setLoading(false)
  }

  const updateStatus = async (requestId: number, newStatus: string) => {
    await supabase.from('requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', requestId)
    
    const request = requests.find(r => r.id === requestId)
    if (request) {
      await supabase.functions.invoke('send-sms', {
        body: { to: request.shopkeeper.phone_number, message: `Request #${requestId} status: ${newStatus}` }
      })
    }
    
    fetchData()
  }

  const updateInventory = async (itemId: number, newQuantity: number) => {
    await supabase.from('inventory_items').update({ 
      quantity_available: newQuantity, 
      updated_by: profile?.id,
      updated_at: new Date().toISOString() 
    }).eq('id', itemId)
    fetchData()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === statusFilter)

  if (authLoading || !profile || profile.role !== 'transporter') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const pendingCount = requests.filter(r => r.status !== 'Completed').length
  const completedCount = requests.filter(r => r.status === 'Completed').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <TruckIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Transporter Portal</h1>
                  <p className="text-xs text-blue-100">Operations Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowInventoryModal(true)}
                className="bg-white/10 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <CubeIcon className="h-5 w-5" />
                Inventory
              </button>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{profile.name || 'Transporter'}</p>
                <p className="text-xs text-blue-100">{profile.phone_number}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="p-2 text-blue-100 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{requests.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <ClipboardDocumentListIcon className="h-7 w-7 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{pendingCount}</p>
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
                <p className="text-3xl font-bold text-green-600 mt-1">{completedCount}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <CheckCircleIcon className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inventory Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{inventory.length}</p>
              </div>
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                <CubeIcon className="h-7 w-7 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">All Requests ({pendingCount} pending)</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    statusFilter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {STATUS_ORDER.slice(0, 5).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      statusFilter === status 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl"></div>)}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map(request => {
                  const config = statusConfig[request.status] || statusConfig['Placed']
                  return (
                    <div key={request.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Request #{request.id}</h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              {request.shopkeeper.name || request.shopkeeper.phone_number}
                            </span>
                            {request.shopkeeper.shop_location && (
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                {request.shopkeeper.shop_location}
                              </span>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-gray-900">₹{request.total_cost.toLocaleString()}</p>
                          {request.expected_delivery_time && (
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {new Date(request.expected_delivery_time).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {NEXT_STATUS[request.status] && (
                            <button
                              onClick={() => updateStatus(request.id, NEXT_STATUS[request.status]!)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                              {NEXT_STATUS[request.status]}
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Details
                          </button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center">
                          {STATUS_ORDER.map((status, idx) => {
                            const currentIdx = STATUS_ORDER.indexOf(request.status)
                            const isComplete = idx <= currentIdx
                            const isCurrent = status === request.status
                            return (
                              <div key={status} className="flex-1 flex items-center">
                                <div className={`w-3 h-3 rounded-full ${
                                  isComplete 
                                    ? (isCurrent ? 'bg-blue-600' : 'bg-green-500') 
                                    : 'bg-gray-200'
                                }`}></div>
                                {idx < STATUS_ORDER.length - 1 && (
                                  <div className={`flex-1 h-0.5 ${
                                    idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'
                                  }`}></div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Manage Inventory</h2>
              <button 
                onClick={() => setShowInventoryModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">₹{item.unit_cost}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateInventory(item.id, item.quantity_available - 1)}
                        className="w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-xl font-bold"
                      >
                        -
                      </button>
                      <span className="w-16 text-center font-bold text-lg">{item.quantity_available}</span>
                      <button
                        onClick={() => updateInventory(item.id, item.quantity_available + 1)}
                        className="w-10 h-10 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center text-xl font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Request #{selectedRequest.id}</h2>
                  <p className="text-gray-500">{selectedRequest.shopkeeper.name || selectedRequest.shopkeeper.phone_number}</p>
                  <p className="text-sm text-gray-400">{selectedRequest.shopkeeper.shop_location}</p>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <div className="mb-6">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  statusConfig[selectedRequest.status]?.bg || 'bg-gray-100'
                } ${statusConfig[selectedRequest.status]?.color || 'text-gray-700'}`}>
                  {selectedRequest.status}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
              <div className="space-y-2 mb-6">
                {selectedRequest.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="font-medium">₹{item.line_total}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">₹{selectedRequest.total_cost}</span>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-3">Status Timeline</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((status, idx) => {
                  const currentIdx = STATUS_ORDER.indexOf(selectedRequest.status)
                  const isComplete = idx <= currentIdx
                  const isCurrent = status === selectedRequest.status
                  return (
                    <span key={status} className={`px-3 py-1.5 text-xs rounded-lg ${
                      isComplete 
                        ? (isCurrent ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700') 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {status}
                    </span>
                  )
                })}
              </div>
            </div>

            {NEXT_STATUS[selectedRequest.status] && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => {
                    updateStatus(selectedRequest.id, NEXT_STATUS[selectedRequest.status]!)
                    setSelectedRequest(null)
                  }}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Mark as {NEXT_STATUS[selectedRequest.status]}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
