import React from 'react';

interface User {
  role: string;
}

interface UserManagementHeaderProps {
  currentUser: User;
  onAddUser: () => void;
}

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  currentUser,
  onAddUser
}) => {
  const canAddUser = currentUser.role === 'admin' || currentUser.role === 'leader';
  const buttonText = currentUser.role === 'leader' ? 'Team Member' : 'User';

  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h2 className="text-gray-800 mb-2.5 text-2xl">👥 Team Management</h2>
        <p className="text-gray-500 text-sm">
          {currentUser.role === 'admin'
            ? 'You can manage all team members and leaders, and add new users'
            : 'You can manage and add team members to your team'}
        </p>
      </div>

      {canAddUser && (
        <button
          onClick={onAddUser}
          className="px-5 py-3 bg-emerald-500 text-white border-none rounded-lg cursor-pointer text-sm font-semibold flex items-center gap-2 shadow-sm hover:bg-emerald-600 transition-colors"
        >
          <span className="text-lg">➕</span>
          Add {buttonText}
        </button>
      )}
    </div>
  );
};
