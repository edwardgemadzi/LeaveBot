import React from 'react';
import { formatDateRange } from '../../utils/dateHelpers';

interface Leave {
  startDate: string;
  endDate: string;
  reason?: string;
  shiftPattern?: string;
  shiftTime?: string;
  workingDaysCount?: number;
}

interface LeaveCardDetailsProps {
  leave: Leave;
  calendarDays: number;
  workingDays: number;
}

export const LeaveCardDetails: React.FC<LeaveCardDetailsProps> = ({
  leave,
  calendarDays,
  workingDays
}) => {
  return (
    <div className="mb-4">
      <p className="m-0 mb-2 text-sm text-gray-700">
        <strong>📅 Dates:</strong> {formatDateRange(leave.startDate, leave.endDate)}
      </p>
      <p className="m-0 mb-2 text-sm text-gray-700">
        <strong>📊 Duration:</strong> {workingDays} working day
        {workingDays !== 1 ? 's' : ''} ({calendarDays} calendar day
        {calendarDays !== 1 ? 's' : ''})
      </p>
      {leave.reason && (
        <p className="m-0 text-sm text-gray-500">
          <strong>💭 Reason:</strong> {leave.reason}
        </p>
      )}
      {leave.shiftPattern && (
        <p className="m-0 mt-3 text-xs text-gray-400">
          Shift: {leave.shiftPattern} {leave.shiftTime && `(${leave.shiftTime})`}
        </p>
      )}
    </div>
  );
};
