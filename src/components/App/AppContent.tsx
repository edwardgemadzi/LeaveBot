import React from 'react';
import AdminPage from '../AdminPage';
import LeaderPage from '../LeaderPage';
import UserPage from '../UserPage';

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

interface Team {
  _id: string;
  id?: string;
  name: string;
  leaderId?: string;
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
  teams?: Team[];
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
  teams = [],
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
  // Render role-specific pages
  if (user.role === 'admin') {
    return (
      <AdminPage
        user={user}
        token={token}
        currentView={currentView as 'dashboard' | 'list' | 'teams' | 'team' | 'team-settings'}
        onViewChange={onViewChange as (view: 'dashboard' | 'list' | 'teams' | 'team' | 'team-settings') => void}
      />
    );
  }

  if (user.role === 'leader') {
    return (
      <LeaderPage
        user={user}
        token={token}
        currentView={currentView as 'dashboard' | 'calendar' | 'list' | 'team'}
        onViewChange={onViewChange as (view: 'dashboard' | 'calendar' | 'list' | 'team') => void}
      />
    );
  }

  if (user.role === 'user') {
    return (
      <UserPage
        user={user}
        token={token}
        currentView={currentView as 'dashboard' | 'calendar' | 'list'}
        onViewChange={onViewChange as (view: 'dashboard' | 'calendar' | 'list') => void}
      />
    );
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Unknown Role</h2>
        <p className="text-gray-600">Your role is not recognized. Please contact an administrator.</p>
      </div>
    </div>
  );
};