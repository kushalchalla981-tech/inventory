'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRightOnRectangleIcon, CubeIcon, ClipboardDocumentListIcon, TruckIcon, CheckCircleIcon, XCircleIcon, PhotoIcon } from '@heroicons/react/24/outline'

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
    
    // Send notification to shopkeeper
    const request = requests.find(r => r.id === requestId)
    if (request) {
      await supabase.functions.invoke('send-sms', {
        body: { to: request.shopkeeper.phone_number, message: `Your request #${requestId} status updated to: ${newStatus}` }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const pendingCount = requests.filter(r => r.status !== 'Completed').length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-white mr-3" />
              <h1 className="text-xl font-bold text-white">Transporter Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowInventoryModal(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50"
              >
                Manage Inventory
              </button>
              <span className="text-white text-sm">{profile.name || profile.phone_number}</span>
              <button onClick={handleSignOut} className="p-2 text-white hover:bg-blue-700 rounded">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Requests ({pendingCount} pending)</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              All
            </button>
            {STATUS_ORDER.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${statusFilter === status ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
              >
                {status}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>)}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map(request => (
                <div key={request.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">Request #{request.id}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'Placed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {request.shopkeeper.name || request.shopkeeper.phone_number} • {request.shopkeeper.shop_location || 'No location'}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-2">₹{request.total_cost}</p>
                      {request.expected_delivery_time && (
                        <p className="text-sm text-gray-500 mt-1">
                          Expected: {new Date(request.expected_delivery_time).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {NEXT_STATUS[request.status] && (
                        <button
                          onClick={() => updateStatus(request.id, NEXT_STATUS[request.status]!)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          Mark as {NEXT_STATUS[request.status]}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Manage Inventory</h2>
                <button onClick={() => setShowInventoryModal(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {inventory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">₹{item.unit_cost}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateInventory(item.id, item.quantity_available - 1)}
                        className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity_available}</span>
                      <button
                        onClick={() => updateInventory(item.id, item.quantity_available + 1)}
                        className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Request #{selectedRequest.id}</h2>
                  <p className="text-gray-600">{selectedRequest.shopkeeper.name || selectedRequest.shopkeeper.phone_number}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.shopkeeper.shop_location}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedRequest.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  selectedRequest.status === 'Placed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedRequest.status}
                </span>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedRequest.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{item.line_total}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{selectedRequest.total_cost}</span>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-2">Status History</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ORDER.map((status, idx) => {
                    const currentIdx = STATUS_ORDER.indexOf(selectedRequest.status)
                    const isComplete = idx <= currentIdx
                    const isCurrent = status === selectedRequest.status
                    return (
                      <span key={status} className={`px-2 py-1 text-xs rounded ${isComplete ? (isCurrent ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-800') : 'bg-gray-100 text-gray-500'}`}>
                        {status}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
