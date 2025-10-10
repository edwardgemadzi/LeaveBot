/**
 * Hook for leave action operations (approve, reject, delete)
 */

import { useState } from 'react'
import { api, ApiError } from '../utils/api'

interface OverrideModal {
  show: boolean
  leaveId: string
  warning: string
  currentCount: number
  limit: number
}

export function useLeaveActions(token: string, onLeaveUpdate?: () => void) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [overrideModal, setOverrideModal] = useState<OverrideModal | null>(null)
  const [overridePassword, setOverridePassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleLeaveAction = async (
    leaveId: string,
    action: 'approve' | 'reject' | 'delete',
    password?: string
  ) => {
    setProcessing(leaveId)
    setError('')
    setPasswordError('')

    try {
      let data: any

      if (action === 'delete') {
        data = await api.leaves.delete(leaveId, token)
      } else {
        // For approve/reject, we need to handle the override password
        const endpoint = `/api/leaves/${leaveId}`
        const body: any = {
          status: action === 'approve' ? 'approved' : 'rejected',
        }
        if (password) {
          body.overridePassword = password
        }

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        })

        data = await res.json()

        // Handle concurrent leave limit warning
        if (res.status === 409 && data.error === 'concurrent_limit_exceeded') {
          setOverrideModal({
            show: true,
            leaveId,
            warning: data.warning,
            currentCount: data.currentCount,
            limit: data.limit,
          })
          setProcessing(null)
          return { success: false, needsOverride: true }
        }

        if (res.status === 401 && password) {
          // Invalid password for override
          setPasswordError('Invalid password. Please try again.')
          setProcessing(null)
          return { success: false, error: 'Invalid password' }
        }

        if (!res.ok) {
          setError(data.error || `Failed to ${action} leave`)
          setProcessing(null)
          return { success: false, error: data.error }
        }
      }

      if (data.success) {
        setOverrideModal(null)
        setOverridePassword('')
        if (onLeaveUpdate) onLeaveUpdate()
        setProcessing(null)
        return { success: true }
      } else {
        setError(data.error || `Failed to ${action} leave`)
        setProcessing(null)
        return { success: false, error: data.error }
      }
    } catch (err) {
      const errorMsg = err instanceof ApiError ? err.message : 'Network error. Please try again.'
      setError(errorMsg)
      setProcessing(null)
      return { success: false, error: errorMsg }
    }
  }

  const handlePasswordOverride = async () => {
    if (!overrideModal || !overridePassword) {
      setPasswordError('Please enter your password')
      return
    }

    await handleLeaveAction(overrideModal.leaveId, 'approve', overridePassword)
  }

  const cancelOverride = () => {
    setOverrideModal(null)
    setOverridePassword('')
    setPasswordError('')
    setProcessing(null)
  }

  return {
    processing,
    error,
    overrideModal,
    overridePassword,
    passwordError,
    setOverridePassword,
    handleLeaveAction,
    handlePasswordOverride,
    cancelOverride,
  }
}
