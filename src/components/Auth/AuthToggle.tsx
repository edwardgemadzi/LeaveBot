import React from 'react';

interface AuthToggleProps {
  isRegistering: boolean;
  loading: boolean;
  onToggle: () => void;
}

export const AuthToggle: React.FC<AuthToggleProps> = ({
  isRegistering,
  loading,
  onToggle
}) => {
  return (
    <div className="text-center">
      <button
        onClick={onToggle}
        disabled={loading}
        className={`bg-none border-none text-indigo-500 cursor-pointer text-sm font-medium underline ${
          loading ? 'cursor-not-allowed' : 'hover:text-indigo-600'
        }`}
      >
        {isRegistering
          ? 'Already have an account? Login'
          : "Don't have an account? Register"}
      </button>
    </div>
  );
};
