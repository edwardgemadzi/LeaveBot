import React from 'react';

interface Leave {
  id?: string;
  _id?: string;
  status: string;
}

interface LeaveCardActionsProps {
  leave: Leave;
  isAdmin: boolean;
  onStatusUpdate: (leaveId: string, status: 'approved' | 'rejected') => Promise<void>;
}

export const LeaveCardActions: React.FC<LeaveCardActionsProps> = ({
  leave,
  isAdmin,
  onStatusUpdate
}) => {
  if (!isAdmin || leave.status !== 'pending') return null;

  return (
    <div className="flex gap-2.5 pt-4 border-t border-gray-200">
      <button
        onClick={() => onStatusUpdate(leave.id || leave._id!, 'approved')}
        className="flex-1 py-2.5 bg-emerald-500 text-white border-none rounded-md cursor-pointer text-sm font-semibold hover:bg-emerald-600 transition-colors"
      >
        ✅ Approve
      </button>
      <button
        onClick={() => onStatusUpdate(leave.id || leave._id!, 'rejected')}
        className="flex-1 py-2.5 bg-red-500 text-white border-none rounded-md cursor-pointer text-sm font-semibold hover:bg-red-600 transition-colors"
      >
        ❌ Reject
      </button>
    </div>
  );
};
