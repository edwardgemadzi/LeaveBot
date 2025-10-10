import React from 'react'
import StatCard from './StatCard'

interface DashboardStatisticsProps {
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
    thisMonth: number
    workingDaysUsed: number
  }
}

export default function DashboardStatistics({ stats }: DashboardStatisticsProps) {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-5 mb-10">
      <StatCard
        title="Total Requests"
        value={stats.total}
        color="#3b82f6"
        icon="📊"
      />
      <StatCard
        title="Pending"
        value={stats.pending}
        color="#f59e0b"
        icon="⏳"
      />
      <StatCard
        title="Approved"
        value={stats.approved}
        color="#10b981"
        icon="✅"
        subtitle={`${stats.workingDaysUsed} working days used`}
      />
      <StatCard
        title="Rejected"
        value={stats.rejected}
        color="#ef4444"
        icon="❌"
      />
      <StatCard
        title="This Month"
        value={stats.thisMonth}
        color="#8b5cf6"
        icon="📅"
      />
    </div>
  )
}
