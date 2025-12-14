import React from 'react';

const TableCard = ({
  tableNumber,
  seats,
  status = 'Available', // Available, Occupied, Reserved
  onClick,
  onStatusChange,
  onEdit,
  onMerge,
  onOpenOrder,
  loading = false
}) => {
  // TODO: Replace with actual table data from API
  // const fetchTableData = async (tableId) => {
  //   const response = await fetch(`/api/tables/${tableId}`);
  //   return response.json();
  // };

  if (loading) {
    return <TableCardSkeleton />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Occupied':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Reserved':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all hover:shadow-md relative group ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      {/* Status Badge */}
      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        {status}
      </div>

      {/* Table Content */}
      <div className="p-6 pt-12">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{tableNumber}</h3>
          <div className="flex items-center justify-center gap-1 text-gray-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-sm">{seats} Seats</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onOpenOrder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenOrder();
              }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open Order
            </button>
          )}
          {(onStatusChange || onEdit || onMerge) && (
            <div className="flex gap-2 w-full">
              {onStatusChange && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange();
                  }}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Change Status
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
export const TableCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default TableCard;

