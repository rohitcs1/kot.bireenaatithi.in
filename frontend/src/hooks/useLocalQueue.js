import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing offline KOT orders queue
 * 
 * Stores pending orders in localStorage when offline and provides
 * methods to add, remove, and manage queue items.
 * 
 * TODO: Upgrade to IndexedDB for better storage capacity and performance
 * 
 * @param {string} queueKey - localStorage key for the queue (default: 'kot-pending-queue')
 * @returns {object} { queue, addToQueue, removeFromQueue, clearQueue, updateQueueItem, queueLength }
 * 
 * @example
 * const { queue, addToQueue, removeFromQueue } = useLocalQueue();
 * 
 * // Add order to queue
 * addToQueue({
 *   kotNumber: 'KOT-001',
 *   table: 'T-01',
 *   items: [...],
 *   timestamp: new Date()
 * });
 * 
 * @example
 * // Remove item from queue
 * removeFromQueue('KOT-001');
 * 
 * @example
 * // Clear entire queue
 * clearQueue();
 */
const useLocalQueue = (queueKey = 'kot-pending-queue') => {
  const [queue, setQueue] = useState([]);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem(queueKey);
      if (storedQueue) {
        const parsedQueue = JSON.parse(storedQueue);
        setQueue(Array.isArray(parsedQueue) ? parsedQueue : []);
      }
    } catch (error) {
      console.error('Error loading queue from localStorage:', error);
      setQueue([]);
    }
  }, [queueKey]);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving queue to localStorage:', error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Consider upgrading to IndexedDB.');
      }
    }
  }, [queue, queueKey]);

  /**
   * Add item to queue
   * @param {object} item - Item to add to queue
   * @param {string} item.id - Unique identifier (auto-generated if not provided)
   * @returns {string} - ID of the added item
   */
  const addToQueue = useCallback((item) => {
    const newItem = {
      id: item.id || `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...item,
      addedAt: item.addedAt || new Date().toISOString(),
      retryCount: item.retryCount || 0
    };

    setQueue(prevQueue => {
      // Check if item with same ID already exists
      const exists = prevQueue.find(q => q.id === newItem.id);
      if (exists) {
        console.warn('Item with ID already exists in queue:', newItem.id);
        return prevQueue;
      }
      return [...prevQueue, newItem];
    });

    // TODO: When IndexedDB is implemented, also save to IndexedDB
    // const saveToIndexedDB = async (item) => {
    //   const db = await openDB('kot-db', 1);
    //   const tx = db.transaction('pendingOrders', 'readwrite');
    //   await tx.objectStore('pendingOrders').add(item);
    // };
    // saveToIndexedDB(newItem);

    return newItem.id;
  }, []);

  /**
   * Remove item from queue by ID
   * @param {string} id - ID of item to remove
   * @returns {boolean} - True if item was removed, false if not found
   */
  const removeFromQueue = useCallback((id) => {
    setQueue(prevQueue => {
      const filtered = prevQueue.filter(item => item.id !== id);
      if (filtered.length === prevQueue.length) {
        console.warn('Item not found in queue:', id);
        return prevQueue;
      }
      return filtered;
    });

    // TODO: When IndexedDB is implemented, also remove from IndexedDB
    // const removeFromIndexedDB = async (id) => {
    //   const db = await openDB('kot-db', 1);
    //   const tx = db.transaction('pendingOrders', 'readwrite');
    //   await tx.objectStore('pendingOrders').delete(id);
    // };
    // removeFromIndexedDB(id);

    return true;
  }, []);

  /**
   * Update existing item in queue
   * @param {string} id - ID of item to update
   * @param {object} updates - Partial item data to update
   * @returns {boolean} - True if item was updated, false if not found
   */
  const updateQueueItem = useCallback((id, updates) => {
    setQueue(prevQueue => {
      const itemIndex = prevQueue.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        console.warn('Item not found in queue:', id);
        return prevQueue;
      }

      const updatedQueue = [...prevQueue];
      updatedQueue[itemIndex] = {
        ...updatedQueue[itemIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return updatedQueue;
    });

    // TODO: When IndexedDB is implemented, also update in IndexedDB
    // const updateInIndexedDB = async (id, updates) => {
    //   const db = await openDB('kot-db', 1);
    //   const tx = db.transaction('pendingOrders', 'readwrite');
    //   const store = tx.objectStore('pendingOrders');
    //   const item = await store.get(id);
    //   if (item) {
    //     await store.put({ ...item, ...updates });
    //   }
    // };
    // updateInIndexedDB(id, updates);

    return true;
  }, []);

  /**
   * Clear entire queue
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
    try {
      localStorage.removeItem(queueKey);
    } catch (error) {
      console.error('Error clearing queue from localStorage:', error);
    }

    // TODO: When IndexedDB is implemented, also clear IndexedDB
    // const clearIndexedDB = async () => {
    //   const db = await openDB('kot-db', 1);
    //   const tx = db.transaction('pendingOrders', 'readwrite');
    //   await tx.objectStore('pendingOrders').clear();
    // };
    // clearIndexedDB();
  }, [queueKey]);

  /**
   * Get item from queue by ID
   * @param {string} id - ID of item to get
   * @returns {object|null} - Item if found, null otherwise
   */
  const getQueueItem = useCallback((id) => {
    return queue.find(item => item.id === id) || null;
  }, [queue]);

  /**
   * Get queue length
   */
  const queueLength = queue.length;

  return {
    queue,
    addToQueue,
    removeFromQueue,
    updateQueueItem,
    clearQueue,
    getQueueItem,
    queueLength
  };
};

export default useLocalQueue;

