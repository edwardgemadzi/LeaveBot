import React from 'react'
import type { Leave } from '../../types'
import { formatLeaveType } from '../../utils/calendarStyles'

interface UpcomingLeavesProps {
  upcomingLeaves: Leave[]
}

export default function UpcomingLeaves({ upcomingLeaves }: UpcomingLeavesProps) {
  return (
    <div>
      <h3 className="mb-3.5 text-gray-700">
        🗓️ Upcoming Approved Leaves
      </h3>
      <div className="bg-white rounded-lg p-5 shadow-sm">
        {upcomingLeaves.length === 0 ? (
          <p className="text-slate-400 text-center py-5">
            No upcoming approved leaves
          </p>
        ) : (
          <div>
            {upcomingLeaves.map(leave => (
              <div
                key={leave.id || leave._id}
                className="p-3 border-b border-slate-200 mb-2"
              >
                <div className="flex justify-between mb-1">
                  <strong className="text-gray-800">{leave.employeeName}</strong>
                  <span className="text-xs text-slate-600 font-bold">
                    {new Date(leave.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-emerald-600 font-semibold mb-0.5">
                  {formatLeaveType(leave.leaveType)}
                </div>
                {leave.reason && (
                  <p className="text-sm text-slate-600 mt-1">
                    {leave.reason.length > 50 ? leave.reason.substring(0, 50) + '...' : leave.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}