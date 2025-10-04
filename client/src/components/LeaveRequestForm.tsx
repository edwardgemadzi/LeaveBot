import { useState } from "react";
import type { Employee } from "../types";
import { api } from "../api";
import "./LeaveRequestForm.css";

interface LeaveRequestFormProps {
  employees: Employee[];
  onSuccess: () => void;
}

export default function LeaveRequestForm({ employees, onSuccess }: LeaveRequestFormProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.createLeaveRequest({
        employeeId: Number(employeeId),
        startDate,
        endDate,
        reason: reason || undefined,
      });
      
      setEmployeeId("");
      setStartDate("");
      setEndDate("");
      setReason("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create leave request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="leave-request-form" onSubmit={handleSubmit}>
      <h3>Book Leave</h3>
      
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="employee">Employee</label>
        <select
          id="employee"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
        >
          <option value="">Select employee...</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="startDate">Start Date</label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="endDate">End Date</label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reason">Reason (optional)</label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g., Vacation, Medical, Personal"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
