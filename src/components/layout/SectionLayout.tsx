import React from 'react';

interface SectionLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const SectionLayout: React.FC<SectionLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const classes = [
    'bg-white rounded-lg shadow-sm border border-gray-200',
    paddingClasses[padding],
    className
  ].filter(Boolean).join(' ');

  return (
    <section className={classes}>
      {(title || subtitle || actions) && (
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              {title && (
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-gray-600 text-sm">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      {children}
    </section>
  );
};
