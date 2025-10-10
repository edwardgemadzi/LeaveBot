import React from 'react';

interface AuthFormFieldProps {
  label: string;
  type: 'text' | 'password' | 'email';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  helpText?: string;
}

export const AuthFormField: React.FC<AuthFormFieldProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  minLength,
  helpText
}) => {
  return (
    <div className="mb-5">
      <label className="block mb-2 text-gray-700 font-medium">
        {label} {required && '*'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {helpText && (
        <p className="text-xs text-gray-500 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
};
