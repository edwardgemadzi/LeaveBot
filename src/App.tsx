import { useState } from 'react'
import './App.css'

function App() {
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [leaves, setLeaves] = useState<any[]>([])
  const [employeeName, setEmployeeName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.success) {
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      loadLeaves()
    } else {
      alert(data.error)
    }
  }

  async function loadLeaves() {
    const res = await fetch('/api/leaves')
    const data = await res.json()
    setLeaves(data.leaves)
  }

  async function handleSubmitLeave(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeName, startDate, endDate, reason })
    })
    const data = await res.json()
    if (data.success) {
      alert('Leave request submitted!')
      setEmployeeName('')
      setStartDate('')
      setEndDate('')
      setReason('')
      loadLeaves()
    }
  }

  if (!user) {
    return (
      <div style={{maxWidth:'400px',margin:'100px auto',padding:'20px'}}>
        <h1>LeaveBot Login</h1>
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={e=>setUsername(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e=>setPassword(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
          />
          <button type="submit" style={{width:'100%',padding:'10px',background:'#007bff',color:'white',border:'none',cursor:'pointer'}}>
            Login
          </button>
        </form>
        <p style={{fontSize:'12px',marginTop:'20px'}}>Default: edgemadzi / admin123</p>
      </div>
    )
  }

  return (
    <div style={{maxWidth:'800px',margin:'0 auto',padding:'20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1>LeaveBot - Welcome {user.name}!</h1>
        <button onClick={()=>{setUser(null);localStorage.removeItem('user')}} style={{padding:'10px 20px',background:'#dc3545',color:'white',border:'none',cursor:'pointer'}}>
          Logout
        </button>
      </div>

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
          />
          <input 
            type="date" 
            placeholder="Start Date" 
            value={startDate}
            onChange={e=>setStartDate(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
            required
          />
          <input 
            type="date" 
            placeholder="End Date" 
            value={endDate}
            onChange={e=>setEndDate(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0'}}
            required
          />
          <textarea 
            placeholder="Reason (optional)" 
            value={reason}
            onChange={e=>setReason(e.target.value)}
            style={{width:'100%',padding:'10px',margin:'10px 0',minHeight:'80px'}}
          />
          <button type="submit" style={{padding:'10px 20px',background:'#28a745',color:'white',border:'none',cursor:'pointer'}}>
            Submit Request
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
