import React from 'react';

interface AuthErrorProps {
  error: string;
  localError: string;
}

export const AuthError: React.FC<AuthErrorProps> = ({ error, localError }) => {
  if (!error && !localError) return null;

  return (
    <div className="p-3 bg-red-50 text-red-800 rounded-lg mb-5 border border-red-200 text-sm">
      {error || localError}
    </div>
  );
};
