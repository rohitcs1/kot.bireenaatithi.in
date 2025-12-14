import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * 
 * Monitors browser's online/offline events and provides current status
 * 
 * @returns {object} { isOnline, wasOffline }
 * 
 * @example
 * const { isOnline, wasOffline } = useOnlineStatus();
 * 
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * 
 * @example
 * // Show sync notification when coming back online
 * const { isOnline, wasOffline } = useOnlineStatus();
 * 
 * useEffect(() => {
 *   if (isOnline && wasOffline) {
 *     syncPendingOrders();
 *   }
 * }, [isOnline, wasOffline]);
 */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    // Handle online event
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
      // Reset wasOffline flag after a short delay
      setTimeout(() => {
        setWasOffline(false);
      }, 1000);

      // TODO: Trigger sync when coming back online
      // if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      //   // Trigger background sync
      //   navigator.serviceWorker.ready.then(registration => {
      //     registration.sync.register('sync-orders');
      //   });
      // }
    };

    // Handle offline event
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
      
      // TODO: Show offline notification
      // showNotification('You are now offline. Changes will be synced when connection is restored.');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
};

export default useOnlineStatus;

