import { useState, useEffect } from 'react';

/**
 * Custom hook for detecting online/offline status
 * @returns {Object} Online status and connection info
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [offlineDuration, setOfflineDuration] = useState(0);
  const [offlineStartTime, setOfflineStartTime] = useState(null);

  useEffect(() => {
    const handleOnline = () => {
      const now = Date.now();
      if (offlineStartTime) {
        const duration = Math.floor((now - offlineStartTime) / 1000);
        setOfflineDuration(duration);
      }
      setIsOnline(true);
      setWasOffline(true);
      setOfflineStartTime(null);

      // Reset wasOffline flag after 5 seconds
      setTimeout(() => setWasOffline(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineStartTime(Date.now());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineStartTime]);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    offlineDuration,
    connectionType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || null
  };
};

/**
 * Custom hook for service worker management
 * @returns {Object} Service worker state and controls
 */
export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);

      // Check if service worker is already registered
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          setIsRegistered(true);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          });
        }
      });
    }
  }, []);

  const register = async () => {
    if (!isSupported) {
      console.warn('Service workers are not supported');
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      setIsRegistered(true);
      setRegistration(reg);
      console.log('Service worker registered:', reg);
      return reg;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  };

  const unregister = async () => {
    if (registration) {
      const success = await registration.unregister();
      if (success) {
        setIsRegistered(false);
        setRegistration(null);
      }
      return success;
    }
    return false;
  };

  const update = async () => {
    if (registration) {
      await registration.update();
    }
  };

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    registration,
    register,
    unregister,
    update,
    applyUpdate
  };
};

/**
 * Custom hook for caching content offline
 * @returns {Object} Cache management functions
 */
export const useOfflineCache = () => {
  const [cacheSize, setCacheSize] = useState(0);
  const [cachedItems, setCachedItems] = useState([]);

  useEffect(() => {
    updateCacheInfo();
  }, []);

  const updateCacheInfo = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        const items = [];

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          
          for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
              const blob = await response.blob();
              totalSize += blob.size;
              items.push({
                url: request.url,
                size: blob.size,
                cache: cacheName
              });
            }
          }
        }

        setCacheSize(totalSize);
        setCachedItems(items);
      } catch (error) {
        console.error('Failed to get cache info:', error);
      }
    }
  };

  const cacheUrls = async (urls) => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      console.warn('Service worker not available for caching');
      return false;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
        updateCacheInfo();
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CACHE_URLS', urls },
        [messageChannel.port2]
      );
    });
  };

  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        setCacheSize(0);
        setCachedItems([]);
        return true;
      } catch (error) {
        console.error('Failed to clear cache:', error);
        return false;
      }
    }
    return false;
  };

  const removeCachedItem = async (url) => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          await cache.delete(url);
        }
        
        await updateCacheInfo();
        return true;
      } catch (error) {
        console.error('Failed to remove cached item:', error);
        return false;
      }
    }
    return false;
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return {
    cacheSize,
    formattedCacheSize: formatSize(cacheSize),
    cachedItems,
    cacheUrls,
    clearCache,
    removeCachedItem,
    updateCacheInfo
  };
};

/**
 * Custom hook for syncing data when back online
 * @param {Function} syncFunction - Function to call when syncing
 * @returns {Object} Sync state and controls
 */
export const useOfflineSync = (syncFunction) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueue, setSyncQueue] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    // Load sync queue from localStorage
    const savedQueue = localStorage.getItem('offline-sync-queue');
    if (savedQueue) {
      try {
        setSyncQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Failed to parse sync queue:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save sync queue to localStorage
    localStorage.setItem('offline-sync-queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  useEffect(() => {
    // Auto-sync when coming back online
    if (isOnline && syncQueue.length > 0 && !isSyncing) {
      syncData();
    }
  }, [isOnline, syncQueue.length]);

  const addToQueue = (item) => {
    setSyncQueue(prev => [...prev, {
      ...item,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    }]);
  };

  const syncData = async () => {
    if (syncQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);

    try {
      const results = await Promise.allSettled(
        syncQueue.map(item => syncFunction(item))
      );

      const failed = [];
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failed.push(syncQueue[index]);
        }
      });

      // Keep failed items in queue
      setSyncQueue(failed);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const clearQueue = () => {
    setSyncQueue([]);
    localStorage.removeItem('offline-sync-queue');
  };

  return {
    isSyncing,
    syncQueue,
    queueLength: syncQueue.length,
    lastSyncTime,
    addToQueue,
    syncData,
    clearQueue
  };
};

/**
 * Custom hook for storing data in IndexedDB
 * @param {string} dbName - Database name
 * @param {string} storeName - Store name
 * @returns {Object} IndexedDB operations
 */
export const useIndexedDB = (dbName = 'learn-your-way-db', storeName = 'offline-data') => {
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const openDB = async () => {
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not supported');
        return;
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          setDb(request.result);
          setIsReady(true);
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        };
      });
    };

    openDB().catch(error => {
      console.error('Failed to open IndexedDB:', error);
    });

    return () => {
      if (db) {
        db.close();
      }
    };
  }, [dbName, storeName]);

  const add = async (data) => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const get = async (id) => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const getAll = async () => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const update = async (data) => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  };

  const remove = async (id) => {
    if (!db) return false;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  };

  const clear = async () => {
    if (!db) return false;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  };

  return {
    isReady,
    add,
    get,
    getAll,
    update,
    remove,
    clear
  };
};

export default {
  useOnlineStatus,
  useServiceWorker,
  useOfflineCache,
  useOfflineSync,
  useIndexedDB
};
