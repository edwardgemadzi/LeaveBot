import { useMemo } from 'react'
import { LeaveBalance } from './LeaveBalance'

interface Leave {
  _id: string
  employeeName: string
  userId: string
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  workingDaysCount?: number
  calendarDaysCount?: number
  shiftPattern?: string
  shiftTime?: string
}

interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'user'
}

interface DashboardProps {
  user: User
  leaves: Leave[]
  token?: string
}

export default function Dashboard({ user, leaves, token }: DashboardProps) {
  // Helper to calculate working days (falls back to calendar days if not available)
  const calculateDaysForLeave = (leave: Leave) => {
    if (leave.workingDaysCount) return leave.workingDaysCount
    // Fallback: calculate calendar days
    const start = new Date(leave.startDate)
    const end = new Date(leave.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const stats = useMemo(() => {
    if (user.role === 'admin') {
      // Admin sees all leaves statistics
      const approvedLeaves = leaves.filter(l => l.status === 'approved')
      const workingDaysUsed = approvedLeaves.reduce((sum, leave) => sum + calculateDaysForLeave(leave), 0)
      
      return {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: approvedLeaves.length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        thisMonth: leaves.filter(l => {
          const date = new Date(l.createdAt)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).length,
        workingDaysUsed,
      }
    } else {
      // User sees only their leaves
      const myLeaves = leaves.filter(l => l.userId === user.id)
      const approvedLeaves = myLeaves.filter(l => l.status === 'approved')
      const workingDaysUsed = approvedLeaves.reduce((sum, leave) => sum + calculateDaysForLeave(leave), 0)
      
      return {
        total: myLeaves.length,
        pending: myLeaves.filter(l => l.status === 'pending').length,
        approved: approvedLeaves.length,
        rejected: myLeaves.filter(l => l.status === 'rejected').length,
        thisMonth: myLeaves.filter(l => {
          const date = new Date(l.createdAt)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).length,
        workingDaysUsed,
      }
    }
  }, [leaves, user])

  const upcomingLeaves = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let filteredLeaves = leaves
    if (user.role !== 'admin') {
      filteredLeaves = leaves.filter(l => l.userId === user.id)
    }
    
    return filteredLeaves
      .filter(l => {
        const startDate = new Date(l.startDate)
        return startDate >= today && l.status === 'approved'
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5)
  }, [leaves, user])

  const recentActivity = useMemo(() => {
    let filteredLeaves = leaves
    if (user.role !== 'admin') {
      filteredLeaves = leaves.filter(l => l.userId === user.id)
    }
    
    return [...filteredLeaves]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [leaves, user])

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', color: '#333' }}>
        {user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
      </h2>

      {/* Leave Balance - Only show for regular users */}
      {user.role !== 'admin' && token && (
        <LeaveBalance userId={user.id} token={token} />
      )}

      {/* Statistics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
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

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '30px'
      }}>
        {/* Upcoming Leaves */}
        <div>
          <h3 style={{ marginBottom: '15px', color: '#374151' }}>
            🗓️ Upcoming Approved Leaves
          </h3>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {upcomingLeaves.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                No upcoming approved leaves
              </p>
            ) : (
              <div>
                {upcomingLeaves.map(leave => (
                  <div
                    key={leave._id}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e5e7eb',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <strong style={{ color: '#1f2937' }}>{leave.employeeName}</strong>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: 'bold'
                      }}>
                        {new Date(leave.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      margin: '4px 0 0 0'
                    }}>
                      {leave.reason.length > 50 ? leave.reason.substring(0, 50) + '...' : leave.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 style={{ marginBottom: '15px', color: '#374151' }}>
            📋 Recent Activity
          </h3>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            {recentActivity.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>
                No recent activity
              </p>
            ) : (
              <div>
                {recentActivity.map(leave => (
                  <div
                    key={leave._id}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e5e7eb',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <strong style={{ color: '#1f2937' }}>{leave.employeeName}</strong>
                      <StatusBadge status={leave.status} />
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      margin: '4px 0'
                    }}>
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      margin: '4px 0 0 0'
                    }}>
                      {leave.reason.length > 40 ? leave.reason.substring(0, 40) + '...' : leave.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon, subtitle }: { 
  title: string; 
  value: number; 
  color: string; 
  icon: string;
  subtitle?: string;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
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
        <div style={{ 
          fontSize: '12px', 
          color: '#9ca3af', 
          marginTop: '6px',
          fontWeight: '400' 
        }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  const styles = {
    pending: { background: '#fef3c7', color: '#92400e', text: 'Pending' },
    approved: { background: '#d1fae5', color: '#065f46', text: 'Approved' },
    rejected: { background: '#fee2e2', color: '#991b1b', text: 'Rejected' },
  }

  const style = styles[status]

  return (
    <span style={{
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      background: style.background,
      color: style.color
    }}>
      {style.text}
    </span>
  )
}
