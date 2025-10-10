import React from 'react';

interface FormLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  children,
  title,
  description,
  actions,
  className = ''
}) => {
  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {(title || description) && (
        <div className="mb-8 text-center">
          {title && (
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form className="space-y-6">
          {children}
        </form>
        
        {actions && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
