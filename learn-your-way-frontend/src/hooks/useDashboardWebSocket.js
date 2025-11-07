import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import WebSocketService from '../services/websocket';
import {
  setWsConnected,
  setWsError,
  updateProgress,
  addAchievement,
  addNotification,
  updateStreak,
  updateStudyTime,
  addActivityFeedItem,
  updateEngagement,
} from '../store/slices/dashboardSlice';
import { showToast } from '../store/slices/uiSlice';

/**
 * Custom hook for managing Dashboard WebSocket connection
 * Handles real-time updates for progress, achievements, notifications, etc.
 */
export const useDashboardWebSocket = (userId) => {
  const dispatch = useDispatch();
  const { wsConnected } = useSelector((state) => state.dashboard);
  const wsService = useRef(WebSocketService);
  const handlersRegistered = useRef(false);

  // Handle progress updates from backend
  const handleProgressUpdate = useCallback(
    (data) => {
      dispatch(updateProgress(data.payload));
      dispatch(
        addActivityFeedItem({
          type: 'progress',
          data: data.payload,
        })
      );
    },
    [dispatch]
  );

  // Handle achievement unlocked
  const handleAchievementUnlocked = useCallback(
    (data) => {
      dispatch(addAchievement(data.payload));
      dispatch(
        showToast({
          type: 'success',
          message: `Achievement Unlocked: ${data.payload.name}`,
          duration: 5000,
        })
      );
    },
    [dispatch]
  );

  // Handle reminders (spaced repetition, upcoming reviews)
  const handleReminder = useCallback(
    (data) => {
      dispatch(
        addNotification({
          type: 'reminder',
          title: data.payload.title,
          message: data.payload.message,
          priority: data.payload.priority || 'medium',
        })
      );
      dispatch(
        showToast({
          type: 'info',
          message: data.payload.message,
          duration: 4000,
        })
      );
    },
    [dispatch]
  );

  // Handle streak updates
  const handleStreakUpdate = useCallback(
    (data) => {
      dispatch(updateStreak(data.payload.streak));
      if (data.payload.newRecord) {
        dispatch(
          showToast({
            type: 'success',
            message: `New streak record: ${data.payload.streak} days! 🔥`,
            duration: 5000,
          })
        );
      }
    },
    [dispatch]
  );

  // Handle peer online status
  const handlePeerOnline = useCallback(
    (data) => {
      dispatch(
        addActivityFeedItem({
          type: 'peer_online',
          data: data.payload,
        })
      );
    },
    [dispatch]
  );

  // Handle peer offline status
  const handlePeerOffline = useCallback(
    (data) => {
      dispatch(
        addActivityFeedItem({
          type: 'peer_offline',
          data: data.payload,
        })
      );
    },
    [dispatch]
  );

  // Handle new content alerts
  const handleContentAlert = useCallback(
    (data) => {
      dispatch(
        addNotification({
          type: 'content',
          title: 'New Content Available',
          message: data.payload.message,
          priority: 'low',
        })
      );
    },
    [dispatch]
  );

  // Handle connection established
  const handleConnectionEstablished = useCallback(() => {
    dispatch(setWsConnected(true));
    console.log('Dashboard WebSocket connected');
  }, [dispatch]);

  // Handle connection lost
  const handleConnectionLost = useCallback(
    (data) => {
      dispatch(setWsConnected(false));
      console.log('Dashboard WebSocket disconnected:', data.reason);
    },
    [dispatch]
  );

  // Handle connection error
  const handleConnectionError = useCallback(
    (data) => {
      dispatch(setWsError(data.error));
      console.error('Dashboard WebSocket error:', data.error);
    },
    [dispatch]
  );

  // Handle connection failed
  const handleConnectionFailed = useCallback(
    (data) => {
      dispatch(setWsError(data.message));
      dispatch(
        showToast({
          type: 'error',
          message: 'Failed to connect to real-time updates',
          duration: 5000,
        })
      );
    },
    [dispatch]
  );

  // Register all event handlers
  const registerEventHandlers = useCallback(() => {
    if (handlersRegistered.current) return;

    // Dashboard-specific events
    wsService.current.on('progress_update', handleProgressUpdate);
    wsService.current.on('achievement_unlocked', handleAchievementUnlocked);
    wsService.current.on('reminder', handleReminder);
    wsService.current.on('streak_update', handleStreakUpdate);
    wsService.current.on('peer_online', handlePeerOnline);
    wsService.current.on('peer_offline', handlePeerOffline);
    wsService.current.on('content_alert', handleContentAlert);

    // Connection events
    wsService.current.on('connection_established', handleConnectionEstablished);
    wsService.current.on('connection_lost', handleConnectionLost);
    wsService.current.on('connection_error', handleConnectionError);
    wsService.current.on('connection_failed', handleConnectionFailed);

    handlersRegistered.current = true;
  }, [
    handleProgressUpdate,
    handleAchievementUnlocked,
    handleReminder,
    handleStreakUpdate,
    handlePeerOnline,
    handlePeerOffline,
    handleContentAlert,
    handleConnectionEstablished,
    handleConnectionLost,
    handleConnectionError,
    handleConnectionFailed,
  ]);

  // Unregister all event handlers
  const unregisterEventHandlers = useCallback(() => {
    if (!handlersRegistered.current) return;

    wsService.current.off('progress_update', handleProgressUpdate);
    wsService.current.off('achievement_unlocked', handleAchievementUnlocked);
    wsService.current.off('reminder', handleReminder);
    wsService.current.off('streak_update', handleStreakUpdate);
    wsService.current.off('peer_online', handlePeerOnline);
    wsService.current.off('peer_offline', handlePeerOffline);
    wsService.current.off('content_alert', handleContentAlert);
    wsService.current.off('connection_established', handleConnectionEstablished);
    wsService.current.off('connection_lost', handleConnectionLost);
    wsService.current.off('connection_error', handleConnectionError);
    wsService.current.off('connection_failed', handleConnectionFailed);

    handlersRegistered.current = false;
  }, [
    handleProgressUpdate,
    handleAchievementUnlocked,
    handleReminder,
    handleStreakUpdate,
    handlePeerOnline,
    handlePeerOffline,
    handleContentAlert,
    handleConnectionEstablished,
    handleConnectionLost,
    handleConnectionError,
    handleConnectionFailed,
  ]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!userId) return;

    registerEventHandlers();
    wsService.current.connect();

    // Join user-specific room for dashboard updates
    if (wsService.current.isConnected) {
      wsService.current.joinRoom(`dashboard_${userId}`);
    }

    // Cleanup on unmount
    return () => {
      unregisterEventHandlers();
      if (wsService.current.isConnected) {
        wsService.current.leaveRoom(`dashboard_${userId}`);
      }
    };
  }, [userId, registerEventHandlers, unregisterEventHandlers]);

  // Send study time update
  const sendStudyTimeUpdate = useCallback(
    (minutes) => {
      if (wsService.current.isConnected && userId) {
        wsService.current.sendMessage(`dashboard_${userId}`, {
          type: 'study_time_update',
          payload: { minutes },
        });
        dispatch(updateStudyTime(minutes / 60)); // Convert to hours
      }
    },
    [userId, dispatch]
  );

  // Send engagement update
  const sendEngagementUpdate = useCallback(
    (engagementData) => {
      if (wsService.current.isConnected && userId) {
        wsService.current.sendMessage(`dashboard_${userId}`, {
          type: 'engagement_update',
          payload: engagementData,
        });
        dispatch(updateEngagement(engagementData));
      }
    },
    [userId, dispatch]
  );

  return {
    wsConnected,
    sendStudyTimeUpdate,
    sendEngagementUpdate,
    connect: () => wsService.current.connect(),
    disconnect: () => wsService.current.disconnect(),
  };
};

export default useDashboardWebSocket;
