/**
 * Leave Request Form Component
 */

import { useState, useEffect } from 'react'
import { User } from '../../types'
import { api } from '../../utils/api'

interface LeaveRequestFormProps {
  user: User
  token: string
  teamMembers: any[]
  onSuccess: () => void
  onCancel: () => void
  showToast: (message: string) => void
  showError: (message: string) => void
}

export default function LeaveRequestForm({
  user,
  token,
  teamMembers,
  onSuccess,
  onCancel,
  showToast,
  showError,
}: LeaveRequestFormProps) {
  const [employeeName, setEmployeeName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [leaveType, setLeaveType] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [calculatedDays, setCalculatedDays] = useState<any>(null)
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
      const res = await fetch('/api/leaves?action=calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          userId: user.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setCalculatedDays(data)
      }
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
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ margin: 0, color: '#1f2937' }}>
          📝 Request Leave
        </h2>
        <button
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            background: '#e5e7eb',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {isAdmin && teamMembers.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#374151',
                fontWeight: '500',
              }}
            >
              Employee
            </label>
            <select
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">Select employee (optional - defaults to you)</option>
              {teamMembers.map((member) => (
                <option key={member.id || member._id} value={member.name}>
                  {member.name} (@{member.username})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            Start Date *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            End Date *
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            min={startDate}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            Leave Type
          </label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="">Select type (optional)</option>
            <option value="vacation">🏖️ Vacation</option>
            <option value="sick">🤒 Sick Leave</option>
            <option value="personal">👤 Personal</option>
            <option value="family">👨‍👩‍👧‍👦 Family</option>
            <option value="unpaid">💼 Unpaid</option>
            <option value="other">📝 Other</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              color: '#374151',
              fontWeight: '500',
            }}
          >
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional: Provide a reason for your leave"
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Calculated Days Display */}
        {calculatedDays && (
          <div
            style={{
              padding: '15px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '14px',
                color: '#065f46',
              }}
            >
              📊 Leave Summary
            </h4>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#374151' }}>
              <strong>Working Days:</strong> {calculatedDays.workingDays || 0}
            </p>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#374151' }}>
              <strong>Calendar Days:</strong> {calculatedDays.calendarDays || 0}
            </p>
            {calculatedDays.warning && (
              <p
                style={{
                  margin: '10px 0 0 0',
                  fontSize: '13px',
                  color: '#dc2626',
                  fontWeight: '500',
                }}
              >
                ⚠️ {calculatedDays.warning}
              </p>
            )}
          </div>
        )}

        {calculating && (
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
            Calculating days...
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !startDate || !endDate}
          style={{
            width: '100%',
            padding: '12px',
            background:
              loading || !startDate || !endDate ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor:
              loading || !startDate || !endDate ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '600',
          }}
        >
          {loading ? 'Submitting...' : 'Submit Leave Request'}
        </button>
      </form>
    </div>
  )
}
