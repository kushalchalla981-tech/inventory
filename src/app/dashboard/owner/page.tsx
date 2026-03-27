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
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

interface Profile {
  id: string
  name: string | null
  email: string | null
  phone_number: string | null
  role: 'owner' | 'transporter' | 'shopkeeper'
  shop_location: string | null
}

interface Request {
  id: number
  status: string
  total_cost: number
  created_at: string
  shopkeeper: { name: string | null; email: string | null }
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
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [userForm, setUserForm] = useState({ role: 'shopkeeper', shopLocation: '' })
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
      supabase.from('requests').select('*, shopkeeper:profiles(name, email)').order('created_at', { ascending: false }).limit(20),
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

  const updateUserRole = async () => {
    if (!editingUser) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: userForm.role, shop_location: userForm.shopLocation })
        .eq('id', editingUser.id)
      
      if (error) throw error
      setShowUserModal(false)
      setEditingUser(null)
      setUserForm({ role: 'shopkeeper', shopLocation: '' })
      fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update user')
    }
  }

  const openEditModal = (user: Profile) => {
    setEditingUser(user)
    setUserForm({ role: user.role, shopLocation: user.shop_location || '' })
    setShowUserModal(true)
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
      fetchData()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete user')
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
                <p className="text-xs text-purple-100">{profile.email}</p>
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
                              <p className="text-sm text-gray-500">{request.shopkeeper?.name || request.shopkeeper?.email || 'Unknown'}</p>
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
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-500 mt-1">Users sign up via Google. Edit their role and location here.</p>
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
                  <p className="text-gray-500">No users have signed up yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Users can sign up via the login page using Google.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
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
                              <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">{user.email || '-'}</span>
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
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
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

      {/* Edit User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button 
                onClick={() => { setShowUserModal(false); setEditingUser(null) }} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900 font-medium">{editingUser.name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{editingUser.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="shopkeeper">Shopkeeper</option>
                  <option value="transporter">Transporter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop/Location</label>
                <input
                  type="text"
                  placeholder="Enter location"
                  value={userForm.shopLocation}
                  onChange={(e) => setUserForm({ ...userForm, shopLocation: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={updateUserRole}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
