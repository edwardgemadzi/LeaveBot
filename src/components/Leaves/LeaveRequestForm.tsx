/**
 * Leave Request Form Component
 */

import React, { useState, useEffect } from 'react'
import { User, WorkingDaysResult } from '../../types'
import { api } from '../../utils/api'

interface LeaveRequestFormProps {
  user: User
  token: string
  teamMembers: any[]
  onSuccess: () => void
  onCancel: () => void
  showToast: (message: string) => void
  showError: (message: string) => void
  initialStartDate?: Date
  initialEndDate?: Date
}

export default function LeaveRequestForm({
  user,
  token,
  teamMembers,
  onSuccess,
  onCancel,
  showToast,
  showError,
  initialStartDate,
  initialEndDate,
}: LeaveRequestFormProps) {
  const [employeeName, setEmployeeName] = useState('')
  const [startDate, setStartDate] = useState(() => initialStartDate ? initialStartDate.toISOString().slice(0, 10) : '')
  const [endDate, setEndDate] = useState(() => initialEndDate ? initialEndDate.toISOString().slice(0, 10) : '')
  const [leaveType, setLeaveType] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [calculatedDays, setCalculatedDays] = useState<WorkingDaysResult | null>(null)
  const [calculating, setCalculating] = useState(false)

  // Calculate days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (end < start) {
        showError('End date must be after start date')
        return
      }

      calculateDays()
    }
  }, [startDate, endDate, user.id])

  const calculateDays = async () => {
    setCalculating(true)
    try {
      const data = await api.leaves.calculate({
        startDate,
        endDate,
        userId: user.id,
      }, token)
      setCalculatedDays(data as WorkingDaysResult)
    } catch (err) {
      console.error('Failed to calculate days:', err)
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const leaveData = {
        employeeName: employeeName || user.name,
        startDate,
        endDate,
        leaveType,
        reason,
        userId: user.id,
      }

      const data = await api.leaves.create(leaveData, token)

      if (data.success) {
        showToast('Leave request submitted successfully!')
        // Reset form
        setEmployeeName('')
        setStartDate('')
        setEndDate('')
        setLeaveType('')
        setReason('')
        setCalculatedDays(null)
        onSuccess()
      } else {
        showError(data.error || 'Failed to submit leave request')
      }
    } catch (err: any) {
      showError(err.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = user.role === 'admin' || user.role === 'leader'

  return (
    <div className="bg-white rounded-xl p-7 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <h2 className="m-0 text-gray-800">📝 Request Leave</h2>
        <button onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md font-medium">Cancel</button>
      </div>

      <form onSubmit={handleSubmit}>
        {isAdmin && teamMembers.length > 0 && (
          <div className="mb-5">
            <label className="block mb-2 text-slate-700 font-medium">Employee</label>
            <select value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-md text-sm">
              <option value="">Select employee (optional - defaults to you)</option>
              {teamMembers.map((member) => (
                <option key={member.id || member._id} value={member.name}>
                  {member.name} (@{member.username})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-5">
          <label className="block mb-2 text-slate-700 font-medium">Start Date *</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full p-2.5 border border-slate-300 rounded-md text-sm" />
        </div>

        <div className="mb-5">
          <label className="block mb-2 text-slate-700 font-medium">End Date *</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required min={startDate} className="w-full p-2.5 border border-slate-300 rounded-md text-sm" />
        </div>

        <div className="mb-5">
          <label className="block mb-2 text-slate-700 font-medium">Leave Type</label>
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-md text-sm">
            <option value="">Select type (optional)</option>
            <option value="vacation">🏖️ Vacation</option>
            <option value="sick">🤒 Sick Leave</option>
            <option value="personal">👤 Personal</option>
            <option value="family">👨‍👩‍👧‍👦 Family</option>
            <option value="unpaid">💼 Unpaid</option>
            <option value="other">📝 Other</option>
          </select>
        </div>

        <div className="mb-5">
          <label className="block mb-2 text-slate-700 font-medium">Reason</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional: Provide a reason for your leave" rows={3} className="w-full p-2.5 border border-slate-300 rounded-md text-sm resize-y" />
        </div>

        {/* Calculated Days Display */}
        {calculatedDays && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-5">
            <h4 className="m-0 mb-2 text-sm text-emerald-900">📊 Leave Summary</h4>
            <p className="m-0 mb-1 text-sm text-slate-700"><strong>Working Days:</strong> {calculatedDays.count || 0}</p>
            <p className="m-0 mb-1 text-sm text-slate-700"><strong>Calendar Days:</strong> {calculatedDays.calendarDays || 0}</p>
            {calculatedDays.warning && (
              <p className="mt-2 text-[13px] text-red-600 font-medium">⚠️ {calculatedDays.warning}</p>
            )}
          </div>
        )}

        {calculating && (
          <p className="text-sm text-slate-500 mb-5">Calculating days...</p>
        )}

        <button type="submit" disabled={loading || !startDate || !endDate} className={`w-full px-4 py-3 rounded-lg text-white text-base font-semibold ${loading || !startDate || !endDate ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-500'}`}>
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  )
}
