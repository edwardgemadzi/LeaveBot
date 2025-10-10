import React from 'react'

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    pending: { background: '#fef3c7', color: '#92400e', text: 'Pending' },
    approved: { background: '#d1fae5', color: '#065f46', text: 'Approved' },
    rejected: { background: '#fee2e2', color: '#991b1b', text: 'Rejected' },
  }

  const style = styles[status]

  return (
    <span className="px-2 py-1 rounded-xl text-xs font-semibold"
          style={{ background: style.background, color: style.color }}>
      {style.text}
    </span>
  )
}