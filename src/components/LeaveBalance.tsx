import { useEffect, useState } from 'react'
import { Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { api } from '../utils/api'

interface BalanceData {
  totalDays: number
  usedDays: number
  pendingDays: number
  availableDays: number
}

interface LeaveBalanceProps {
  userId: string
  token: string
  refreshKey?: string | number  // Add optional refresh trigger
}

export function LeaveBalance({ userId, token, refreshKey }: LeaveBalanceProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBalance()
  }, [userId, refreshKey])  // Re-fetch when refreshKey changes

  async function fetchBalance() {
    try {
      setError('')
      const data = await api.balance.get(userId, token)
      if (data.success) {
        setBalance(data.balance)
      } else {
        setError(data.error || 'Failed to load balance')
      }
    } catch (err: any) {
      setError(err.message || 'Network error while loading balance')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="card-body">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card border border-red-200 bg-red-50">
          <div className="card-body">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!balance) return null

  const usagePercentage = (balance.usedDays / balance.totalDays) * 100
  const availablePercentage = (balance.availableDays / balance.totalDays) * 100

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Allocation</span>
            <Calendar className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{balance.totalDays}</p>
          <p className="text-xs text-slate-500 mt-1">working days/year</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Used</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{balance.usedDays}</p>
          <p className="text-xs text-slate-500 mt-1">working days</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{balance.pendingDays}</p>
          <p className="text-xs text-slate-500 mt-1">working days pending</p>
        </div>
      </div>

      <div className="card border-2 border-brand-200 bg-brand-50/50">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-brand-700">Available</span>
            <TrendingUp className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-brand-900">{balance.availableDays}</p>
          <p className="text-xs text-slate-500 mt-1">working days left</p>
          <div className="mt-2 h-1.5 bg-brand-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${availablePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
