import React from 'react';
import UserCard from './UserCard';

interface User {
  id?: string;
  _id?: string;
  name: string;
  username: string;
  role: string;
  leaveBalance?: number;
}

interface UserManagementGridProps {
  users: User[];
  currentUser: User;
  onEdit: (user: User) => void;
  onSettings: (user: User) => void;
  onChangePassword: (user: User) => void;
  onDelete: (user: User) => void;
  canManageUser: (currentUser: User, user: User) => boolean;
}

export const UserManagementGrid: React.FC<UserManagementGridProps> = ({
  users,
  currentUser,
  onEdit,
  onSettings,
  onChangePassword,
  onDelete,
  canManageUser
}) => {
  if (users.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10">
        No users found
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 mb-5">
      {users.map((user) => (
        <UserCard
          key={user.id || user._id}
          user={user}
          currentUser={currentUser}
          canManage={canManageUser(currentUser, user)}
          onEdit={() => onEdit(user)}
          onSettings={() => onSettings(user)}
          onChangePassword={() => onChangePassword(user)}
          onDelete={() => onDelete(user)}
        />
      ))}
    </div>
  );
};
