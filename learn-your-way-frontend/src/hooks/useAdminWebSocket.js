import { useEffect, useRef, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  setRealtimeConnection,
  updateRealtimeMetric,
  updateAgentStatus,
  addErrorLog,
  addSystemAlert
} from '../store/slices/adminSlice';
import { getWebSocketURL, subscribeToMetrics, unsubscribeFromMetrics } from '../services/adminService';

/**
 * Custom hook for admin real-time WebSocket connection
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * @param {number} options.reconnectDelay - Reconnect delay in ms (default: 3000)
 * @param {number} options.maxReconnectAttempts - Max reconnection attempts (default: 5)
 * @param {Array<string>} options.subscribeToMetrics - Metrics to subscribe to
 * @returns {Object} WebSocket connection state and controls
 */
export const useAdminWebSocket = (options = {}) => {
  const {
    autoConnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    subscribeToMetrics: initialMetrics = [
      'system.health',
      'agents.status',
      'api.latency',
      'content.submissions',
      'user.activity',
      'errors'
    ]
  } = options;

  const dispatch = useDispatch();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [subscribedMetrics, setSubscribedMetrics] = useState(initialMetrics);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'metric_update':
          dispatch(updateRealtimeMetric({
            metric: message.metric,
            data: message.data
          }));
          break;
          
        case 'agent_status':
          dispatch(updateAgentStatus(message.data));
          break;
          
        case 'error_log':
          dispatch(addErrorLog(message.data));
          break;
          
        case 'system_alert':
          dispatch(addSystemAlert(message.data));
          break;
          
        case 'content_submission':
          // Trigger content queue refresh
          window.dispatchEvent(new CustomEvent('admin:content_queue_update', {
            detail: message.data
          }));
          break;
          
        case 'user_activity':
          // Trigger user activity update
          window.dispatchEvent(new CustomEvent('admin:user_activity', {
            detail: message.data
          }));
          break;
          
        case 'subscription_confirmed':
          console.log('[WS] Subscription confirmed:', message.metrics);
          break;
          
        case 'pong':
          // Heartbeat response
          break;
          
        default:
          console.warn('[WS] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[WS] Failed to parse message:', error);
    }
  }, [dispatch]);

  /**
   * Handle WebSocket connection open
   */
  const handleOpen = useCallback(() => {
    console.log('[WS] Connected to admin WebSocket');
    setIsConnected(true);
    setConnectionError(null);
    reconnectAttemptsRef.current = 0;
    dispatch(setRealtimeConnection(true));
    
    // Subscribe to metrics
    if (wsRef.current && subscribedMetrics.length > 0) {
      subscribeToMetrics(wsRef.current, subscribedMetrics);
    }
  }, [dispatch, subscribedMetrics]);

  /**
   * Handle WebSocket connection close
   */
  const handleClose = useCallback((event) => {
    console.log('[WS] Disconnected from admin WebSocket:', event.code, event.reason);
    setIsConnected(false);
    dispatch(setRealtimeConnection(false));
    
    // Attempt reconnection
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current += 1;
      console.log(
        `[WS] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
      );
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, reconnectDelay);
    } else {
      console.error('[WS] Max reconnection attempts reached');
      setConnectionError('Failed to reconnect to server');
    }
  }, [dispatch, maxReconnectAttempts, reconnectDelay]);

  /**
   * Handle WebSocket errors
   */
  const handleError = useCallback((error) => {
    console.error('[WS] WebSocket error:', error);
    setConnectionError('WebSocket connection error');
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.warn('[WS] Already connected');
      return;
    }

    try {
      const wsUrl = getWebSocketURL();
      const token = localStorage.getItem('token');
      const urlWithAuth = token ? `${wsUrl}?token=${token}` : wsUrl;
      
      console.log('[WS] Connecting to:', wsUrl);
      wsRef.current = new WebSocket(urlWithAuth);
      
      wsRef.current.onopen = handleOpen;
      wsRef.current.onclose = handleClose;
      wsRef.current.onerror = handleError;
      wsRef.current.onmessage = handleMessage;
    } catch (error) {
      console.error('[WS] Failed to create WebSocket connection:', error);
      setConnectionError(error.message);
    }
  }, [handleOpen, handleClose, handleError, handleMessage]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent reconnection
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    dispatch(setRealtimeConnection(false));
    reconnectAttemptsRef.current = 0;
  }, [dispatch]);

  /**
   * Subscribe to additional metrics
   */
  const subscribe = useCallback((metrics) => {
    if (!Array.isArray(metrics)) {
      metrics = [metrics];
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      subscribeToMetrics(wsRef.current, metrics);
      setSubscribedMetrics(prev => [...new Set([...prev, ...metrics])]);
    } else {
      console.warn('[WS] Cannot subscribe - not connected');
    }
  }, []);

  /**
   * Unsubscribe from metrics
   */
  const unsubscribe = useCallback((metrics) => {
    if (!Array.isArray(metrics)) {
      metrics = [metrics];
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      unsubscribeFromMetrics(wsRef.current, metrics);
      setSubscribedMetrics(prev => prev.filter(m => !metrics.includes(m)));
    } else {
      console.warn('[WS] Cannot unsubscribe - not connected');
    }
  }, []);

  /**
   * Send custom message to server
   */
  const send = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WS] Cannot send message - not connected');
    }
  }, []);

  /**
   * Send heartbeat ping
   */
  const ping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // Only run on mount/unmount

  // Heartbeat interval
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      ping();
    }, 30000); // Ping every 30 seconds

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [isConnected, ping]);

  return {
    isConnected,
    connectionError,
    subscribedMetrics,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send,
    ping
  };
};

/**
 * Hook for listening to specific admin events
 * @param {string} eventType - Event type to listen for
 * @param {Function} callback - Callback function
 */
export const useAdminEvent = (eventType, callback) => {
  useEffect(() => {
    const handler = (event) => {
      callback(event.detail);
    };

    window.addEventListener(`admin:${eventType}`, handler);

    return () => {
      window.removeEventListener(`admin:${eventType}`, handler);
    };
  }, [eventType, callback]);
};

/**
 * Hook for subscribing to agent status updates
 * @param {string} agentName - Agent name to monitor
 * @param {Function} callback - Callback with agent status
 */
export const useAgentStatus = (agentName, callback) => {
  const { subscribe, unsubscribe, isConnected } = useAdminWebSocket({
    autoConnect: false
  });

  useEffect(() => {
    if (!isConnected || !agentName) return;

    const metric = `agents.status.${agentName}`;
    subscribe(metric);

    const handler = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'agent_status' && message.data.name === agentName) {
        callback(message.data);
      }
    };

    window.addEventListener('message', handler);

    return () => {
      unsubscribe(metric);
      window.removeEventListener('message', handler);
    };
  }, [agentName, isConnected, subscribe, unsubscribe, callback]);
};

/**
 * Hook for monitoring system alerts
 * @param {Object} options - Filter options
 * @param {Function} callback - Callback with new alert
 */
export const useSystemAlerts = (options = {}, callback) => {
  const { severity, acknowledged } = options;

  useAdminEvent('system_alert', (alert) => {
    // Filter alerts based on options
    if (severity && alert.severity !== severity) return;
    if (acknowledged !== undefined && alert.acknowledged !== acknowledged) return;

    callback(alert);
  });
};

/**
 * Hook for monitoring error logs
 * @param {Object} filters - Filter options (level, agentName)
 * @param {Function} callback - Callback with new error log
 */
export const useErrorLogs = (filters = {}, callback) => {
  const { level, agentName } = filters;

  useAdminEvent('error_log', (log) => {
    // Filter logs based on options
    if (level && log.level !== level) return;
    if (agentName && log.agentName !== agentName) return;

    callback(log);
  });
};

/**
 * Hook for monitoring content submissions
 * @param {Function} callback - Callback with new submission
 */
export const useContentSubmissions = (callback) => {
  useAdminEvent('content_queue_update', callback);
};

/**
 * Hook for monitoring user activity
 * @param {Function} callback - Callback with activity data
 */
export const useUserActivity = (callback) => {
  useAdminEvent('user_activity', callback);
};

export default useAdminWebSocket;
