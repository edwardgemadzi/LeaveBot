import React from 'react';

interface AuthHeaderProps {
  isRegistering: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ isRegistering }) => {
  return (
    <div className="text-center mb-8">
      <h1 className="m-0 mb-2.5 text-3xl bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
        🌴 LeaveBot
      </h1>
      <p className="m-0 text-gray-500 text-base">
        {isRegistering ? 'Create your account' : 'Welcome back!'}
      </p>
    </div>
  );
};
