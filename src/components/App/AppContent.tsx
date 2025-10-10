import React from 'react';
import DashboardRefactored from '../DashboardRefactored';
import InteractiveCalendar from '../InteractiveCalendar';
import UserManagementRefactored from '../UserManagementRefactored';
import TeamManagementRefactored from '../TeamManagementRefactored';
import TeamLeaveSettings from '../TeamLeaveSettings';
import LeaveRequestForm from '../Leaves/LeaveRequestForm';
import { LeaveListView } from './LeaveListView';

type View = 'dashboard' | 'calendar' | 'list' | 'team' | 'teams' | 'team-settings';

interface User {
  id: string;
  name: string;
  role: string;
}

interface Leave {
  id?: string;
  _id?: string;
  employeeName: string;
  reason?: string;
  status: string;
}

interface AppContentProps {
  currentView: View;
  leaves: Leave[];
  filteredLeaves: Leave[];
  leavesLoading: boolean;
  user: User;
  token: string;
  isAdmin: boolean;
  teamMembers: any[];
  userSettings: any;
  searchFilter: { search: string; status: string };
  onViewChange: (view: View) => void;
  onLeaveUpdate: () => void;
  onRequestLeave: (startDate: Date, endDate: Date) => void;
  onStatusUpdate: (leaveId: string, status: 'approved' | 'rejected') => Promise<void>;
  onFilterChange: (filter: { search: string; status: string }) => void;
  showToast: (message: string) => void;
  showError: (message: string) => void;
}

export const AppContent: React.FC<AppContentProps> = ({
  currentView,
  leaves,
  filteredLeaves,
  leavesLoading,
  user,
  token,
  isAdmin,
  teamMembers,
  userSettings,
  searchFilter,
  onViewChange,
  onLeaveUpdate,
  onRequestLeave,
  onStatusUpdate,
  onFilterChange,
  showToast,
  showError
}) => {
  return (
    <div className="max-w-[1400px] mx-auto p-7">
      {currentView === 'dashboard' && (
        <DashboardRefactored
          leaves={leaves}
          user={user}
          token={token}
          onLeaveUpdate={onLeaveUpdate}
        />
      )}

      {currentView === 'calendar' && (
        <InteractiveCalendar
          leaves={leaves}
          user={user}
          userSettings={userSettings}
          token={token}
          teamMembers={teamMembers}
          onRefresh={onLeaveUpdate}
          showToast={showToast}
          showError={showError}
        />
      )}

      {currentView === 'list' && (
        <LeaveListView
          leaves={leaves}
          loading={leavesLoading}
          filteredLeaves={filteredLeaves}
          searchFilter={searchFilter}
          onFilterChange={onFilterChange}
          onViewChange={onViewChange}
          isAdmin={isAdmin}
          onStatusUpdate={onStatusUpdate}
          token={token}
          showToast={showToast}
          showError={showError}
          user={user}
        />
      )}

      {/* Form is now handled as a popup in the calendar */}

      {currentView === 'team' && isAdmin && (
        <UserManagementRefactored currentUser={user} token={token} />
      )}

      {currentView === 'teams' && isAdmin && (
        <TeamManagementRefactored currentUser={user} token={token} />
      )}

      {currentView === 'team-settings' && isAdmin && (
        <TeamLeaveSettings user={user} token={token} />
      )}
    </div>
  );
};
