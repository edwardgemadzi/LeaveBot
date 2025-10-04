import { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import Calendar from "./components/Calendar.js";
import LeaveRequestForm from "./components/LeaveRequestForm.js";
import PendingRequests from "./components/PendingRequests.js";
import type { Employee, LeaveRequest } from "./types";
import { api } from "./api";
import "./App.css";

function App() {
  const { user, logout, isAuthenticated, isAdmin, isSupervisor } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'register'>('dashboard');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [refreshKey, isAuthenticated]);

  async function loadData() {
    try {
      const [employeesRes, requestsRes] = await Promise.all([
        api.getEmployees(),
        api.getLeaveRequests(),
      ]);
      setEmployees(employeesRes.employees);
      setRequests(requestsRes.requests);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  }

  function handleRefresh() {
    setRefreshKey((prev) => prev + 1);
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  function prevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show registration page if admin/supervisor wants to register users
  if (currentView === 'register') {
    return (
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>🗓️ LeaveBot - Employee Leave Management</h1>
            <div className="header-user">
              <span className="user-info">
                👤 <strong>{user?.name}</strong>
                {isAdmin && <span className="badge admin">Admin</span>}
                {isSupervisor && !isAdmin && <span className="badge supervisor">Supervisor</span>}
              </span>
              <button onClick={() => setCurrentView('dashboard')} className="nav-button">
                ← Back to Dashboard
              </button>
              <button onClick={logout} className="logout-button">
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="app-main">
          <Register />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🗓️ LeaveBot - Employee Leave Management</h1>
          <div className="header-user">
            <span className="user-info">
              👤 <strong>{user?.name}</strong>
              {isAdmin && <span className="badge admin">Admin</span>}
              {isSupervisor && !isAdmin && <span className="badge supervisor">Supervisor</span>}
            </span>
            {(isAdmin || isSupervisor) && (
              <button onClick={() => setCurrentView('register')} className="nav-button">
                + Register User
              </button>
            )}
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="month-navigation">
          <button onClick={prevMonth}>← Previous</button>
          <button onClick={nextMonth}>Next →</button>
        </div>

        <Calendar month={currentMonth} key={refreshKey} />

        <div className="forms-section">
          <LeaveRequestForm employees={employees} onSuccess={handleRefresh} />
          
          {/* Only admins and supervisors can see pending requests */}
          {isSupervisor && (
            <PendingRequests requests={requests} onApprove={handleRefresh} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
