import React from 'react'
import type { Leave, User } from '../../types'
import { formatLeaveType } from '../../utils/calendarStyles'
import StatusBadge from './StatusBadge'

interface RecentActivityProps {
  recentActivity: Leave[]
  user: User
  processing: string | null
  onLeaveAction: (leaveId: string, action: 'approve' | 'reject' | 'delete') => void
}

export default function RecentActivity({ recentActivity, user, processing, onLeaveAction }: RecentActivityProps) {
  return (
    <div>
      <h3 className="mb-3.5 text-gray-700">
        📋 Recent Activity
      </h3>
      <div className="bg-white rounded-lg p-5 shadow-sm">
        {recentActivity.length === 0 ? (
          <p className="text-slate-400 text-center py-5">
            No recent activity
          </p>
        ) : (
          <div>
            {recentActivity.map(leave => (
              <div
                key={leave.id || leave._id}
                className="p-3 border-b border-slate-200 mb-2"
              >
                <div className="flex justify-between items-center mb-1">
                  <strong className="text-gray-800">{leave.employeeName}</strong>
                  <StatusBadge status={leave.status} />
                </div>
                <p className="text-sm text-slate-600 my-1">
                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                </p>
                <div className="text-xs text-emerald-600 font-semibold my-1">
                  {formatLeaveType(leave.leaveType)}
                </div>
                {leave.reason && (
                  <p className="text-xs text-slate-400 mt-1">
                    {leave.reason.length > 40 ? leave.reason.substring(0, 40) + '...' : leave.reason}
                  </p>
                )}
                
                {/* Admin/Leader Actions */}
                {(user.role === 'admin' || user.role === 'leader') && (
                  <div className="flex gap-2 mt-2">
                    {leave.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onLeaveAction(leave.id || leave._id, 'approve')}
                          disabled={processing === (leave.id || leave._id)}
                          className={`px-3 py-1 rounded text-white text-xs font-medium ${
                            processing === (leave.id || leave._id) 
                              ? 'bg-slate-400 cursor-not-allowed' 
                              : 'bg-emerald-500 hover:bg-emerald-600'
                          }`}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => onLeaveAction(leave.id || leave._id, 'reject')}
                          disabled={processing === (leave.id || leave._id)}
                          className={`px-3 py-1 rounded text-white text-xs font-medium ${
                            processing === (leave.id || leave._id) 
                              ? 'bg-slate-400 cursor-not-allowed' 
                              : 'bg-red-500 hover:bg-red-600'
                          }`}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete this leave request from ${leave.employeeName}?`)) {
                            onLeaveAction(leave.id || leave._id, 'delete')
                          }
                        }}
                        disabled={processing === (leave.id || leave._id)}
                        className={`px-3 py-1 rounded text-white text-xs font-medium ${
                          processing === (leave.id || leave._id) 
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : 'bg-slate-600 hover:bg-slate-700'
                        }`}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}