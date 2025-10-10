import React from 'react';
import { AppHeader } from './AppHeader';
import { AppNavigation } from './AppNavigation';
import { AppContent } from './AppContent';
import UserProfileModal from '../UserProfileModal';
import { ToastContainer, Toast as ToastType } from '../Toast';

type View = 'dashboard' | 'calendar' | 'list' | 'form' | 'team' | 'teams' | 'team-settings';

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


interface AppLayoutProps {
  user: User;
  currentView: View;
  leaves: Leave[];
  filteredLeaves: Leave[];
  leavesLoading: boolean;
  isAdmin: boolean;
  teamMembers: any[];
  requestDates: { startDate: Date; endDate: Date } | null;
  userSettings: any;
  searchFilter: { search: string; status: string };
  showProfileSettings: boolean;
  toasts: ToastType[];
  onViewChange: (view: View) => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onLeaveUpdate: () => void;
  onRequestLeave: (startDate: Date, endDate: Date) => void;
  onStatusUpdate: (leaveId: string, status: 'approved' | 'rejected') => Promise<void>;
  onFilterChange: (filter: { search: string; status: string }) => void;
  onFormSuccess: () => void;
  onFormCancel: () => void;
  onCloseProfileSettings: () => void;
  onCloseToast: (id: string) => void;
  showToast: (message: string) => void;
  showError: (message: string) => void;
  token: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  currentView,
  leaves,
  filteredLeaves,
  leavesLoading,
  isAdmin,
  teamMembers,
  requestDates,
  userSettings,
  searchFilter,
  showProfileSettings,
  toasts,
  onViewChange,
  onSettingsClick,
  onLogout,
  onLeaveUpdate,
  onRequestLeave,
  onStatusUpdate,
  onFilterChange,
  onFormSuccess,
  onFormCancel,
  onCloseProfileSettings,
  onCloseToast,
  showToast,
  showError,
  token
}) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <ToastContainer toasts={toasts} onClose={onCloseToast} />

      <AppHeader
        userName={user.name}
        onSettingsClick={onSettingsClick}
        onLogout={onLogout}
      />

      <AppNavigation
        currentView={currentView}
        onViewChange={onViewChange}
        isAdmin={isAdmin}
      />

      <AppContent
        currentView={currentView}
        leaves={leaves}
        filteredLeaves={filteredLeaves}
        leavesLoading={leavesLoading}
        user={user}
        token={token}
        isAdmin={isAdmin}
        teamMembers={teamMembers}
        requestDates={requestDates}
        userSettings={userSettings}
        searchFilter={searchFilter}
        onViewChange={onViewChange}
        onLeaveUpdate={onLeaveUpdate}
        onRequestLeave={onRequestLeave}
        onStatusUpdate={onStatusUpdate}
        onFilterChange={onFilterChange}
        onFormSuccess={onFormSuccess}
        onFormCancel={onFormCancel}
        showToast={showToast}
        showError={showError}
      />

      {showProfileSettings && (
        <UserProfileModal
          isOpen={true}
          onClose={onCloseProfileSettings}
          user={user}
          token={token}
          onSuccess={() => {
            showToast('Settings updated successfully!');
            onCloseProfileSettings();
            onLeaveUpdate();
          }}
        />
      )}
    </div>
  );
};
