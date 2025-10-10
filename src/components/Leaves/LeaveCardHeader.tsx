import React from 'react';
import { formatLeaveType } from '../../utils/calendarStyles';

interface Leave {
  employeeName: string;
  leaveType: string;
  status: string;
}

interface LeaveCardHeaderProps {
  leave: Leave;
  statusColor: {
    bg: string;
    text: string;
    border: string;
  };
}

export const LeaveCardHeader: React.FC<LeaveCardHeaderProps> = ({
  leave,
  statusColor
}) => {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="m-0 mb-2 text-gray-800 text-lg font-medium">
          {leave.employeeName}
        </h3>
        <p className="m-0 text-sm text-gray-500">
          {formatLeaveType(leave.leaveType)}
        </p>
      </div>
      <span
        className="px-3 py-1.5 rounded-2xl text-xs font-semibold uppercase"
        style={{
          background: statusColor.bg,
          color: statusColor.text,
        }}
      >
        {leave.status}
      </span>
    </div>
  );
};
