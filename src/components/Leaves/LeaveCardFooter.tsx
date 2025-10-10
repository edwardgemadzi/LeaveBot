import React from 'react';
import { formatDisplayDate } from '../../utils/dateHelpers';

interface Leave {
  createdAt: string;
}

interface LeaveCardFooterProps {
  leave: Leave;
}

export const LeaveCardFooter: React.FC<LeaveCardFooterProps> = ({ leave }) => {
  return (
    <p className="mt-4 mb-0 text-xs text-gray-400">
      Requested {formatDisplayDate(leave.createdAt)}
    </p>
  );
};
