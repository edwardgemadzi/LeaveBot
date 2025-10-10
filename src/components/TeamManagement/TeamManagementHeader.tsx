import React from 'react';

interface User {
  role: string;
}

interface TeamManagementHeaderProps {
  currentUser: User;
  onCreateTeam: () => void;
}

export const TeamManagementHeader: React.FC<TeamManagementHeaderProps> = ({
  currentUser,
  onCreateTeam
}) => {
  return (
    <div className="mb-8 flex justify-between items-center">
      <div>
        <h2 className="text-gray-800 mb-2.5 text-2xl">🏢 Team Management</h2>
        <p className="text-gray-500 text-sm">
          {currentUser.role === 'admin'
            ? 'Manage all teams, assign leaders, and organize members'
            : 'Manage your team and its members'}
        </p>
      </div>

      {currentUser.role === 'admin' && (
        <button
          onClick={onCreateTeam}
          className="px-5 py-3 bg-emerald-500 text-white border-none rounded-lg cursor-pointer text-sm font-semibold flex items-center gap-2 shadow-sm hover:bg-emerald-600 transition-colors"
        >
          <span className="text-lg">➕</span>
          Create Team
        </button>
      )}
    </div>
  );
};
