import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for swipe gestures
 * @param {Object} options - Configuration options
 * @param {Function} options.onSwipeLeft - Callback when swiping left
 * @param {Function} options.onSwipeRight - Callback when swiping right
 * @param {Function} options.onSwipeUp - Callback when swiping up
 * @param {Function} options.onSwipeDown - Callback when swiping down
 * @param {number} options.minSwipeDistance - Minimum distance for swipe (default: 50px)
 * @param {number} options.maxSwipeTime - Maximum time for swipe (default: 300ms)
 * @returns {Object} Event handlers to attach to element
 */
export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  maxSwipeTime = 300
} = {}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartTime, setTouchStartTime] = useState(null);

  const onTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
    setTouchStartTime(Date.now());
  }, []);

  const onTouchMove = useCallback((e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const swipeTime = Date.now() - touchStartTime;
    if (swipeTime > maxSwipeTime) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (Math.abs(distanceX) > minSwipeDistance) {
        if (distanceX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    } else {
      if (Math.abs(distanceY) > minSwipeDistance) {
        if (distanceY > 0) {
          onSwipeUp?.();
        } else {
          onSwipeDown?.();
        }
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartTime(null);
  }, [touchStart, touchEnd, touchStartTime, minSwipeDistance, maxSwipeTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

/**
 * Custom hook for pull-to-refresh gesture
 * @param {Function} onRefresh - Callback when refresh is triggered
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Pull distance threshold (default: 80px)
 * @param {number} options.resistance - Pull resistance factor (default: 2.5)
 * @returns {Object} Pull-to-refresh state and handlers
 */
export const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80,
    resistance = 2.5
  } = options;

  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);

  const handleTouchStart = useCallback((e) => {
    // Only allow pull-to-refresh when scrolled to top
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop === 0) {
      setCanPull(true);
      touchStartY.current = e.targetTouches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!canPull || isRefreshing) return;

    touchCurrentY.current = e.targetTouches[0].clientY;
    const distance = touchCurrentY.current - touchStartY.current;

    if (distance > 0) {
      // Apply resistance to pull distance
      const adjustedDistance = distance / resistance;
      setPullDistance(Math.min(adjustedDistance, threshold * 1.5));
      
      // Prevent default scroll behavior when pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [canPull, isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!canPull || isRefreshing) return;

    setCanPull(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  }, [canPull, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    // Reset pull distance when refreshing completes
    if (!isRefreshing && pullDistance > 0) {
      const timer = setTimeout(() => setPullDistance(0), 300);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, pullDistance]);

  return {
    pullDistance,
    isRefreshing,
    isPulling: pullDistance > 0,
    isReady: pullDistance >= threshold,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};

/**
 * Custom hook for long press gesture
 * @param {Function} onLongPress - Callback when long press is detected
 * @param {Object} options - Configuration options
 * @param {number} options.delay - Long press duration (default: 500ms)
 * @param {Function} options.onClick - Optional click callback for short press
 * @returns {Object} Event handlers to attach to element
 */
export const useLongPress = (onLongPress, options = {}) => {
  const {
    delay = 500,
    onClick
  } = options;

  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);

  const start = useCallback((e) => {
    e.preventDefault();
    isLongPressRef.current = false;
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsLongPress(true);
      onLongPress?.(e);
      
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, delay);
  }, [delay, onLongPress]);

  const clear = useCallback((e) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isLongPressRef.current && onClick) {
      onClick(e);
    }

    setIsLongPress(false);
    isLongPressRef.current = false;
  }, [onClick]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLongPress(false);
    isLongPressRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    isLongPress,
    handlers: {
      onMouseDown: start,
      onMouseUp: clear,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: clear,
      onTouchCancel: cancel
    }
  };
};

/**
 * Custom hook for pinch-to-zoom gesture
 * @param {Object} options - Configuration options
 * @param {number} options.minScale - Minimum zoom scale (default: 0.5)
 * @param {number} options.maxScale - Maximum zoom scale (default: 3)
 * @param {number} options.step - Zoom step for programmatic zoom (default: 0.1)
 * @returns {Object} Zoom state and handlers
 */
export const usePinchZoom = (options = {}) => {
  const {
    minScale = 0.5,
    maxScale = 3,
    step = 0.1
  } = options;

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastDistance = useRef(0);
  const lastCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);

  const getDistance = useCallback((touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      isPinching.current = true;
      lastDistance.current = getDistance(e.touches);
      lastCenter.current = getCenter(e.touches);
    }
  }, [getDistance, getCenter]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && isPinching.current) {
      e.preventDefault();

      const distance = getDistance(e.touches);
      const center = getCenter(e.touches);
      
      if (lastDistance.current > 0) {
        const scaleChange = distance / lastDistance.current;
        const newScale = Math.min(Math.max(scale * scaleChange, minScale), maxScale);
        
        // Calculate position adjustment to zoom towards pinch center
        const scaleDelta = newScale - scale;
        const containerRect = e.currentTarget.getBoundingClientRect();
        const centerX = (center.x - containerRect.left) / containerRect.width;
        const centerY = (center.y - containerRect.top) / containerRect.height;
        
        setScale(newScale);
        setPosition(prev => ({
          x: prev.x - (centerX - 0.5) * scaleDelta * containerRect.width,
          y: prev.y - (centerY - 0.5) * scaleDelta * containerRect.height
        }));
      }

      lastDistance.current = distance;
      lastCenter.current = center;
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan when zoomed in
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastCenter.current.x;
      const deltaY = touch.clientY - lastCenter.current.y;
      
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      lastCenter.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [scale, minScale, maxScale, getDistance, getCenter]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      isPinching.current = false;
      lastDistance.current = 0;
    }
    if (e.touches.length === 1) {
      lastCenter.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  }, []);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + step, maxScale));
  }, [step, maxScale]);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - step, minScale));
  }, [step, minScale]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    scale,
    position,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    zoomIn,
    zoomOut,
    resetZoom,
    isZoomed: scale !== 1
  };
};

/**
 * Custom hook for detecting touch device
 * @returns {boolean} Whether device supports touch
 */
export const useIsTouch = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  return isTouch;
};

/**
 * Custom hook for preventing default scroll behavior
 * @param {RefObject} ref - Element ref to prevent scroll on
 * @param {boolean} enabled - Whether to prevent scroll
 */
export const usePreventScroll = (ref, enabled = true) => {
  useEffect(() => {
    if (!ref.current || !enabled) return;

    const element = ref.current;
    
    const preventDefault = (e) => {
      e.preventDefault();
    };

    element.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      element.removeEventListener('touchmove', preventDefault);
    };
  }, [ref, enabled]);
};

export default {
  useSwipe,
  usePullToRefresh,
  useLongPress,
  usePinchZoom,
  useIsTouch,
  usePreventScroll
};
