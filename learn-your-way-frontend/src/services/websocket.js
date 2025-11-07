import { io } from 'socket.io-client';
import { storageService } from './storage';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
const RECONNECT_INTERVAL = parseInt(
  import.meta.env.VITE_WS_RECONNECT_INTERVAL || '3000',
  10
);
const MAX_RECONNECT_ATTEMPTS = parseInt(
  import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS || '5',
  10
);

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.eventHandlers = new Map();
    this.reconnectTimeout = null;
  }

  connect() {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return this.socket;
    }

    const token = storageService.getToken();

    this.socket = io(WS_URL, {
      auth: {
        token: token || ''
      },
      reconnection: true,
      reconnectionDelay: RECONNECT_INTERVAL,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_established');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_lost', { reason });

      if (reason === 'io server disconnect') {
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('connection_error', { error: error.message });

      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.reconnect();
      } else {
        this.emit('connection_failed', {
          message: 'Maximum reconnection attempts reached'
        });
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', { error: error.message });
    });

    this.socket.on('message', (data) => {
      this.emit('message', data);
    });

    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    this.socket.on('user_update', (data) => {
      this.emit('user_update', data);
    });

    this.socket.on('content_update', (data) => {
      this.emit('content_update', data);
    });

    this.socket.on('quiz_update', (data) => {
      this.emit('quiz_update', data);
    });

    this.socket.on('collaboration_update', (data) => {
      this.emit('collaboration_update', data);
    });

    this.socket.on('analytics_update', (data) => {
      this.emit('analytics_update', data);
    });

    // Dashboard-specific events
    this.socket.on('progress_update', (data) => {
      this.emit('progress_update', data);
    });

    this.socket.on('achievement_unlocked', (data) => {
      this.emit('achievement_unlocked', data);
    });

    this.socket.on('reminder', (data) => {
      this.emit('reminder', data);
    });

    this.socket.on('streak_update', (data) => {
      this.emit('streak_update', data);
    });

    this.socket.on('peer_online', (data) => {
      this.emit('peer_online', data);
    });

    this.socket.on('peer_offline', (data) => {
      this.emit('peer_offline', data);
    });

    this.socket.on('content_alert', (data) => {
      this.emit('content_alert', data);
    });
  }

  reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;

    if (this.reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
      );

      this.reconnectTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, RECONNECT_INTERVAL);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.eventHandlers.clear();
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event).add(handler);

    if (this.socket && event !== 'message' && event !== 'notification') {
      this.socket.on(event, handler);
    }

    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);

      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }

    if (this.socket?.connected && event !== 'connection_established' && event !== 'connection_lost') {
      this.socket.emit(event, data);
    }
  }

  send(event, data, callback) {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected. Cannot send message.');
      if (callback) {
        callback({ error: 'Not connected' });
      }
      return false;
    }

    this.socket.emit(event, data, callback);
    return true;
  }

  joinRoom(roomId) {
    return this.send('join_room', { roomId });
  }

  leaveRoom(roomId) {
    return this.send('leave_room', { roomId });
  }

  sendChatMessage(roomId, message) {
    return this.send('chat_message', { roomId, message });
  }

  sendCollaborationUpdate(roomId, update) {
    return this.send('collaboration_update', { roomId, update });
  }

  requestSync(roomId) {
    return this.send('request_sync', { roomId });
  }

  updateUserStatus(status) {
    return this.send('update_status', { status });
  }

  sendTypingIndicator(roomId, isTyping) {
    return this.send('typing', { roomId, isTyping });
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id || null
    };
  }

  updateAuthToken(token) {
    if (this.socket?.connected) {
      this.socket.auth = { token };
      this.socket.disconnect();
      this.connect();
    }
  }

  ping() {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const startTime = Date.now();

      this.socket.emit('ping', {}, (response) => {
        const latency = Date.now() - startTime;
        resolve({ latency, response });
      });

      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
