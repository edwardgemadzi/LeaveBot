import { useState, useEffect, useMemo } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import InteractiveCalendar from './components/InteractiveCalendar'
import UserManagement from './components/UserManagement'
import TeamManagement from './components/TeamManagement'
import UserProfileModal from './components/UserProfileModal'
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
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [calculatedDays, setCalculatedDays] = useState<{
    workingDays: number
    calendarDays: number
    warning: string | null
    shiftPattern?: string
    shiftTime?: string
  } | null>(null)
  const [calculatingDays, setCalculatingDays] = useState(false)

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
      const parsedUser = JSON.parse(savedUser)
      // Migration: Force re-login if user.id is undefined (old token format)
      if (!parsedUser.id || parsedUser.id === 'undefined') {
        console.log('Invalid user ID detected, clearing session...')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        showError('Please log in again to continue')
        return
      }
      setToken(savedToken)
      setUser(parsedUser)
      loadLeaves(savedToken)
    }
  }, [])

  // Load teams when registration mode is active
  useEffect(() => {
    if (isRegistering) {
      loadTeams()
    }
  }, [isRegistering])

  // Auto-refresh leaves every 30 seconds for real-time sync
  useEffect(() => {
    if (!token || !user) return
    
    const interval = setInterval(() => {
      loadLeaves()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [token, user])

    // Refresh leaves when switching to calendar view
  useEffect(() => {
    if (currentView === 'calendar' && token) {
      loadLeaves()
    }
  }, [currentView])

  // Calculate working days when dates change
  useEffect(() => {
    if (!startDate || !endDate || !token) {
      setCalculatedDays(null)
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (end < start) {
      setCalculatedDays(null)
      return
    }

    const calculateDays = async () => {
      setCalculatingDays(true)
      try {
        const res = await fetch('/api/leaves?action=calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ startDate, endDate })
        })
        
        if (res.ok) {
          const data = await res.json()
          setCalculatedDays({
            workingDays: data.workingDays,
            calendarDays: data.calendarDays,
            warning: data.warning,
            shiftPattern: data.shiftPattern,
            shiftTime: data.shiftTime
          })
        } else {
          setCalculatedDays(null)
        }
      } catch (err) {
        console.error('Failed to calculate working days:', err)
        setCalculatedDays(null)
      } finally {
        setCalculatingDays(false)
      }
    }

    // Debounce the calculation
    const timer = setTimeout(calculateDays, 300)
    return () => clearTimeout(timer)
  }, [startDate, endDate, token])

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
    
    // Strip @ symbol if user included it
    const cleanUsername = username.replace(/^@+/, '')
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
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
    
    // Strip @ symbol if user included it
    const cleanUsername = username.replace(/^@+/, '')
    
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: cleanUsername, 
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
        body: JSON.stringify({ 
          employeeName, 
          startDate, 
          endDate, 
          reason,
          workingDaysCount: calculatedDays?.workingDays,
          calendarDaysCount: calculatedDays?.calendarDays,
          shiftPattern: calculatedDays?.shiftPattern,
          shiftTime: calculatedDays?.shiftTime
        })
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
        setCalculatedDays(null)
        setShowRequestModal(false)
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
            placeholder="Username (without @)" 
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
        <div style={{display:'flex',gap:'10px'}}>
          <button 
            onClick={() => setShowProfileSettings(true)} 
            style={{
              padding:'10px 20px',
              background:'#3b82f6',
              color:'white',
              border:'none',
              cursor:'pointer',
              borderRadius:'5px',
              display:'flex',
              alignItems:'center',
              gap:'6px'
            }}
          >
            ⚙️ My Settings
          </button>
          <button onClick={handleLogout} style={{padding:'10px 20px',background:'#dc3545',color:'white',border:'none',cursor:'pointer',borderRadius:'5px'}}>
            Logout
          </button>
        </div>
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
            label="Team Management"
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
            setShowRequestModal(true)
          }}
          onRefresh={() => loadLeaves()}
          showToast={info}
        />
      )}

      {currentView === 'teams' && user.role === 'admin' && (
        <TeamManagement currentUser={user} token={token} />
      )}

      {currentView === 'team' && (user.role === 'admin' || user.role === 'leader') && (
        <UserManagement currentUser={user} token={token} />
      )}

      {/* Floating Action Button for Regular Users */}
      {user.role === 'user' && (
        <button
          onClick={() => {
            setEmployeeName(user.name)
            setShowRequestModal(true)
          }}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '28px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
          title="Request Leave"
        >
          ✏️
        </button>
      )}

      {/* Leave Request Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <h2 style={{ margin: 0, color: '#1f2937' }}>✏️ Request Leave</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setEmployeeName('')
                  setStartDate('')
                  setEndDate('')
                  setReason('')
                  setCalculatedDays(null)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '5px'
                }}
                title="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitLeave}>
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
              
              {/* Working Days Display */}
              {calculatedDays && (
                <div style={{
                  padding:'15px',
                  margin:'10px 0',
                  background:'#f0fdf4',
                  border:'1px solid #86efac',
                  borderRadius:'5px'
                }}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                    <span style={{fontSize:'20px',fontWeight:'bold',color:'#059669'}}>
                      📊 {calculatedDays.workingDays} working day{calculatedDays.workingDays !== 1 ? 's' : ''}
                    </span>
                    <span style={{fontSize:'14px',color:'#6b7280'}}>
                      ({calculatedDays.calendarDays} calendar day{calculatedDays.calendarDays !== 1 ? 's' : ''})
                    </span>
                  </div>
                  {calculatedDays.shiftPattern && (
                    <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                      <span style={{
                        padding:'4px 10px',
                        background:'#e0e7ff',
                        color:'#4338ca',
                        borderRadius:'12px',
                        fontSize:'13px',
                        fontWeight:'500'
                      }}>
                        {calculatedDays.shiftPattern === 'regular' ? '📅 Regular' : 
                         calculatedDays.shiftPattern === '2-2' ? '🔄 2/2' :
                         calculatedDays.shiftPattern === '5-2' ? '🔄 5/2' : '📅 Custom'}
                      </span>
                      {calculatedDays.shiftTime && (
                        <span style={{
                          padding:'4px 10px',
                          background:'#fef3c7',
                          color:'#92400e',
                          borderRadius:'12px',
                          fontSize:'13px',
                          fontWeight:'500'
                        }}>
                          {calculatedDays.shiftTime === 'day' ? '☀️ Day' : '🌙 Night'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
              {calculatingDays && (
                <div style={{
                  padding:'15px',
                  margin:'10px 0',
                  background:'#f3f4f6',
                  border:'1px solid #d1d5db',
                  borderRadius:'5px',
                  color:'#6b7280',
                  fontSize:'14px'
                }}>
                  ⏳ Calculating working days...
                </div>
              )}
              {calculatedDays?.warning && (
                <div style={{
                  padding:'15px',
                  margin:'10px 0',
                  background:'#fef3c7',
                  border:'1px solid #fbbf24',
                  borderRadius:'5px',
                  color:'#92400e',
                  fontSize:'14px'
                }}>
                  ⚠️ {calculatedDays.warning}
                </div>
              )}
              
              <textarea 
                placeholder="Reason (optional)" 
                value={reason}
                onChange={e=>setReason(e.target.value)}
                style={{width:'100%',padding:'10px',margin:'10px 0',minHeight:'80px',borderRadius:'5px',border:'1px solid #ddd'}}
                disabled={loading}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="submit" 
                  style={{
                    flex: 1,
                    padding:'12px 20px',
                    background: loading ? '#6c757d' : '#28a745',
                    color:'white',
                    border:'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    borderRadius:'5px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false)
                    setEmployeeName('')
                    setStartDate('')
                    setEndDate('')
                    setReason('')
                    setCalculatedDays(null)
                  }}
                  style={{
                    padding:'12px 20px',
                    background:'#6c757d',
                    color:'white',
                    border:'none',
                    cursor:'pointer',
                    borderRadius:'5px',
                    fontSize: '16px'
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
                description={user.role === 'user' ? "Submit your first leave request to get started. Your team and admin will be notified for approval." : "No leave requests from team members yet."}
                action={user.role === 'user' ? {
                  label: '✏️ Request Leave',
                  onClick: () => {
                    setEmployeeName(user.name)
                    setShowRequestModal(true)
                  }
                } : undefined}
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
                  isAdmin={user.role === 'admin' || user.role === 'leader'}
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

      {/* User Profile Settings Modal */}
      {showProfileSettings && (
        <UserProfileModal
          isOpen={showProfileSettings}
          onClose={() => setShowProfileSettings(false)}
          user={user}
          token={token}
          onSuccess={() => {
            success('Settings saved successfully!')
            setShowProfileSettings(false)
          }}
        />
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

  // Calculate calendar days
  const calculateCalendarDays = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const calendarDays = calculateCalendarDays(leave.startDate, leave.endDate)
  const workingDays = leave.workingDaysCount || calendarDays // Fall back to calendar days if not calculated
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictWarning, setConflictWarning] = useState('')
  const [pendingApproval, setPendingApproval] = useState(false)

  async function checkConflicts() {
    try {
      const res = await fetch(`/api/leaves?action=calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          startDate: leave.startDate, 
          endDate: leave.endDate,
          userId: leave.userId 
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        return data.warning
      }
    } catch (err) {
      console.error('Failed to check conflicts:', err)
    }
    return null
  }

  async function handleApprove() {
    const warning = await checkConflicts()
    if (warning) {
      setConflictWarning(warning)
      setShowConflictDialog(true)
    } else {
      updateStatus('approved')
    }
  }

  async function confirmApproval() {
    setShowConflictDialog(false)
    updateStatus('approved')
  }

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
          <div style={{display:'flex',gap:'10px',marginTop:'8px',fontSize:'14px',color:'#6b7280',alignItems:'center'}}>
            <span>📅 {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
          </div>
          {/* Working Days Display */}
          <div style={{marginTop:'8px',display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'}}>
            <span style={{
              fontSize:'16px',
              fontWeight:'bold',
              color:'#059669',
              display:'inline-flex',
              alignItems:'center',
              gap:'4px'
            }}>
              📊 {workingDays} working day{workingDays !== 1 ? 's' : ''}
            </span>
            <span style={{fontSize:'13px',color:'#6b7280'}}>
              ({calendarDays} calendar day{calendarDays !== 1 ? 's' : ''})
            </span>
            {/* Shift Pattern Badge */}
            {leave.shiftPattern && (
              <span style={{
                padding:'2px 8px',
                background:'#dbeafe',
                color:'#1e40af',
                borderRadius:'12px',
                fontSize:'11px',
                fontWeight:'600'
              }}>
                {leave.shiftPattern === 'regular' ? '📅 Regular' : 
                 leave.shiftPattern === '2-2' ? '🔄 2/2' :
                 leave.shiftPattern === '5-2' ? '🔄 5/2' : 
                 '🔄 Custom'}
              </span>
            )}
            {leave.shiftTime && (
              <span style={{
                padding:'2px 8px',
                background:'#fef3c7',
                color:'#92400e',
                borderRadius:'12px',
                fontSize:'11px',
                fontWeight:'600'
              }}>
                {leave.shiftTime === 'day' ? '☀️ Day' : 
                 leave.shiftTime === 'night' ? '🌙 Night' : 
                 '⏰ Custom'}
              </span>
            )}
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
            onClick={handleApprove}
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

      {/* Conflict Warning Dialog */}
      {showConflictDialog && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          zIndex:1000
        }}>
          <div style={{
            background:'white',
            padding:'20px',
            borderRadius:'10px',
            maxWidth:'450px',
            width:'90%',
            boxShadow:'0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{margin:'0 0 15px',color:'#dc2626'}}>⚠️ Concurrent Leave Limit Warning</h3>
            <p style={{margin:'0 0 20px',color:'#4b5563',fontSize:'14px'}}>
              {conflictWarning}
            </p>
            <p style={{margin:'0 0 20px',color:'#6b7280',fontSize:'13px'}}>
              Do you want to approve this leave request anyway?
            </p>
            <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
              <button 
                onClick={() => setShowConflictDialog(false)}
                style={{
                  padding:'8px 16px',
                  background:'white',
                  border:'1px solid #d1d5db',
                  borderRadius:'5px',
                  cursor:'pointer',
                  fontSize:'14px',
                  fontWeight:'500',
                  color:'#374151'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmApproval}
                style={{
                  padding:'8px 16px',
                  background:'#dc2626',
                  color:'white',
                  border:'none',
                  borderRadius:'5px',
                  cursor:'pointer',
                  fontSize:'14px',
                  fontWeight:'500'
                }}
              >
                Approve Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
