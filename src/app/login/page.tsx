'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { PhoneIcon, LockClosedIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  const { sendOTP, verifyOTP } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleSendOTP = async () => {
    // Only allow digits, max 10
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length !== 10) {
      setError('Please enter 10-digit phone number')
      return
    }
    setLoading(true)
    setError('')
    try {
      await sendOTP(digitsOnly)
      setStep('otp')
      setResendTimer(30)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    }
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!code || code.length < 4) {
      setError('Please enter the OTP')
      return
    }
    setLoading(true)
    setError('')
    try {
      await verifyOTP(phone, code)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.')
    }
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (step === 'phone') handleSendOTP()
      else handleVerifyOTP()
    }
  }

  const quickLogin = (num: string) => {
    setPhone(num)
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
            Streamline your request workflow, track deliveries, and manage inventory across multiple locations.
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Inventory System</h1>
              <p className="text-gray-500 text-sm">Material Transport</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mt-1 text-sm">Sign in to continue</p>
            </div>

            {/* Quick Login Buttons (Demo) */}
            <div className="mb-6 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">Quick Login (Demo):</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => quickLogin('+919113048711')}
                  className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                >
                  Owner
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            {step === 'phone' ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="9113048711"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={handleKeyPress}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">Enter 10-digit number (e.g., 9113048711)</p>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={loading || !phone}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:bg-gray-300 hover:bg-blue-700 transition flex items-center justify-center gap-2"
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
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={handleKeyPress}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-center text-xl font-mono tracking-widest"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">OTP sent to: {phone}</p>
                </div>
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || code.length < 4}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:bg-gray-300 hover:bg-blue-700 transition flex items-center justify-center gap-2"
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
                  className="w-full text-gray-500 text-sm hover:text-gray-700"
                >
                  Change phone number
                </button>
                {resendTimer > 0 ? (
                  <p className="text-center text-sm text-gray-400">
                    Resend OTP in {resendTimer}s
                  </p>
                ) : (
                  <button
                    onClick={handleSendOTP}
                    className="w-full text-blue-600 text-sm hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            © 2026 Inventory System
          </p>
        </div>
      </div>
    </div>
  )
}
