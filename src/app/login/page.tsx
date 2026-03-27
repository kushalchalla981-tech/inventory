'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { PhoneIcon, LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { sendOTP, verifyOTP } = useAuth()
  const router = useRouter()

  const handleSendOTP = async () => {
    if (!phone) return
    setLoading(true)
    setError('')
    try {
      await sendOTP(phone)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!code || !phone) return
    setLoading(true)
    setError('')
    try {
      await verifyOTP(phone, code)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    }
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'phone') handleSendOTP()
      else handleVerifyOTP()
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Inventory System</h1>
              <p className="text-blue-200">Material Transport & Coordination</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Manage Your Inventory<br />With Ease
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-md">
            Streamline your request workflow, track deliveries, and manage inventory across multiple locations all in one place.
          </p>
          <div className="flex gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">3</div>
              <div className="text-blue-200 text-sm">User Roles</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">8</div>
              <div className="text-blue-200 text-sm">Status Stages</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-blue-200 text-sm">Real-time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Inventory System</h1>
              <p className="text-gray-500 text-sm">Material Transport & Coordination</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mt-2">Sign in to continue to your dashboard</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {step === 'phone' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="+1 478 551 7203"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Enter your registered phone number</p>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={loading || !phone}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold disabled:bg-gray-300 hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-mono tracking-[0.5em]"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Enter the OTP sent to your phone</p>
                </div>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || code.length < 6}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold disabled:bg-gray-300 hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </button>
                <button
                  onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                  className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  Change phone number
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            © 2026 Inventory System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
