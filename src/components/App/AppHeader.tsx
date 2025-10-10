import React from 'react';

interface AppHeaderProps {
  userName: string;
  userRole: string;
  onSettingsClick: () => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  userRole,
  onSettingsClick,
  onLogout
}) => {
  return (
    <div className="bg-white border-b border-slate-200 py-5 px-7">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center">
        <div>
          <h1 className="m-0 mb-1 text-[28px] text-gray-800">🌴 LeaveBot</h1>
          <p className="m-0 text-slate-500 text-sm">Welcome back, {userName}!</p>
        </div>

        <div className="flex gap-2.5 items-center">
          {/* Only show Settings button for users and team leaders (not admins) */}
          {userRole !== 'admin' && (
            <button
              onClick={onSettingsClick}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium"
            >
              ⚙️ Settings
            </button>
          )}
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
