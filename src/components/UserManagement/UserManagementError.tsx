import React from 'react';

interface UserManagementErrorProps {
  error: string;
  localError: string;
}

export const UserManagementError: React.FC<UserManagementErrorProps> = ({
  error,
  localError
}) => {
  if (!error && !localError) return null;

  return (
    <div className="p-3 bg-red-50 text-red-800 rounded-lg mb-5 border border-red-200">
      {error || localError}
    </div>
  );
};
