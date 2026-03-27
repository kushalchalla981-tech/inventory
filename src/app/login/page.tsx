'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Inventory App</h1>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+1 478 551 7203"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSendOTP}
              disabled={loading || !phone}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium disabled:bg-gray-400 hover:bg-blue-700 transition"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl letter-spacing-4"
                maxLength={6}
              />
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={loading || !code}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium disabled:bg-gray-400 hover:bg-blue-700 transition"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              className="w-full text-blue-600 text-sm hover:underline"
            >
              Change phone number
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
