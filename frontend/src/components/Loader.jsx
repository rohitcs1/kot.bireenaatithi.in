import React from 'react';

const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className={`spinner ${sizeClasses[size]}`}></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`spinner ${sizeClasses[size]}`}></div>
    </div>
  );
};

export default Loader;

