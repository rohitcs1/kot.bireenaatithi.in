import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  hover = false,
  onClick,
  loading = false
}) => {
  // TODO: Add data fetching logic if needed
  // const fetchCardData = async () => {
  //   const response = await fetch('/api/card-data');
  //   return response.json();
  // };

  if (loading) {
    return <CardSkeleton />;
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle || headerAction) && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && <div className="p-6 border-t border-gray-200">{footer}</div>}
    </div>
  );
};

// Loading skeleton
export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default Card;

