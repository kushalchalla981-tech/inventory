'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ComponentType } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  ArrowRightOnRectangleIcon, 
  CubeIcon, 
  PlusIcon, 
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

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

const statusConfig: Record<string, { color: string; bg: string; icon: ComponentType<{ className?: string }> }> = {
  'Placed': { color: 'text-blue-700', bg: 'bg-blue-50', icon: ClipboardDocumentListIcon },
  'Received': { color: 'text-purple-700', bg: 'bg-purple-50', icon: CubeIcon },
  'Reviewed': { color: 'text-indigo-700', bg: 'bg-indigo-50', icon: CheckCircleIcon },
  'Scheduled': { color: 'text-cyan-700', bg: 'bg-cyan-50', icon: ClockIcon },
  'Delivered': { color: 'text-orange-700', bg: 'bg-orange-50', icon: TruckIcon },
  'Photo Uploaded': { color: 'text-pink-700', bg: 'bg-pink-50', icon: CubeIcon },
  'Verified': { color: 'text-green-700', bg: 'bg-green-50', icon: CheckCircleIcon },
  'Completed': { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircleIcon },
}

export default function ShopkeeperDashboard() {
  const { profile, loading: authLoading, signOut } = useAuth()
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

  const loadData = async () => {
    if (!profile || profile.role !== 'shopkeeper') return
    
    setLoading(true)
    const [requestsRes, inventoryRes] = await Promise.all([
      supabase.from('requests').select('*, items:request_items(item_id, quantity, unit_cost, line_total, inventory_items(name))').eq('shopkeeper_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('inventory_items').select('*').order('name')
    ])
    
    const formattedRequests: Request[] = (requestsRes.data || []).map((r) => ({
      ...r,
      items: r.items?.map((item: { inventory_items?: { name: string } }) => ({
        ...item,
        name: item.inventory_items?.name
      })) || []
    }))
    
    setRequests(formattedRequests)
    setInventory(inventoryRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.role])

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

    const { data: requestData, error: requestError } = await supabase.from('requests').insert({
      shopkeeper_id: profile?.id,
      status: 'Placed',
      total_cost: cartTotal
    }).select().single()

    if (requestError) {
      alert('Failed to create request')
      return
    }

    const requestItems = cart.map(c => ({
      request_id: requestData.id,
      item_id: c.item.id,
      quantity: c.quantity,
      unit_cost: c.item.unit_cost,
      line_total: c.item.unit_cost * c.quantity
    }))

    await supabase.from('request_items').insert(requestItems)

    setCart([])
    setShowCreateModal(false)
    loadData()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (authLoading || !profile || profile.role !== 'shopkeeper') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const pendingRequests = requests.filter(r => r.status !== 'Completed').length
  const completedRequests = requests.filter(r => r.status === 'Completed').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CubeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Shopkeeper Portal</h1>
                  <p className="text-xs text-green-100">Material Request System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{profile.name || 'Shopkeeper'}</p>
                <p className="text-xs text-green-100">{profile.email}</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="p-2 text-green-100 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{requests.length}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shadow-inner">
                <ClipboardDocumentListIcon className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{pendingRequests}</p>
              </div>
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center shadow-inner">
                <ClockIcon className="h-7 w-7 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{completedRequests}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shadow-inner">
                <CheckCircleIcon className="h-7 w-7 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="border-b border-gray-100">
            <div className="flex">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'requests' 
                    ? 'text-green-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Requests
                {activeTab === 'requests' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'catalog' 
                    ? 'text-green-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Product Catalog
                {activeTab === 'catalog' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"></div>
                )}
              </button>
              <div className="flex-1"></div>
              <div className="pr-4 py-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Request
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'requests' && (
              <div>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="border border-gray-100 rounded-xl p-5 flex items-start justify-between">
                        <div className="space-y-3 w-1/2">
                          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                        </div>
                        <div className="space-y-2 w-1/4 flex flex-col items-end">
                          <div className="h-4 bg-gray-100 rounded w-full"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">No requests yet</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Create Your First Request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request, index) => {
                      const config = statusConfig[request.status] || statusConfig['Placed']
                      const Icon = config.icon
                      return (
                        <div
                          key={request.id}
                          className="border border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-white group"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Request #{request.id}</h3>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                  {request.status}
                                </span>
                              </div>
                              <p className="text-2xl font-bold text-gray-900">₹{request.total_cost.toLocaleString()}</p>
                              {request.expected_delivery_time && (
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                  <ClockIcon className="w-4 h-4" />
                                  Expected: {new Date(request.expected_delivery_time).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {new Date(request.created_at).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 bg-gray-100 px-2 py-1 rounded-md inline-block">{request.items?.length || 0} items</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'catalog' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
                {inventory.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 bg-white flex flex-col"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3 flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 pr-2">{item.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${item.quantity_available > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {item.quantity_available > 0 ? `${item.quantity_available} left` : 'Out of stock'}
                      </span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 mb-4">₹{item.unit_cost}</p>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={item.quantity_available === 0}
                        className="w-full bg-green-600 text-white py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:bg-gray-200 disabled:text-gray-500 flex items-center justify-center gap-2 active:scale-95 shadow-sm hover:shadow"
                      >
                        <ShoppingCartIcon className="w-5 h-5" />
                        Add to Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div 
          className="fixed bottom-6 right-6 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform z-50"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="relative">
            <ShoppingCartIcon className="h-7 w-7" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {cart.length}
            </span>
          </div>
          <span className="font-bold text-lg">₹{cartTotal.toLocaleString()}</span>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Create New Request</h2>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCartIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <button
                    onClick={() => { setShowCreateModal(false); setActiveTab('catalog'); }}
                    className="text-green-600 hover:underline font-medium hover:text-green-700 transition-colors"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((c, idx) => (
                    <div key={c.item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex-1 pr-4">
                        <p className="font-medium text-gray-900 line-clamp-1">{c.item.name}</p>
                        <p className="text-sm text-gray-500">₹{c.item.unit_cost} × {c.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => updateQuantity(c.item.id, c.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors font-bold text-lg leading-none"
                        >
                          -
                        </button>
                        <span className="w-6 sm:w-8 text-center font-medium">{c.quantity}</span>
                        <button
                          onClick={() => updateQuantity(c.item.id, c.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center transition-colors font-bold text-lg leading-none"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(c.item.id)}
                          className="ml-1 sm:ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="ml-2 sm:ml-4 font-bold text-gray-900 w-20 sm:w-24 text-right">
                        ₹{(c.item.unit_cost * c.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center text-xl font-bold mb-4">
                  <span className="text-gray-900">Total</span>
                  <span className="text-green-600 text-2xl">₹{cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={createRequest}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-lg"
                >
                  Submit Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
