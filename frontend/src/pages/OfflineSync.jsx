import React, { useState, useEffect } from 'react';
import './OfflineSync.css';

const OfflineSync = () => {
  const [connectionStatus, setConnectionStatus] = useState('online'); // online, offline, syncing, error
  const [lastSynced, setLastSynced] = useState(new Date(Date.now() - 5 * 60000)); // 5 minutes ago
  const [isSyncing, setIsSyncing] = useState(false);

  // Mock pending queue - TODO: Replace with IndexedDB data
  // const getPendingQueue = async () => {
  //   const db = await openDB('kot-db', 1);
  //   const tx = db.transaction('pendingOrders', 'readonly');
  //   const store = tx.objectStore('pendingOrders');
  //   return store.getAll();
  // };

  const [pendingQueue, setPendingQueue] = useState([
    {
      id: 1,
      type: 'order',
      kotNumber: 'KOT-123456',
      tableNumber: 'T-05',
      data: { items: 3, total: 1250 },
      timestamp: new Date(Date.now() - 10 * 60000), // 10 minutes ago
      retryCount: 2,
      error: null
    },
    {
      id: 2,
      type: 'order',
      kotNumber: 'KOT-123457',
      tableNumber: 'T-12',
      data: { items: 5, total: 2890 },
      timestamp: new Date(Date.now() - 25 * 60000), // 25 minutes ago
      retryCount: 5,
      error: 'Network timeout'
    },
    {
      id: 3,
      type: 'payment',
      kotNumber: 'KOT-123458',
      tableNumber: 'T-08',
      data: { amount: 1650, method: 'Cash' },
      timestamp: new Date(Date.now() - 2 * 60000), // 2 minutes ago
      retryCount: 0,
      error: null
    },
    {
      id: 4,
      type: 'order',
      kotNumber: 'KOT-123459',
      tableNumber: 'T-15',
      data: { items: 2, total: 850 },
      timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
      retryCount: 8,
      error: 'Server error: 500'
    }
  ]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (connectionStatus === 'online' && pendingQueue.length > 0) {
      // TODO: Auto-sync pending items when connection is restored
      // handleForceSync();
    }
  }, [connectionStatus]);

  // Format time ago
  const getTimeAgo = (date) => {
    const minutes = Math.floor((Date.now() - date) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  // Format last synced time
  const formatLastSynced = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle retry
  const handleRetry = async (itemId) => {
    // TODO: Replace with actual sync logic using IndexedDB and Service Worker
    // const item = pendingQueue.find(i => i.id === itemId);
    // try {
    //   await syncItem(item);
    //   // Remove from queue on success
    //   const db = await openDB('kot-db', 1);
    //   const tx = db.transaction('pendingOrders', 'readwrite');
    //   await tx.objectStore('pendingOrders').delete(itemId);
    //   setPendingQueue(pendingQueue.filter(i => i.id !== itemId));
    // } catch (error) {
    //   // Update retry count and error
    //   updateQueueItem(itemId, { retryCount: item.retryCount + 1, error: error.message });
    // }

    const item = pendingQueue.find(i => i.id === itemId);
    if (connectionStatus === 'offline') {
      alert('Cannot sync while offline. Please check your internet connection.');
      return;
    }

    setIsSyncing(true);
    setConnectionStatus('syncing');

    // Simulate sync
    setTimeout(() => {
      if (Math.random() > 0.3) { // 70% success rate
        setPendingQueue(pendingQueue.filter(i => i.id !== itemId));
        showToast('Item synced successfully!');
      } else {
        setPendingQueue(pendingQueue.map(i =>
          i.id === itemId
            ? { ...i, retryCount: i.retryCount + 1, error: 'Sync failed. Please try again.' }
            : i
        ));
        setConnectionStatus('error');
        showToast('Sync failed. Please try again.');
      }
      setIsSyncing(false);
      if (connectionStatus !== 'offline') {
        setConnectionStatus('online');
      }
    }, 1500);
  };

  // Handle force sync
  const handleForceSync = async () => {
    if (connectionStatus === 'offline') {
      alert('Cannot sync while offline. Please check your internet connection.');
      return;
    }

    setIsSyncing(true);
    setConnectionStatus('syncing');

    // TODO: Replace with actual sync logic
    // const db = await openDB('kot-db', 1);
    // const tx = db.transaction('pendingOrders', 'readonly');
    // const store = tx.objectStore('pendingOrders');
    // const items = await store.getAll();
    // 
    // for (const item of items) {
    //   try {
    //     await syncItem(item);
    //     await store.delete(item.id);
    //   } catch (error) {
    //     console.error('Sync failed for item:', item.id, error);
    //   }
    // }

    // Simulate sync
    setTimeout(() => {
      const successCount = Math.floor(pendingQueue.length * 0.7);
      const failedItems = pendingQueue.slice(successCount);
      const syncedItems = pendingQueue.slice(0, successCount);

      setPendingQueue(failedItems.map(item => ({
        ...item,
        retryCount: item.retryCount + 1,
        error: 'Sync failed during batch operation'
      })));

      setLastSynced(new Date());
      setIsSyncing(false);
      setConnectionStatus('online');
      showToast(`Synced ${syncedItems.length} items. ${failedItems.length} failed.`);
    }, 2000);
  };

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'syncing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'error':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'offline':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'syncing':
        return (
          <svg className="h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 animate-slide-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Offline & Sync Status
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 ml-12 sm:ml-0">Monitor sync status and manage offline queue</p>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 shadow-sm transition-all duration-300 ${
                connectionStatus === 'online' ? 'bg-green-50 border-green-300 text-green-700' :
                connectionStatus === 'offline' ? 'bg-red-50 border-red-300 text-red-700' :
                connectionStatus === 'syncing' ? 'bg-blue-50 border-blue-300 text-blue-700 animate-pulse' :
                'bg-yellow-50 border-yellow-300 text-yellow-700'
              }`}>
                {getStatusIcon(connectionStatus)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 capitalize">
                    {connectionStatus}
                  </h2>
                  <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                    connectionStatus === 'online' ? 'bg-green-100 text-green-700 border border-green-200' :
                    connectionStatus === 'offline' ? 'bg-red-100 text-red-700 border border-red-200' :
                    connectionStatus === 'syncing' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                    'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                    {connectionStatus === 'online' ? '✓ Connected' :
                     connectionStatus === 'offline' ? '✗ Disconnected' :
                     connectionStatus === 'syncing' ? '⟳ Syncing' :
                     '⚠ Error'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 flex flex-wrap items-center gap-1 sm:gap-2">
                  <span className="font-medium">Last synced:</span>
                  <span className="text-gray-800">{formatLastSynced(lastSynced)}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">({getTimeAgo(lastSynced)})</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleForceSync}
              disabled={isSyncing || connectionStatus === 'offline'}
              className={`group relative px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5 ${
                isSyncing || connectionStatus === 'offline'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {isSyncing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm sm:text-base">Force Sync</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Pending Queue */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">Pending Queue</h2>
                  </div>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold border border-blue-200">
                    {pendingQueue.length} {pendingQueue.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingQueue.length === 0 ? (
                  <div className="p-8 sm:p-12 md:p-16 text-center animate-fade-in">
                    <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                      <svg className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Queue is empty</h3>
                    <p className="text-sm sm:text-base text-gray-500">All items have been synced successfully</p>
                  </div>
                ) : (
                  pendingQueue.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="p-4 sm:p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-200 group animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-bold ${
                              item.type === 'order' 
                                ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200'
                            }`}>
                              {item.type.toUpperCase()}
                            </span>
                            <h3 className="font-bold text-base sm:text-lg text-gray-800">{item.kotNumber}</h3>
                            <span className="text-xs sm:text-sm text-gray-600 font-medium">Table {item.tableNumber}</span>
                          </div>
                          <div className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3 font-medium">
                            {item.type === 'order' ? (
                              <span>{item.data.items} {item.data.items === 1 ? 'item' : 'items'} • ₹{item.data.total.toLocaleString()}</span>
                            ) : (
                              <span>₹{item.data.amount.toLocaleString()} • {item.data.method}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                            <span className="text-gray-500 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {getTimeAgo(item.timestamp)}
                            </span>
                            <span className="text-gray-500 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Retries: {item.retryCount}
                            </span>
                            {item.error && (
                              <span className="text-red-600 font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {item.error}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRetry(item.id)}
                          disabled={isSyncing || connectionStatus === 'offline'}
                          className={`group/btn px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 flex-shrink-0 ${
                            isSyncing || connectionStatus === 'offline'
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'
                          }`}
                        >
                          <svg className={`h-4 w-4 sm:h-5 sm:w-5 ${isSyncing || connectionStatus === 'offline' ? '' : 'group-hover/btn:rotate-180 transition-transform duration-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-xs sm:text-sm">Retry</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* PWA Install Instructions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 animate-slide-in">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Install as App</h2>
              </div>
              <div className="space-y-4 sm:space-y-5 text-sm">
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-md transition-shadow duration-200">
                  <p className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <span className="text-blue-600">Chrome/Edge (Desktop):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2">
                    <li>Click the install icon in address bar</li>
                    <li>Or go to Menu → Install KOT System</li>
                  </ol>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:shadow-md transition-shadow duration-200">
                  <p className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <span className="text-green-600">Chrome (Android):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2">
                    <li>Tap Menu (⋮)</li>
                    <li>Select "Add to Home screen"</li>
                  </ol>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-md transition-shadow duration-200">
                  <p className="font-bold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2">
                    <span className="text-purple-600">Safari (iOS):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2">
                    <li>Tap Share button</li>
                    <li>Select "Add to Home Screen"</li>
                  </ol>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <p className="text-xs sm:text-sm text-blue-800 font-medium flex items-start gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span><strong>Note:</strong> Installing as PWA enables offline functionality and faster loading.</span>
                </p>
              </div>
            </div>

            {/* Technical Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 animate-slide-in">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Technical Details</h2>
              </div>
              <div className="space-y-4 sm:space-y-5">
                {[
                  { label: 'Storage', value: 'IndexedDB', desc: 'Local data storage for offline operations', icon: '💾' },
                  { label: 'Sync Strategy', value: 'Background Sync', desc: 'Automatic sync when connection is restored', icon: '🔄' },
                  { label: 'Service Worker', value: 'Active', desc: 'Handles offline requests and caching', icon: '⚙️' }
                ].map((item, index) => (
                  <div 
                    key={item.label}
                    className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl sm:text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">{item.label}:</p>
                        <p className="text-sm sm:text-base font-bold text-gray-800 mb-1">{item.value}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TODO Notes */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-lg border-2 border-yellow-200 p-4 sm:p-6 animate-slide-in">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="p-1.5 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-yellow-800">Implementation Notes</h2>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <p className="font-bold text-sm sm:text-base text-yellow-800">TODO:</p>
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-yellow-700 ml-2">
                  <li>Implement Service Worker for offline support</li>
                  <li>Set up IndexedDB for local data storage</li>
                  <li>Add background sync API integration</li>
                  <li>Implement queue management with retry logic</li>
                  <li>Add conflict resolution for concurrent edits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-toast-slide-in">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center gap-3 sm:gap-4 min-w-[280px] sm:min-w-[320px] max-w-[calc(100vw-2rem)] border border-white/20 backdrop-blur-sm">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm sm:text-base font-medium flex-1">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSync;

