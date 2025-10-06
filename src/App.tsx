import { useState, useEffect, useMemo } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import InteractiveCalendar from './components/InteractiveCalendar'
import UserManagement from './components/UserManagement'
import TeamManagement from './components/TeamManagement'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'
import { EmptyState } from './components/EmptyState'
import { LeaveCardSkeleton } from './components/LoadingSkeleton'
import { SearchFilter } from './components/SearchFilter'

type View = 'dashboard' | 'calendar' | 'list' | 'form' | 'team' | 'teams'

function App() {
  const { toasts, success, error: showError, info, closeToast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string>('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [leaves, setLeaves] = useState<any[]>([])
  const [employeeName, setEmployeeName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [availableTeams, setAvailableTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [searchFilter, setSearchFilter] = useState({ search: '', status: '' })

  // Filter leaves based on search and status
  const filteredLeaves = useMemo(() => {
    return leaves.filter(leave => {
      const matchesSearch = !searchFilter.search || 
        leave.employeeName.toLowerCase().includes(searchFilter.search.toLowerCase()) ||
        (leave.reason && leave.reason.toLowerCase().includes(searchFilter.search.toLowerCase()))
      
      const matchesStatus = !searchFilter.status || leave.status === searchFilter.status
      
      return matchesSearch && matchesStatus
    })
  }, [leaves, searchFilter])

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      loadLeaves(savedToken)
    }
  }, [])

  // Load teams when registration mode is active
  useEffect(() => {
    if (isRegistering) {
      loadTeams()
    }
  }, [isRegistering])

  async function loadTeams() {
    try {
      const res = await fetch('/api/teams')
      if (res.ok) {
        const data = await res.json()
        setAvailableTeams(data.teams || [])
      }
    } catch (err) {
      console.error('Failed to load teams:', err)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        setPassword('') // Clear password from memory
        success(`Welcome back, ${data.user.name}!`)
        loadLeaves(data.token)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          name,
          teamId: selectedTeamId || undefined
        })
      })
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        setPassword('') // Clear password from memory
        setName('')
        setSelectedTeamId('')
        loadLeaves(data.token)
        if (data.message) {
          success(data.message)
        } else {
          success(`Welcome, ${data.user.name}!`)
        }
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadLeaves(authToken?: string) {
    const tkn = authToken || token
    if (!tkn) return
    
    try {
      const res = await fetch('/api/leaves', {
        headers: { 
          'Authorization': `Bearer ${tkn}`
        }
      })
      const data = await res.json()
      
      if (res.status === 401) {
        // Token expired or invalid
        handleLogout()
        setError('Session expired. Please login again.')
        return
      }
      
      setLeaves(data.leaves || [])
    } catch (err) {
      setError('Failed to load leave requests')
    }
  }

  async function handleSubmitLeave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employeeName, startDate, endDate, reason })
      })
      const data = await res.json()
      
      if (res.status === 401) {
        handleLogout()
        setError('Session expired. Please login again.')
        return
      }
      
      if (data.success) {
        success('Leave request submitted successfully!')
        setEmployeeName('')
        setStartDate('')
        setEndDate('')
        setReason('')
        setCurrentView('list')
        loadLeaves()
      } else {
        setError(data.error || 'Failed to submit leave request')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setUser(null)
    setToken('')
    setLeaves([])
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} onClose={closeToast} />
        <div style={{maxWidth:'400px',margin:'100px auto',padding:'20px'}}>
        <h1>LeaveBot {isRegistering ? 'Register' : 'Login'}</h1>
        {error && <div style={{padding:'10px',background:'#f8d7da',color:'#721c24',borderRadius:'5px',marginBottom:'10px'}}>{error}</div>}
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={e=>setUsername(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
            required
            disabled={loading}
            minLength={3}
            maxLength={50}
          />
          
          {isRegistering && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name}
              onChange={e=>setName(e.target.value)}
              style={{width:'100%',padding:'10px',margin:'10px 0'}}
              disabled={loading}
            />
          )}

          {isRegistering && (
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              style={{width:'100%',padding:'10px',margin:'10px 0',borderRadius:'5px',border:'1px solid #ddd'}}
              disabled={loading}
            >
              <option value="">No team (join later)</option>
              {availableTeams.map((team: any) => (
                <option key={team._id} value={team._id}>
                  {team.name} {team.leaderName ? `- ${team.leaderName}` : ''}
                </option>
              ))}
            </select>
          )}
          
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e=>setPassword(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
            required
            disabled={loading}
            minLength={8}
          />
          
          <button 
            type="submit" 
            style={{width:'100%',padding:'10px',background:loading?'#6c757d':(isRegistering?'#28a745':'#007bff'),color:'white',border:'none',cursor:loading?'not-allowed':'pointer',marginBottom:'10px'}}
            disabled={loading}
          >
            {loading ? (isRegistering ? 'Registering...' : 'Logging in...') : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>
        
        <button 
          onClick={()=>{setIsRegistering(!isRegistering);setError('');setPassword('');setName('');setSelectedTeamId('');}}
          style={{width:'100%',padding:'10px',background:'transparent',color:'#007bff',border:'1px solid #007bff',cursor:'pointer'}}
          disabled={loading}
        >
          {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
        </button>
        
        <div style={{fontSize:'12px',marginTop:'20px',color:'#666',padding:'10px',background:'#f8f9fa',borderRadius:'5px'}}>
          <strong>🔒 Security Notes:</strong>
          <ul style={{marginTop:'5px',paddingLeft:'20px',textAlign:'left'}}>
            <li>Password must be at least 8 characters</li>
            <li>First user becomes admin automatically</li>
            <li>No hardcoded credentials in code</li>
          </ul>
        </div>
      </div>
      </>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={closeToast} />
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h1>LeaveBot - Welcome {user.name}!</h1>
        <button onClick={handleLogout} style={{padding:'10px 20px',background:'#dc3545',color:'white',border:'none',cursor:'pointer',borderRadius:'5px'}}>
          Logout
        </button>
      </div>

      {error && <div style={{padding:'10px',background:'#f8d7da',color:'#721c24',borderRadius:'5px',margin:'20px 0'}}>{error}</div>}

      {/* Navigation Tabs */}
      <div style={{
        display:'flex',
        gap:'10px',
        marginBottom:'30px',
        borderBottom:'2px solid #e5e7eb',
        paddingBottom:'0'
      }}>
        <NavTab 
          active={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')}
          icon="📊"
          label="Dashboard"
        />
        <NavTab 
          active={currentView === 'calendar'} 
          onClick={() => setCurrentView('calendar')}
          icon="📅"
          label="Calendar"
        />
        <NavTab 
          active={currentView === 'list'} 
          onClick={() => setCurrentView('list')}
          icon="📋"
          label="Leave List"
        />
        <NavTab 
          active={currentView === 'form'} 
          onClick={() => setCurrentView('form')}
          icon="✏️"
          label="Request Leave"
        />
        {user.role === 'admin' && (
          <NavTab 
            active={currentView === 'teams'} 
            onClick={() => setCurrentView('teams')}
            icon="🏢"
            label="Teams"
          />
        )}
        {(user.role === 'admin' || user.role === 'leader') && (
          <NavTab 
            active={currentView === 'team'} 
            onClick={() => setCurrentView('team')}
            icon="👥"
            label="Users"
          />
        )}
      </div>

      {/* View Content */}
      {currentView === 'dashboard' && (
        <Dashboard user={user} leaves={leaves} token={token} />
      )}

      {currentView === 'calendar' && (
        <InteractiveCalendar 
          user={user} 
          leaves={leaves}
          onRequestLeave={(startDate, endDate) => {
            setStartDate(startDate.toISOString().split('T')[0])
            setEndDate(endDate.toISOString().split('T')[0])
            setEmployeeName(user.name)
            setCurrentView('form')
          }}
        />
      )}

      {currentView === 'teams' && user.role === 'admin' && (
        <TeamManagement currentUser={user} token={token} />
      )}

      {currentView === 'team' && (user.role === 'admin' || user.role === 'leader') && (
        <UserManagement currentUser={user} token={token} />
      )}

      {currentView === 'form' && (
        <div style={{marginTop:'30px'}}>
          <h2>Request Leave</h2>
          <form onSubmit={handleSubmitLeave} style={{border:'1px solid #ddd',padding:'20px',borderRadius:'5px',background:'white'}}>
            <input 
              type="text" 
              placeholder="Employee Name" 
              value={employeeName}
              onChange={e=>setEmployeeName(e.target.value)}
              style={{width:'100%',padding:'10px',margin:'10px 0',borderRadius:'5px',border:'1px solid #ddd'}}
              required
              disabled={loading}
            />
            <input 
              type="date" 
              placeholder="Start Date" 
              value={startDate}
              onChange={e=>setStartDate(e.target.value)}
              style={{width:'100%',padding:'10px',margin:'10px 0',borderRadius:'5px',border:'1px solid #ddd'}}
              required
              disabled={loading}
            />
            <input 
              type="date" 
              placeholder="End Date" 
              value={endDate}
              onChange={e=>setEndDate(e.target.value)}
              style={{width:'100%',padding:'10px',margin:'10px 0',borderRadius:'5px',border:'1px solid #ddd'}}
              required
              disabled={loading}
            />
            <textarea 
              placeholder="Reason (optional)" 
              value={reason}
              onChange={e=>setReason(e.target.value)}
              style={{width:'100%',padding:'10px',margin:'10px 0',minHeight:'80px',borderRadius:'5px',border:'1px solid #ddd'}}
              disabled={loading}
            />
            <button 
              type="submit" 
              style={{padding:'10px 20px',background:loading?'#6c757d':'#28a745',color:'white',border:'none',cursor:loading?'not-allowed':'pointer',borderRadius:'5px'}}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {currentView === 'list' && (
        <div style={{marginTop:'30px'}}>
          <h2>Leave Requests</h2>
          
          <SearchFilter 
            onFilterChange={setSearchFilter}
            resultCount={filteredLeaves.length}
          />

          {loading ? (
            <div className="space-y-4 mt-6">
              <LeaveCardSkeleton />
              <LeaveCardSkeleton />
              <LeaveCardSkeleton />
            </div>
          ) : filteredLeaves.length === 0 ? (
            leaves.length === 0 ? (
              <EmptyState 
                icon="leaves"
                title="No leave requests yet"
                description="Submit your first leave request to get started. Your team and admin will be notified for approval."
                action={{
                  label: '✏️ Request Leave',
                  onClick: () => setCurrentView('form')
                }}
              />
            ) : (
              <EmptyState 
                icon="leaves"
                title="No matching requests"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            )
          ) : (
            <div>
              {filteredLeaves.map(leave => (
                <LeaveCard 
                  key={leave.id} 
                  leave={leave} 
                  isAdmin={user.role === 'admin'}
                  onStatusUpdate={() => loadLeaves()}
                  token={token}
                  showToast={success}
                  showError={showError}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  )
}

// Navigation Tab Component
function NavTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
        color: active ? '#3b82f6' : '#6b7280',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: active ? '600' : '500',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// Leave Card Component with Admin Actions
function LeaveCard({ leave, isAdmin, onStatusUpdate, token, showToast, showError }: { 
  leave: any; 
  isAdmin: boolean; 
  onStatusUpdate: () => void;
  token: string;
  showToast: (msg: string) => void;
  showError: (msg: string) => void;
}) {
  const [updating, setUpdating] = useState(false)

  async function updateStatus(status: 'approved' | 'rejected') {
    setUpdating(true)
    try {
      const res = await fetch(`/api/leaves/${leave._id || leave.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })
      
      if (res.ok) {
        showToast(`Leave request ${status} successfully!`)
        onStatusUpdate()
      } else {
        showError('Failed to update leave request')
      }
    } catch (err) {
      showError('Network error. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  const statusColors = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    approved: { bg: '#d1fae5', text: '#065f46' },
    rejected: { bg: '#fee2e2', text: '#991b1b' }
  }

  const color = statusColors[leave.status as keyof typeof statusColors] || statusColors.pending

  return (
    <div style={{
      border:'1px solid #e5e7eb',
      padding:'20px',
      margin:'10px 0',
      borderRadius:'8px',
      background:'white',
      boxShadow:'0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'10px'}}>
        <div>
          <strong style={{fontSize:'18px',color:'#1f2937'}}>{leave.employeeName}</strong>
          <div style={{display:'flex',gap:'10px',marginTop:'8px',fontSize:'14px',color:'#6b7280'}}>
            <span>📅 {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
          </div>
        </div>
        <span style={{
          padding:'6px 12px',
          borderRadius:'20px',
          fontSize:'12px',
          fontWeight:'600',
          background: color.bg,
          color: color.text,
          textTransform:'uppercase'
        }}>
          {leave.status}
        </span>
      </div>
      
      {leave.reason && (
        <p style={{color:'#4b5563',marginTop:'10px',fontSize:'14px'}}>
          <strong>Reason:</strong> {leave.reason}
        </p>
      )}

      {isAdmin && leave.status === 'pending' && (
        <div style={{marginTop:'15px',display:'flex',gap:'10px'}}>
          <button 
            onClick={() => updateStatus('approved')}
            disabled={updating}
            style={{
              padding:'8px 16px',
              background:updating?'#9ca3af':'#10b981',
              color:'white',
              border:'none',
              borderRadius:'5px',
              cursor:updating?'not-allowed':'pointer',
              fontSize:'14px',
              fontWeight:'500'
            }}
          >
            ✓ Approve
          </button>
          <button 
            onClick={() => updateStatus('rejected')}
            disabled={updating}
            style={{
              padding:'8px 16px',
              background:updating?'#9ca3af':'#ef4444',
              color:'white',
              border:'none',
              borderRadius:'5px',
              cursor:updating?'not-allowed':'pointer',
              fontSize:'14px',
              fontWeight:'500'
            }}
          >
            ✗ Reject
          </button>
        </div>
      )}
    </div>
  )
}

export default App
