'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRightOnRectangleIcon, CubeIcon, PlusIcon, ClipboardDocumentListIcon, PhotoIcon } from '@heroicons/react/24/outline'

interface Request {
  id: number
  status: string
  total_cost: number
  expected_delivery_time: string | null
  created_at: string
  items: { id: number; name: string; quantity: number; unit_cost: number; line_total: number }[]
}

interface InventoryItem {
  id: number
  name: string
  unit_cost: number
  quantity_available: number
}

interface CartItem {
  item: InventoryItem
  quantity: number
}

export default function ShopkeeperDashboard() {
  const { profile, loading: authLoading, signOut, user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState<'requests' | 'catalog'>('requests')

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'shopkeeper')) {
      router.push('/login')
    }
  }, [profile, authLoading, router])

  useEffect(() => {
    if (profile?.role === 'shopkeeper') {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    setLoading(true)
    const [requestsRes, inventoryRes] = await Promise.all([
      supabase.from('requests').select('*, items:request_items(item_id, quantity, unit_cost, line_total, inventory_items(name))').eq('shopkeeper_id', profile?.id).order('created_at', { ascending: false }),
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

  const addToCart = (item: InventoryItem) => {
    const existing = cart.find(c => c.item.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { item, quantity: 1 }])
    }
  }

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter(c => c.item.id !== itemId))
  }

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map(c => c.item.id === itemId ? { ...c, quantity } : c))
    }
  }

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.unit_cost * c.quantity), 0)

  const createRequest = async () => {
    if (cart.length === 0) return

    // Create request
    const { data: requestData, error: requestError } = await supabase.from('requests').insert({
      shopkeeper_id: profile?.id,
      status: 'Placed',
      total_cost: cartTotal
    }).select().single()

    if (requestError) {
      alert('Failed to create request')
      return
    }

    // Create request items
    const requestItems = cart.map(c => ({
      request_id: requestData.id,
      item_id: c.item.id,
      quantity: c.quantity,
      unit_cost: c.item.unit_cost,
      line_total: c.item.unit_cost * c.quantity
    }))

    await supabase.from('request_items').insert(requestItems)

    // Send SMS notification
    await supabase.functions.invoke('send-sms', {
      body: { 
        to: profile?.phone_number, 
        message: `Your request #${requestData.id} has been placed. Total: ₹${cartTotal}` 
      }
    })

    setCart([])
    setShowCreateModal(false)
    fetchData()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading || !profile || profile.role !== 'shopkeeper') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <CubeIcon className="h-8 w-8 text-white mr-3" />
              <h1 className="text-xl font-bold text-white">Shopkeeper Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-green-50 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                New Request
              </button>
              <span className="text-white text-sm">{profile.name || profile.phone_number}</span>
              <button onClick={handleSignOut} className="p-2 text-white hover:bg-green-700 rounded">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'requests' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            My Requests
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'catalog' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Product Catalog
          </button>
        </div>

        {activeTab === 'requests' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Requests</h2>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>)}
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No requests yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700"
                >
                  Create Your First Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map(request => (
                  <div key={request.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">Request #{request.id}</h3>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            request.status === 'Placed' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'Photo Uploaded' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">₹{request.total_cost}</p>
                        {request.expected_delivery_time && (
                          <p className="text-sm text-gray-500 mt-1">
                            Expected: {new Date(request.expected_delivery_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        Items: {request.items?.length || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'catalog' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Catalog</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-gray-500">₹{item.unit_cost}</p>
                  <p className="text-sm text-gray-400">{item.quantity_available} available</p>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.quantity_available === 0}
                    className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300"
                  >
                    Add to Request
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Cart Floating Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 cursor-pointer" onClick={() => setShowCreateModal(true)}>
          <div className="relative">
            <CubeIcon className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cart.length}
            </span>
          </div>
          <span className="font-bold">₹{cartTotal}</span>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create New Request</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <button
                    onClick={() => { setShowCreateModal(false); setActiveTab('catalog'); }}
                    className="text-green-600 hover:underline"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map(c => (
                      <div key={c.item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{c.item.name}</p>
                          <p className="text-sm text-gray-500">₹{c.item.unit_cost} × {c.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(c.item.id, c.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{c.quantity}</span>
                          <button
                            onClick={() => updateQuantity(c.item.id, c.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(c.item.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="ml-4 font-medium">
                          ₹{c.item.unit_cost * c.quantity}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>₹{cartTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={createRequest}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
                  >
                    Submit Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
