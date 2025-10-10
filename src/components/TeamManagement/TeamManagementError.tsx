import React from 'react';

interface TeamManagementErrorProps {
  teamsError: string;
  localError: string;
}

export const TeamManagementError: React.FC<TeamManagementErrorProps> = ({
  teamsError,
  localError
}) => {
  if (!teamsError && !localError) return null;

  return (
    <div className="p-3 bg-red-50 text-red-800 rounded-lg mb-5 border border-red-200">
      {teamsError || localError}
    </div>
  );
};
