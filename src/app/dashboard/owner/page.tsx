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
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  UserPlusIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'

interface Profile {
  id: string
  name: string | null
  phone_number: string
  role: 'owner' | 'transporter' | 'shopkeeper'
  shop_location: string | null
}

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

const STATUS_ORDER = ['Placed', 'Received', 'Reviewed', 'Scheduled', 'Delivered', 'Photo Uploaded', 'Verified', 'Completed']

const statusConfig: Record<string, { color: string; bg: string }> = {
  'Placed': { color: 'text-blue-700', bg: 'bg-blue-50' },
  'Completed': { color: 'text-emerald-700', bg: 'bg-emerald-50' },
}

export default function OwnerDashboard() {
  const { profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', phone: '', role: 'shopkeeper', shopLocation: '' })
  const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview')

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
    const [requestsRes, inventoryRes, usersRes] = await Promise.all([
      supabase.from('requests').select('*, shopkeeper:profiles(name, phone_number)').order('created_at', { ascending: false }).limit(20),
      supabase.from('inventory_items').select('*').order('name'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false })
    ])
    setRequests(requestsRes.data || [])
    setInventory(inventoryRes.data || [])
    setUsers(usersRes.data || [])
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const createUser = async () => {
    if (!newUser.phone || !newUser.role) return
    
    try {
      const { error } = await supabase.functions.invoke('verify-otp', {
        body: { 
          action: 'create-user',
          newPhone: newUser.phone,
          name: newUser.name,
          role: newUser.role,
          shopLocation: newUser.shopLocation
        }
      })
      
      if (error) throw error
      
      setShowUserModal(false)
      setNewUser({ name: '', phone: '', role: 'shopkeeper', shopLocation: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to create user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const { error } = await supabase.functions.invoke('verify-otp', {
        body: { action: 'delete-user', userId }
      })
      
      if (error) throw error
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    }
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

  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.unit_cost * item.quantity_available), 0)
  const pendingRequests = requests.filter(r => r.status !== 'Completed').length
  const completedRequests = requests.filter(r => r.status === 'Completed').length
  const totalRevenue = requests.reduce((sum, r) => sum + r.total_cost, 0)

  const statusCounts = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = requests.filter(r => r.status === status).length
    return acc
  }, {} as Record<string, number>)

  const shopkeepers = users.filter(u => u.role === 'shopkeeper')
  const transporters = users.filter(u => u.role === 'transporter')

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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              User Management
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
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
                                className={`h-2 rounded-full bg-purple-500`}
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
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <button
                onClick={() => setShowUserModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <UserPlusIcon className="h-5 w-5" />
                Add User
              </button>
            </div>
            <div className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                      <p className="text-sm text-gray-500">Total Users</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CubeIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{shopkeepers.length}</p>
                      <p className="text-sm text-gray-500">Shopkeepers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{transporters.length}</p>
                      <p className="text-sm text-gray-500">Transporters</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User List */}
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>)}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">No users yet</p>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="text-purple-600 hover:underline font-medium"
                  >
                    Add First User
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Phone</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <p className="font-medium text-gray-900">{user.name || '-'}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">{user.phone_number}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'transporter' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {user.shop_location || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {user.role !== 'owner' && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button 
                onClick={() => setShowUserModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 9113048711"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="shopkeeper">Shopkeeper</option>
                  <option value="transporter">Transporter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Location</label>
                <input
                  type="text"
                  placeholder="Enter location (optional)"
                  value={newUser.shopLocation}
                  onChange={(e) => setNewUser({ ...newUser, shopLocation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={createUser}
                disabled={!newUser.phone}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:bg-gray-300"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
