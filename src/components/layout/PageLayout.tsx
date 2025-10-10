import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = ''
}) => {
  return (
    <div className={`p-6 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-gray-600 text-sm">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};
