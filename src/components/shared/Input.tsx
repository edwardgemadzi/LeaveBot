import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  required = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const inputClasses = [
    'w-full px-3 py-2 border rounded-lg text-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
    error 
      ? 'border-red-300 bg-red-50' 
      : 'border-gray-300 bg-white hover:border-gray-400',
    props.disabled ? 'bg-gray-100 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};
