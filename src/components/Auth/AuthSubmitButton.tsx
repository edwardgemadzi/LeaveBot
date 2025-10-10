import React from 'react';

interface AuthSubmitButtonProps {
  isRegistering: boolean;
  loading: boolean;
}

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  isRegistering,
  loading
}) => {
  const getButtonText = () => {
    if (loading) {
      return isRegistering ? 'Creating account...' : 'Logging in...';
    }
    return isRegistering ? 'Create Account' : 'Login';
  };

  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full p-3.5 text-white border-none rounded-lg cursor-pointer text-base font-semibold mb-4 ${
        loading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
      }`}
    >
      {getButtonText()}
    </button>
  );
};
