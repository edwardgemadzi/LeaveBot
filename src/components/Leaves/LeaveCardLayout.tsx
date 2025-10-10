import React from 'react';
import { LeaveCardHeader } from './LeaveCardHeader';
import { LeaveCardDetails } from './LeaveCardDetails';
import { LeaveCardActions } from './LeaveCardActions';
import { LeaveCardConflictCheck } from './LeaveCardConflictCheck';
import { LeaveCardFooter } from './LeaveCardFooter';

interface Leave {
  id?: string;
  _id?: string;
  employeeName: string;
  leaveType: string;
  status: string;
  startDate: string;
  endDate: string;
  reason?: string;
  shiftPattern?: string;
  shiftTime?: string;
  workingDaysCount?: number;
  createdAt: string;
}

interface LeaveCardLayoutProps {
  leave: Leave;
  isAdmin: boolean;
  calendarDays: number;
  workingDays: number;
  statusColor: {
    bg: string;
    text: string;
    border: string;
  };
  concurrentInfo: { hasConflict?: boolean; count?: number; limit?: number } | null;
  checkingConflicts: boolean;
  onStatusUpdate: (leaveId: string, status: 'approved' | 'rejected') => Promise<void>;
  onCheckConflicts: () => void;
}

export const LeaveCardLayout: React.FC<LeaveCardLayoutProps> = ({
  leave,
  isAdmin,
  calendarDays,
  workingDays,
  statusColor,
  concurrentInfo,
  checkingConflicts,
  onStatusUpdate,
  onCheckConflicts
}) => {
  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm"
      style={{
        borderLeft: `4px solid ${statusColor.border}`,
      }}
    >
      <LeaveCardHeader
        leave={leave}
        statusColor={statusColor}
      />

      <LeaveCardDetails
        leave={leave}
        calendarDays={calendarDays}
        workingDays={workingDays}
      />

      <LeaveCardActions
        leave={leave}
        isAdmin={isAdmin}
        onStatusUpdate={onStatusUpdate}
      />

      <LeaveCardConflictCheck
        isAdmin={isAdmin}
        concurrentInfo={concurrentInfo}
        checkingConflicts={checkingConflicts}
        onCheckConflicts={onCheckConflicts}
      />

      <LeaveCardFooter leave={leave} />
    </div>
  );
};
