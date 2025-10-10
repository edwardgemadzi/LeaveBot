import React from 'react';
import { SearchFilter } from '../SearchFilter';
import { EmptyState } from '../EmptyState';
import { LeaveCardSkeleton } from '../LoadingSkeleton';
import LeaveCard from '../Leaves/LeaveCard';

interface Leave {
  id?: string;
  _id?: string;
  employeeName: string;
  reason?: string;
  status: string;
}

interface LeaveListViewProps {
  leaves: Leave[];
  loading: boolean;
  filteredLeaves: Leave[];
  searchFilter: { search: string; status: string };
  onFilterChange: (filter: { search: string; status: string }) => void;
  onViewChange: (view: string) => void;
  isAdmin: boolean;
  onStatusUpdate: (leaveId: string, status: 'approved' | 'rejected') => Promise<void>;
  token: string;
  showToast: (message: string) => void;
  showError: (message: string) => void;
}

export const LeaveListView: React.FC<LeaveListViewProps> = ({
  leaves,
  loading,
  filteredLeaves,
  searchFilter,
  onFilterChange,
  onViewChange,
  isAdmin,
  onStatusUpdate,
  token,
  showToast,
  showError
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="m-0 text-gray-800 text-2xl">📋 All Leave Requests</h2>
      </div>

      <SearchFilter
        onFilterChange={onFilterChange}
        resultCount={filteredLeaves.length}
      />

      {loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-5">
          {[...Array(6)].map((_, i) => (
            <LeaveCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredLeaves.length === 0 ? (
        <EmptyState
          icon="leaves"
          title="No leave requests found"
          description={
            searchFilter.search || searchFilter.status
              ? 'Try adjusting your search filters'
              : 'Submit your first leave request to get started'
          }
          action={
            !searchFilter.search && !searchFilter.status
              ? { label: 'Request Leave', onClick: () => onViewChange('form') }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-5">
          {filteredLeaves.map((leave) => (
            <LeaveCard
              key={leave.id || leave._id}
              leave={leave}
              isAdmin={isAdmin}
              onStatusUpdate={onStatusUpdate}
              token={token}
              showToast={showToast}
              showError={showError}
            />
          ))}
        </div>
      )}
    </div>
  );
};
