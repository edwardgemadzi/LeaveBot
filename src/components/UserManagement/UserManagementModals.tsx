import React from 'react';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import ChangePasswordModal from './ChangePasswordModal';
import UserProfileModal from '../UserProfileModal';

interface User {
  id?: string;
  _id?: string;
  name: string;
  username: string;
  role: string;
}

interface UserManagementModalsProps {
  showAddModal: boolean;
  editingUser: User | null;
  changingPasswordUser: User | null;
  settingsUser: User | null;
  currentUser: User;
  token: string;
  onCloseAddModal: () => void;
  onCloseEditModal: () => void;
  onClosePasswordModal: () => void;
  onCloseSettingsModal: () => void;
  onAddUser: (userData: any) => Promise<{ success: boolean; error?: string }>;
  onUpdateUser: (userId: string, data: any) => Promise<{ success: boolean; error?: string }>;
  onChangePassword: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRefetch: () => void;
}

export const UserManagementModals: React.FC<UserManagementModalsProps> = ({
  showAddModal,
  editingUser,
  changingPasswordUser,
  settingsUser,
  currentUser,
  token,
  onCloseAddModal,
  onCloseEditModal,
  onClosePasswordModal,
  onCloseSettingsModal,
  onAddUser,
  onUpdateUser,
  onChangePassword,
  onRefetch
}) => {
  return (
    <>
      <AddUserModal
        isOpen={showAddModal}
        onClose={onCloseAddModal}
        onSubmit={onAddUser}
        currentUserRole={currentUser.role}
      />

      {editingUser && (
        <EditUserModal
          isOpen={true}
          onClose={onCloseEditModal}
          user={editingUser}
          onSubmit={onUpdateUser}
          currentUserRole={currentUser.role}
        />
      )}

      {changingPasswordUser && (
        <ChangePasswordModal
          isOpen={true}
          onClose={onClosePasswordModal}
          user={changingPasswordUser}
          onSubmit={onChangePassword}
        />
      )}

      {settingsUser && (
        <UserProfileModal
          isOpen={true}
          onClose={onCloseSettingsModal}
          user={settingsUser}
          token={token}
          onSuccess={() => {
            onRefetch();
            onCloseSettingsModal();
          }}
        />
      )}
    </>
  );
};
