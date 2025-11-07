import React, { Suspense, lazy } from 'react';
import { CircularProgress, Box } from '@mui/material';

/**
 * Lazy load component with retry logic
 * @param {Function} importFunc - Dynamic import function
 * @param {number} retries - Number of retry attempts (default: 3)
 * @returns {React.Component} Lazy loaded component
 */
export const lazyWithRetry = (importFunc, retries = 3) => {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const retry = (n) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (n === 1) {
              reject(error);
              return;
            }
            console.warn(`Failed to load component, retrying... (${retries - n + 1}/${retries})`);
            setTimeout(() => retry(n - 1), 1000);
          });
      };
      retry(retries);
    });
  });
};

/**
 * Default loading component for lazy loaded routes
 */
export const LoadingFallback = ({ minHeight = '100vh' }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight,
      width: '100%'
    }}
  >
    <CircularProgress />
  </Box>
);

/**
 * Wrap component with Suspense and custom fallback
 * @param {React.Component} Component - Component to wrap
 * @param {React.Component} fallback - Custom loading component
 * @returns {React.Component} Wrapped component
 */
export const withSuspense = (Component, fallback = <LoadingFallback />) => {
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

/**
 * Preload component for faster navigation
 * @param {Function} importFunc - Dynamic import function
 */
export const preloadComponent = (importFunc) => {
  importFunc();
};

/**
 * Custom hook for debouncing values
 * @param {any} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for throttling function calls
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Throttle delay in milliseconds
 * @returns {Function} Throttled function
 */
export const useThrottle = (callback, delay = 300) => {
  const lastRun = React.useRef(Date.now());

  return React.useCallback(
    (...args) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    },
    [callback, delay]
  );
};

/**
 * Custom hook for intersection observer (lazy loading images)
 * @param {Object} options - IntersectionObserver options
 * @returns {Array} [ref, isIntersecting]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options, hasIntersected]);

  return [ref, isIntersecting, hasIntersected];
};

/**
 * Lazy Image component with loading placeholder
 */
export const LazyImage = ({
  src,
  alt,
  placeholder,
  className,
  style,
  onLoad,
  ...props
}) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder || null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [ref, , hasIntersected] = useIntersectionObserver();

  React.useEffect(() => {
    if (hasIntersected && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
        onLoad?.();
      };
      img.onerror = () => {
        setIsLoading(false);
      };
    }
  }, [hasIntersected, src, onLoad]);

  return (
    <img
      ref={ref}
      src={imageSrc || placeholder}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: isLoading ? 0.6 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}
      loading="lazy"
      {...props}
    />
  );
};

/**
 * Custom hook for measuring component performance
 * @param {string} componentName - Name of component to measure
 */
export const usePerformanceMonitor = (componentName) => {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16.67) { // Slower than 60fps
        console.warn(
          `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (>16.67ms threshold)`
        );
      }

      // Send to analytics if needed
      if (window.gtag) {
        window.gtag('event', 'component_render', {
          component_name: componentName,
          render_time: renderTime,
          performance_category: renderTime > 100 ? 'slow' : renderTime > 50 ? 'medium' : 'fast'
        });
      }
    };
  }, [componentName]);
};

/**
 * Custom hook for prefetching data on hover
 * @param {Function} fetchFunction - Function to fetch data
 * @param {boolean} enabled - Whether prefetch is enabled
 * @returns {Object} Event handlers
 */
export const usePrefetch = (fetchFunction, enabled = true) => {
  const prefetched = React.useRef(false);
  const timeoutRef = React.useRef(null);

  const handleMouseEnter = React.useCallback(() => {
    if (!enabled || prefetched.current) return;

    timeoutRef.current = setTimeout(() => {
      fetchFunction();
      prefetched.current = true;
    }, 200);
  }, [fetchFunction, enabled]);

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  };
};

/**
 * Image optimization helper
 * @param {string} src - Original image source
 * @param {Object} options - Optimization options
 * @returns {string} Optimized image URL
 */
export const optimizeImage = (src, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'webp'
  } = options;

  // If using a CDN or image service, append optimization parameters
  // Example for Cloudinary, ImageKit, etc.
  const url = new URL(src, window.location.origin);
  
  if (width) url.searchParams.set('w', width);
  if (height) url.searchParams.set('h', height);
  if (quality) url.searchParams.set('q', quality);
  if (format) url.searchParams.set('f', format);

  return url.toString();
};

/**
 * Batch API requests to reduce network calls
 * @param {Array} requests - Array of request functions
 * @param {number} batchSize - Number of requests per batch
 * @param {number} delay - Delay between batches (ms)
 * @returns {Promise} Promise resolving to all results
 */
export const batchRequests = async (requests, batchSize = 5, delay = 100) => {
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(request => request())
    );
    results.push(...batchResults);
    
    // Delay between batches to avoid overwhelming the server
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
};

/**
 * Memoize expensive calculations
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Function to generate cache key
 * @returns {Function} Memoized function
 */
export const memoize = (fn, keyGenerator = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  return (...args) => {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
};

/**
 * Web Worker utility for offloading heavy computations
 * @param {Function} workerFunction - Function to run in worker
 * @param {any} data - Data to pass to worker
 * @returns {Promise} Promise resolving to worker result
 */
export const runInWorker = (workerFunction, data) => {
  return new Promise((resolve, reject) => {
    const blob = new Blob(
      [`self.onmessage = ${workerFunction.toString()}`],
      { type: 'application/javascript' }
    );
    
    const worker = new Worker(URL.createObjectURL(blob));
    
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    
    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };
    
    worker.postMessage(data);
  });
};

/**
 * RequestIdleCallback wrapper with fallback
 * @param {Function} callback - Function to run during idle time
 * @param {Object} options - RequestIdleCallback options
 */
export const scheduleIdleTask = (callback, options = {}) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  } else {
    // Fallback for Safari
    return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 1);
  }
};

/**
 * Cancel scheduled idle task
 * @param {number} id - Task ID from scheduleIdleTask
 */
export const cancelIdleTask = (id) => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

export default {
  lazyWithRetry,
  LoadingFallback,
  withSuspense,
  preloadComponent,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  LazyImage,
  usePerformanceMonitor,
  usePrefetch,
  optimizeImage,
  batchRequests,
  memoize,
  runInWorker,
  scheduleIdleTask,
  cancelIdleTask
};
