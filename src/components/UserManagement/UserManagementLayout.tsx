import React from 'react';
import { UserManagementHeader } from './UserManagementHeader';
import { UserManagementError } from './UserManagementError';
import { UserManagementGrid } from './UserManagementGrid';
import { UserManagementModals } from './UserManagementModals';

interface User {
  id?: string;
  _id?: string;
  name: string;
  username: string;
  role: string;
  leaveBalance?: number;
}

interface Team {
  _id: string;
  id?: string;
  name: string;
  leaderId?: string;
}

interface UserManagementLayoutProps {
  currentUser: User;
  users: User[];
  teams?: Team[];
  error: string;
  localError: string;
  showAddModal: boolean;
  editingUser: User | null;
  changingPasswordUser: User | null;
  settingsUser: User | null;
  token: string;
  onAddUser: () => void;
  onEdit: (user: User) => void;
  onSettings: (user: User) => void;
  onChangePassword: (user: User) => void;
  onDelete: (user: User) => void;
  onCloseAddModal: () => void;
  onCloseEditModal: () => void;
  onClosePasswordModal: () => void;
  onCloseSettingsModal: () => void;
  onAddUserSubmit: (userData: any) => Promise<{ success: boolean; error?: string }>;
  onUpdateUserSubmit: (userId: string, data: any) => Promise<{ success: boolean; error?: string }>;
  onChangePasswordSubmit: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRefetch: () => void;
  canManageUser: (currentUser: User, user: User) => boolean;
}

export const UserManagementLayout: React.FC<UserManagementLayoutProps> = ({
  currentUser,
  users,
  teams = [],
  error,
  localError,
  showAddModal,
  editingUser,
  changingPasswordUser,
  settingsUser,
  token,
  onAddUser,
  onEdit,
  onSettings,
  onChangePassword,
  onDelete,
  onCloseAddModal,
  onCloseEditModal,
  onClosePasswordModal,
  onCloseSettingsModal,
  onAddUserSubmit,
  onUpdateUserSubmit,
  onChangePasswordSubmit,
  onRefetch,
  canManageUser
}) => {
  return (
    <div className="p-5">
      <UserManagementHeader
        currentUser={currentUser}
        onAddUser={onAddUser}
      />

      <UserManagementError
        error={error}
        localError={localError}
      />

      <UserManagementGrid
        users={users}
        currentUser={currentUser}
        onEdit={onEdit}
        onSettings={onSettings}
        onChangePassword={onChangePassword}
        onDelete={onDelete}
        canManageUser={canManageUser}
      />

      <UserManagementModals
        showAddModal={showAddModal}
        editingUser={editingUser}
        changingPasswordUser={changingPasswordUser}
        settingsUser={settingsUser}
        currentUser={currentUser}
        token={token}
        teams={teams}
        onCloseAddModal={onCloseAddModal}
        onCloseEditModal={onCloseEditModal}
        onClosePasswordModal={onClosePasswordModal}
        onCloseSettingsModal={onCloseSettingsModal}
        onAddUser={onAddUserSubmit}
        onUpdateUser={onUpdateUserSubmit}
        onChangePassword={onChangePasswordSubmit}
        onRefetch={onRefetch}
      />
    </div>
  );
};
