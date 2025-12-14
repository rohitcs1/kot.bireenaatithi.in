import React from 'react';

const NotificationItem = ({
  type = 'info', // Order Ready, Printer Error, Low Stock, info
  title,
  message,
  timestamp,
  read = false,
  priority = 'medium', // high, medium, low
  onClick,
  onMarkAsRead,
  loading = false
}) => {
  // TODO: Replace with actual notification data from API
  // const markNotificationAsRead = async (notificationId) => {
  //   const response = await fetch(`/api/notifications/${notificationId}/read`, {
  //     method: 'PUT',
  //   });
  //   return response.json();
  // };

  if (loading) {
    return <NotificationItemSkeleton />;
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'Order Ready':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Printer Error':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'Low Stock':
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
    }
  };

  const getNotificationColor = (type, priority) => {
    if (type === 'Printer Error') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (type === 'Order Ready') {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (type === 'Low Stock') {
      return priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Just now';
    const minutes = Math.floor((Date.now() - new Date(date)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all ${
        read
          ? 'border-gray-200 opacity-75'
          : 'border-blue-300 bg-blue-50'
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-3 rounded-lg ${getNotificationColor(type, priority)}`}>
          {getNotificationIcon(type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-800">{title}</h3>
                {!read && (
                  <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{message}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {timestamp && <span>{formatTimeAgo(timestamp)}</span>}
                <span className={`px-2 py-0.5 rounded ${
                  priority === 'high' ? 'bg-red-100 text-red-800' :
                  priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {priority}
                </span>
              </div>
            </div>

            {/* Actions */}
            {!read && onMarkAsRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                }}
                className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
                title="Mark as read"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
export const NotificationItemSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;

