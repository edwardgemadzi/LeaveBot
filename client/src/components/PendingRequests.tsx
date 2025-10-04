import { useState } from "react";
import type { LeaveRequest } from "../types";
import { api } from "../api";
import "./PendingRequests.css";

interface PendingRequestsProps {
  requests: LeaveRequest[];
  onApprove: () => void;
}

export default function PendingRequests({ requests, onApprove }: PendingRequestsProps) {
  const [loading, setLoading] = useState<number | null>(null);

  async function handleApprove(id: number) {
    setLoading(id);
    try {
      await api.approveLeaveRequest(id);
      onApprove();
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert("Failed to approve request");
    } finally {
      setLoading(null);
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");

  if (pendingRequests.length === 0) {
    return (
      <div className="pending-requests">
        <h3>Pending Approvals</h3>
        <p className="no-requests">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="pending-requests">
      <h3>Pending Approvals (Supervisor View)</h3>
      <div className="requests-list">
        {pendingRequests.map((request) => (
          <div key={request.id} className="request-card">
            <div className="request-header">
              <strong>{request.employeeName}</strong>
              <span className="request-status pending">Pending</span>
            </div>
            <div className="request-dates">
              {request.startDate} to {request.endDate}
            </div>
            {request.reason && (
              <div className="request-reason">Reason: {request.reason}</div>
            )}
            <button
              className="approve-btn"
              onClick={() => handleApprove(request.id)}
              disabled={loading === request.id}
            >
              {loading === request.id ? "Approving..." : "Approve"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
