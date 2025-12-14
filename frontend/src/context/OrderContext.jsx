import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Create Order Context
const OrderContext = createContext(null);

/**
 * OrderContext Provider
 * 
 * Manages current order cart state, items, and calculations.
 * Provides methods to add, update, remove items and calculate totals.
 * 
 * @example
 * // Wrap your app with OrderProvider
 * <OrderProvider>
 *   <App />
 * </OrderProvider>
 * 
 * @example
 * // Use in components
 * const { cart, addItem, updateQty, removeItem, subtotal, total } = useOrder();
 */
export const OrderProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percentage'
  const [serviceCharge, setServiceCharge] = useState(0);
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18); // 18% GST

  /**
   * Add item to cart
   * @param {object} item - Item to add
   * @param {string} item.id - Item ID
   * @param {string} item.name - Item name
   * @param {number} item.price - Item price
   * @param {number} item.quantity - Item quantity (default: 1)
   * @param {string} item.notes - Item notes
   * @param {boolean} item.isVeg - Whether item is vegetarian
   */
  const addItem = useCallback((item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id && cartItem.notes === (item.notes || ''));
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevCart.map(cartItem =>
          cartItem.id === item.id && cartItem.notes === (item.notes || '')
            ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
            : cartItem
        );
      } else {
        // Add new item
        return [...prevCart, {
          ...item,
          quantity: item.quantity || 1,
          notes: item.notes || '',
          addedAt: new Date().toISOString()
        }];
      }
    });
  }, []);

  /**
   * Update item quantity
   * @param {string} itemId - Item ID
   * @param {number} quantity - New quantity
   */
  const updateQty = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  /**
   * Remove item from cart
   * @param {string} itemId - Item ID to remove
   */
  const removeItem = useCallback((itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  }, []);

  /**
   * Clear entire cart
   */
  const clearOrder = useCallback(() => {
    setCart([]);
    setDiscount(0);
    setServiceChargeEnabled(false);
    setServiceCharge(0);
  }, []);

  /**
   * Update item notes
   * @param {string} itemId - Item ID
   * @param {string} notes - New notes
   */
  const updateItemNotes = useCallback((itemId, notes) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? { ...item, notes }
          : item
      )
    );
  }, []);

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'flat') {
      return discount;
    } else {
      return (subtotal * discount) / 100;
    }
  }, [discount, discountType, subtotal]);

  const afterDiscount = useMemo(() => {
    return subtotal - discountAmount;
  }, [subtotal, discountAmount]);

  const serviceChargeAmount = useMemo(() => {
    return serviceChargeEnabled ? (afterDiscount * serviceCharge) / 100 : 0;
  }, [serviceChargeEnabled, serviceCharge, afterDiscount]);

  const gst = useMemo(() => {
    return (afterDiscount + serviceChargeAmount) * (gstRate / 100);
  }, [afterDiscount, serviceChargeAmount, gstRate]);

  const total = useMemo(() => {
    return afterDiscount + serviceChargeAmount + gst;
  }, [afterDiscount, serviceChargeAmount, gst]);

  const itemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const value = {
    // State
    cart,
    discount,
    discountType,
    serviceCharge,
    serviceChargeEnabled,
    gstRate,
    
    // Actions
    addItem,
    updateQty,
    removeItem,
    clearOrder,
    updateItemNotes,
    setDiscount,
    setDiscountType,
    setServiceCharge,
    setServiceChargeEnabled,
    setGstRate,
    
    // Calculated values
    subtotal,
    discountAmount,
    afterDiscount,
    serviceChargeAmount,
    gst,
    total,
    itemCount
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

/**
 * Custom hook to use OrderContext
 * @returns {object} - Order context value
 * @throws {Error} - If used outside OrderProvider
 */
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export default OrderContext;

