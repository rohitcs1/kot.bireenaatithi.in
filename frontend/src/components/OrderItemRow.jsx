import React from 'react';

const OrderItemRow = ({
  name,
  quantity,
  price,
  notes = '',
  isVeg = true,
  onQuantityChange,
  onNotesChange,
  onRemove,
  loading = false
}) => {
  // TODO: Replace with actual order item data from API
  // const updateOrderItem = async (itemId, data) => {
  //   const response = await fetch(`/api/orders/items/${itemId}`, {
  //     method: 'PUT',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(data),
  //   });
  //   return response.json();
  // };

  if (loading) {
    return <OrderItemRowSkeleton />;
  }

  const total = price * quantity;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-800">{name}</h3>
            <div className={`h-3 w-3 rounded-full border ${
              isVeg ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'
            }`}></div>
          </div>
          <p className="text-sm text-gray-600 mb-2">₹{price} each</p>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 transition-colors"
            aria-label="Remove item"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Quantity Stepper */}
      {onQuantityChange && (
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => onQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="w-12 text-center font-semibold">{quantity}</span>
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className="h-8 w-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <span className="ml-auto text-sm font-semibold text-gray-800">
            ₹{total.toFixed(2)}
          </span>
        </div>
      )}

      {/* Notes */}
      {onNotesChange && (
        <textarea
          placeholder="Add notes (e.g., no onions, extra spicy)"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      )}
    </div>
  );
};

// Loading skeleton
export const OrderItemRowSkeleton = () => {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="animate-pulse space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default OrderItemRow;

