import { useState, useEffect } from "react";
import Calendar from "./components/Calendar.js";
import LeaveRequestForm from "./components/LeaveRequestForm.js";
import PendingRequests from "./components/PendingRequests.js";
import type { Employee, LeaveRequest } from "./types";
import { api } from "./api";
import "./App.css";

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🗓️ LeaveBot - Employee Leave Management</h1>
      </header>

      <main className="app-main">
        <div className="month-navigation">
          <button onClick={prevMonth}>← Previous</button>
          <button onClick={nextMonth}>Next →</button>
        </div>

        <Calendar month={currentMonth} key={refreshKey} />

        <div className="forms-section">
          <LeaveRequestForm employees={employees} onSuccess={handleRefresh} />
          <PendingRequests requests={requests} onApprove={handleRefresh} />
        </div>
      </main>
    </div>
  );
}

export default App;
