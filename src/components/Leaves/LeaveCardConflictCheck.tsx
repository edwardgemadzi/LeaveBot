import React from 'react';

interface LeaveCardConflictCheckProps {
  isAdmin: boolean;
  concurrentInfo: { hasConflict?: boolean; count?: number; limit?: number } | null;
  checkingConflicts: boolean;
  onCheckConflicts: () => void;
}

export const LeaveCardConflictCheck: React.FC<LeaveCardConflictCheckProps> = ({
  isAdmin,
  concurrentInfo,
  checkingConflicts,
  onCheckConflicts
}) => {
  if (!isAdmin) return null;

  if (concurrentInfo) {
    return (
      <div
        className="mt-2.5 p-3 rounded-lg border"
        style={{
          background: concurrentInfo.hasConflict ? '#fef2f2' : '#f0fdf4',
          borderColor: concurrentInfo.hasConflict ? '#fecaca' : '#bbf7d0',
        }}
      >
        <p
          className="m-0 text-xs font-medium"
          style={{
            color: concurrentInfo.hasConflict ? '#991b1b' : '#065f46',
          }}
        >
          {concurrentInfo.count} team member(s) on leave during this period
          {concurrentInfo.limit && ` (Limit: ${concurrentInfo.limit})`}
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={onCheckConflicts}
      disabled={checkingConflicts}
      className={`mt-2.5 py-2 px-3 text-white border-none rounded-md cursor-pointer text-xs font-medium w-full ${
        checkingConflicts
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-indigo-500 hover:bg-indigo-600'
      }`}
    >
      {checkingConflicts ? 'Checking...' : '🔍 Check Team Conflicts'}
    </button>
  );
};
