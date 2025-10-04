import { useState, useEffect } from 'react'
import './App.css'

function App() {
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
        body: JSON.stringify({ username, password, name })
      })
      const data = await res.json()
      
      if (data.success) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        setPassword('') // Clear password from memory
        setName('')
        loadLeaves(data.token)
        if (data.message) {
          alert(data.message)
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
        alert('Leave request submitted!')
        setEmployeeName('')
        setStartDate('')
        setEndDate('')
        setReason('')
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
          onClick={()=>{setIsRegistering(!isRegistering);setError('');setPassword('');setName('');}}
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
    )
  }

  return (
    <div style={{maxWidth:'800px',margin:'0 auto',padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>LeaveBot - Welcome {user.name}!</h1>
        <button onClick={handleLogout} style={{padding:'10px 20px',background:'#dc3545',color:'white',border:'none',cursor:'pointer'}}>
          Logout
        </button>
      </div>

      {error && <div style={{padding:'10px',background:'#f8d7da',color:'#721c24',borderRadius:'5px',margin:'20px 0'}}>{error}</div>}

      <div style={{marginTop:'30px'}}>
        <h2>Request Leave</h2>
        <form onSubmit={handleSubmitLeave} style={{border:'1px solid #ddd',padding:'20px',borderRadius:'5px'}}>
          <input 
            type="text" 
            placeholder="Employee Name" 
            value={employeeName}
            onChange={e=>setEmployeeName(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
            required
            disabled={loading}
          />
          <input 
            type="date" 
            placeholder="Start Date" 
            value={startDate}
            onChange={e=>setStartDate(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
            required
            disabled={loading}
          />
          <input 
            type="date" 
            placeholder="End Date" 
            value={endDate}
            onChange={e=>setEndDate(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
            required
            disabled={loading}
          />
          <textarea 
            placeholder="Reason (optional)" 
            value={reason}
            onChange={e=>setReason(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0',minHeight:'80px'}}
            disabled={loading}
          />
          <button 
            type="submit" 
            style={{padding:'10px 20px',background:loading?'#6c757d':'#28a745',color:'white',border:'none',cursor:loading?'not-allowed':'pointer'}}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      <div style={{marginTop:'30px'}}>
        <h2>Leave Requests</h2>
        {leaves.length === 0 ? (
          <p>No leave requests yet</p>
        ) : (
          <div>
            {leaves.map(leave => (
              <div key={leave.id} style={{border:'1px solid #ddd',padding:'15px',margin:'10px 0',borderRadius:'5px'}}>
                <strong>{leave.employeeName}</strong>
                <p>{leave.startDate} to {leave.endDate}</p>
                {leave.reason && <p>Reason: {leave.reason}</p>}
                <span style={{color:leave.status==='pending'?'orange':'green'}}>{leave.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
