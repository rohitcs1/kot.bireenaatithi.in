import React from 'react';

const MenuItemCard = ({
  name,
  description,
  price,
  category,
  imageUrl,
  isVeg = true,
  available = true,
  tags = [],
  onClick,
  onAddToOrder,
  onEdit,
  onDelete,
  onToggleAvailability,
  loading = false,
  viewMode = 'grid' // grid or list
}) => {
  // TODO: Replace with actual menu item data from API
  // const fetchMenuItem = async (itemId) => {
  //   const response = await fetch(`/api/menu/${itemId}`);
  //   return response.json();
  // };

  if (loading) {
    return viewMode === 'grid' ? <MenuItemCardSkeleton /> : <MenuItemRowSkeleton />;
  }

  const vegIcon = (
    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
      isVeg ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'
    }`}>
      {isVeg ? (
        <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
      ) : (
        <div className="h-1.5 w-1.5 bg-white"></div>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all ${
        !available ? 'opacity-60' : ''
      }`}>
        <div className="flex items-center gap-4">
          {/* Image */}
          <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="h-full w-full object-cover rounded" />
            ) : (
              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">{name}</h3>
              {vegIcon}
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{category}</span>
              {tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-gray-100 rounded">{tag}</span>
              ))}
            </div>
          </div>

          {/* Price & Actions */}
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-blue-600">₹{price}</span>
            <div className="flex gap-2">
              {onToggleAvailability && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAvailability();
                  }}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {available ? 'Available' : 'Unavailable'}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all ${
        !available ? 'opacity-60' : ''
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center relative">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover rounded-t-lg" />
        ) : (
          <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {/* Veg/Non-Veg Icon */}
        <div className="absolute top-2 right-2">{vegIcon}</div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-800 text-lg">{name}</h3>
          <span className="text-lg font-bold text-blue-600">₹{price}</span>
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{category}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onAddToOrder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToOrder();
              }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add to Order
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading skeletons
export const MenuItemCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="h-48 bg-gray-200 rounded-t-lg animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

export const MenuItemRowSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
};

export default MenuItemCard;

