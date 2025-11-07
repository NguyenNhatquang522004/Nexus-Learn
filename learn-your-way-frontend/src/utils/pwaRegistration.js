/**
 * PWA Registration and Update Management
 * Handles service worker lifecycle and provides update notifications
 */

/**
 * Register service worker and handle updates
 * @param {Object} config - Configuration options
 * @param {Function} config.onSuccess - Callback on successful registration
 * @param {Function} config.onUpdate - Callback when update is available
 * @param {Function} config.onError - Callback on registration error
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function register(config = {}) {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }

  // Only register service worker in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !config.forceRegister) {
    console.log('Service worker registration skipped in development mode');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('Service worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available');
            config.onUpdate?.(registration);
            
            // Show update notification
            showUpdateNotification(registration);
          } else {
            // Service worker installed for the first time
            console.log('Service worker installed successfully');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    // Check for updates every 15 minutes
    setInterval(() => {
      registration.update();
    }, 15 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    config.onError?.(error);
    return null;
  }
}

/**
 * Unregister service worker
 * @returns {Promise<boolean>}
 */
export async function unregister() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      const success = await registration.unregister();
      console.log('Service worker unregistered:', success);
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to unregister service worker:', error);
    return false;
  }
}

/**
 * Check if service worker is registered
 * @returns {Promise<boolean>}
 */
export async function isRegistered() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return !!registration;
  } catch (error) {
    console.error('Failed to check service worker registration:', error);
    return false;
  }
}

/**
 * Update service worker to latest version
 * @returns {Promise<void>}
 */
export async function update() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      await registration.update();
      console.log('Service worker update check completed');
    }
  } catch (error) {
    console.error('Failed to update service worker:', error);
  }
}

/**
 * Skip waiting and activate new service worker immediately
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 */
export function skipWaiting(registration) {
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Show update notification to user
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 */
function showUpdateNotification(registration) {
  // Dispatch custom event that UI components can listen to
  window.dispatchEvent(new CustomEvent('swUpdate', {
    detail: { registration }
  }));

  // Store update state in localStorage for persistent notification
  localStorage.setItem('sw-update-available', 'true');
}

/**
 * Clear update notification state
 */
export function clearUpdateNotification() {
  localStorage.removeItem('sw-update-available');
}

/**
 * Check if update is available
 * @returns {boolean}
 */
export function isUpdateAvailable() {
  return localStorage.getItem('sw-update-available') === 'true';
}

/**
 * Request push notification permission
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported in this browser');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Subscribe to push notifications
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 * @param {string} vapidPublicKey - VAPID public key
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPush(registration, vapidPublicKey) {
  if (!registration) {
    console.error('Service worker registration required');
    return null;
  }

  try {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    console.log('Push subscription successful:', subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 * @returns {Promise<boolean>}
 */
export async function unsubscribeFromPush(registration) {
  if (!registration) {
    return false;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const success = await subscription.unsubscribe();
      console.log('Push unsubscription successful:', success);
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Check if push notifications are supported
 * @returns {boolean}
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

/**
 * Get current push subscription
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 * @returns {Promise<PushSubscription|null>}
 */
export async function getPushSubscription(registration) {
  if (!registration) {
    return null;
  }

  try {
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 * @param {string} base64String - Base64 encoded VAPID key
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Check if app is running as PWA
 * @returns {boolean}
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

/**
 * Check if app is installable
 * @returns {boolean}
 */
export function isInstallable() {
  return 'beforeinstallprompt' in window;
}

/**
 * Prompt user to install PWA
 * @param {Event} deferredPrompt - Deferred install prompt event
 * @returns {Promise<{outcome: string}|null>}
 */
export async function promptInstall(deferredPrompt) {
  if (!deferredPrompt) {
    console.warn('Install prompt not available');
    return null;
  }

  try {
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    console.log('Install prompt result:', choiceResult.outcome);
    return choiceResult;
  } catch (error) {
    console.error('Failed to show install prompt:', error);
    return null;
  }
}

/**
 * Listen for install prompt event
 * @param {Function} callback - Callback to handle install prompt
 * @returns {Function} Cleanup function
 */
export function onInstallPrompt(callback) {
  const handler = (e) => {
    e.preventDefault();
    callback(e);
  };

  window.addEventListener('beforeinstallprompt', handler);

  return () => {
    window.removeEventListener('beforeinstallprompt', handler);
  };
}

/**
 * Listen for app installed event
 * @param {Function} callback - Callback to handle app installed
 * @returns {Function} Cleanup function
 */
export function onAppInstalled(callback) {
  const handler = () => {
    console.log('PWA installed successfully');
    callback();
  };

  window.addEventListener('appinstalled', handler);

  return () => {
    window.removeEventListener('appinstalled', handler);
  };
}

/**
 * Get PWA display mode
 * @returns {string} Display mode (fullscreen, standalone, minimal-ui, browser)
 */
export function getDisplayMode() {
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    return 'fullscreen';
  }
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

/**
 * Track PWA analytics
 */
export function trackPWAAnalytics() {
  // Track display mode
  const displayMode = getDisplayMode();
  console.log('PWA Display Mode:', displayMode);

  // Track installation status
  if (isPWA()) {
    console.log('Running as PWA');
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'pwa_launch', {
        display_mode: displayMode
      });
    }
  }

  // Listen for display mode changes
  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  mediaQuery.addEventListener('change', (e) => {
    const newMode = e.matches ? 'standalone' : 'browser';
    console.log('Display mode changed:', newMode);
    
    if (window.gtag) {
      window.gtag('event', 'display_mode_change', {
        new_mode: newMode
      });
    }
  });
}

export default {
  register,
  unregister,
  isRegistered,
  update,
  skipWaiting,
  clearUpdateNotification,
  isUpdateAvailable,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSupported,
  getPushSubscription,
  isPWA,
  isInstallable,
  promptInstall,
  onInstallPrompt,
  onAppInstalled,
  getDisplayMode,
  trackPWAAnalytics
};
