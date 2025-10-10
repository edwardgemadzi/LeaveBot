import { useEffect } from 'react'

export function useAutoRefresh(callback: () => void, enabled: boolean, intervalMs = 30000) {
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      callback()
    }, intervalMs)
    return () => clearInterval(id)
  }, [callback, enabled, intervalMs])
}


