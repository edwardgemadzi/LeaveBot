/**
 * Statistics Cards Component - Displays dashboard statistics
 */

interface StatCardProps {
  title: string
  value: number
  color: string
  icon: string
  subtitle?: string
}

function StatCard({ title, value, color, icon, subtitle }: StatCardProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '6px',
            fontWeight: '400',
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}

interface StatisticsCardsProps {
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
    thisMonth: number
    workingDaysUsed: number
  }
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px',
      }}
    >
      <StatCard title="Total Requests" value={stats.total} color="#3b82f6" icon="📊" />
      <StatCard title="Pending" value={stats.pending} color="#f59e0b" icon="⏳" />
      <StatCard
        title="Approved"
        value={stats.approved}
        color="#10b981"
        icon="✅"
        subtitle={`${stats.workingDaysUsed} working days used`}
      />
      <StatCard title="Rejected" value={stats.rejected} color="#ef4444" icon="❌" />
      <StatCard title="This Month" value={stats.thisMonth} color="#8b5cf6" icon="📅" />
    </div>
  )
}
