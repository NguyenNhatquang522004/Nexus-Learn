import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { realtimeService, analyticsService } from '../../services/api';

// Async thunks

// Create a new study room
export const createRoom = createAsyncThunk(
  'collaboration/createRoom',
  async (roomData, { rejectWithValue }) => {
    try {
      const response = await realtimeService.createRoom(roomData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Join an existing room
export const joinRoom = createAsyncThunk(
  'collaboration/joinRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await realtimeService.joinRoom(roomId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Leave current room
export const leaveRoom = createAsyncThunk(
  'collaboration/leaveRoom',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await realtimeService.leaveRoom(roomId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get room details
export const fetchRoomDetails = createAsyncThunk(
  'collaboration/fetchRoomDetails',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await realtimeService.getRoomDetails(roomId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get user presence
export const fetchUserPresence = createAsyncThunk(
  'collaboration/fetchUserPresence',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await realtimeService.getUserPresence(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Broadcast message to room
export const broadcastMessage = createAsyncThunk(
  'collaboration/broadcastMessage',
  async ({ roomId, message }, { rejectWithValue }) => {
    try {
      const response = await realtimeService.broadcastToRoom(roomId, message);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch leaderboard
export const fetchLeaderboard = createAsyncThunk(
  'collaboration/fetchLeaderboard',
  async ({ roomId, filter = 'all' }, { rejectWithValue }) => {
    try {
      const response = await realtimeService.getLeaderboard(roomId, filter);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Submit quiz answer in room
export const submitSharedAnswer = createAsyncThunk(
  'collaboration/submitSharedAnswer',
  async ({ roomId, questionId, answer, mode }, { rejectWithValue }) => {
    try {
      const response = await realtimeService.submitAnswer(roomId, {
        questionId,
        answer,
        mode
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Track collaborative event
export const trackCollaborativeEvent = createAsyncThunk(
  'collaboration/trackEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      await analyticsService.trackEvent({
        ...eventData,
        category: 'collaboration'
      });
      return eventData;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update ready status
export const updateReadyStatus = createAsyncThunk(
  'collaboration/updateReadyStatus',
  async ({ roomId, isReady }, { rejectWithValue }) => {
    try {
      const response = await realtimeService.updateReadyStatus(roomId, isReady);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Start room session
export const startRoomSession = createAsyncThunk(
  'collaboration/startSession',
  async (roomId, { rejectWithValue }) => {
    try {
      const response = await realtimeService.startSession(roomId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  // Current room state
  roomId: null,
  roomName: null,
  roomTopic: null,
  roomPrivacy: 'public', // 'public' | 'private'
  maxParticipants: 10,
  scheduledTime: null,
  hostId: null,
  roomStatus: 'idle', // 'idle' | 'lobby' | 'active' | 'ended'
  sessionStartTime: null,
  sessionDuration: 0,
  
  // Participants
  participants: [],
  myParticipantId: null,
  participantCount: 0,
  readyParticipants: [],
  allReady: false,
  
  // Chat
  messages: [],
  unreadCount: 0,
  typingUsers: [],
  
  // Presence
  presence: {}, // userId -> { status, lastSeen, currentView, cursor }
  cursors: {}, // userId -> { x, y, timestamp }
  highlights: [], // Shared highlights across users
  
  // Quiz collaboration
  quizMode: null, // 'team' | 'competitive' | null
  currentQuestion: null,
  teamAnswers: {}, // participantId -> answer
  teamVotes: {}, // answer -> count
  consensusAnswer: null,
  individualScores: {}, // participantId -> score
  teamScore: 0,
  
  // Leaderboard
  leaderboard: [],
  leaderboardFilter: 'all', // 'all' | 'today' | 'week'
  myPosition: null,
  
  // Whiteboard
  whiteboardState: {
    drawings: [],
    activeTool: 'pen',
    color: '#000000',
    thickness: 2
  },
  
  // WebSocket
  wsConnected: false,
  wsError: null,
  reconnecting: false,
  reconnectAttempts: 0,
  
  // Shared state
  sharedContent: null,
  sharedContentType: null, // 'document' | 'quiz' | 'mindmap'
  contentSyncVersion: 0,
  
  // UI state
  chatOpen: true,
  videoCallActive: false,
  whiteboardOpen: false,
  showLeaderboard: false,
  
  // Loading states
  loading: {
    createRoom: false,
    joinRoom: false,
    leaveRoom: false,
    fetchRoom: false,
    fetchPresence: false,
    broadcast: false,
    leaderboard: false,
    submitAnswer: false,
    startSession: false
  },
  
  error: null
};

const collaborationSlice = createSlice({
  name: 'collaboration',
  initialState,
  reducers: {
    // WebSocket connection management
    setWsConnected: (state, action) => {
      state.wsConnected = action.payload;
      if (action.payload) {
        state.reconnectAttempts = 0;
        state.reconnecting = false;
        state.wsError = null;
      }
    },
    
    setWsError: (state, action) => {
      state.wsError = action.payload;
      state.wsConnected = false;
    },
    
    setReconnecting: (state, action) => {
      state.reconnecting = action.payload;
    },
    
    incrementReconnectAttempts: (state) => {
      state.reconnectAttempts += 1;
    },
    
    // Participant management
    addParticipant: (state, action) => {
      const participant = action.payload;
      if (!state.participants.find(p => p.id === participant.id)) {
        state.participants.push(participant);
        state.participantCount = state.participants.length;
      }
    },
    
    removeParticipant: (state, action) => {
      const userId = action.payload;
      state.participants = state.participants.filter(p => p.id !== userId);
      state.participantCount = state.participants.length;
      
      // Remove from ready list
      state.readyParticipants = state.readyParticipants.filter(id => id !== userId);
      state.allReady = state.readyParticipants.length === state.participants.length;
      
      // Remove presence
      delete state.presence[userId];
      delete state.cursors[userId];
    },
    
    updateParticipant: (state, action) => {
      const { userId, updates } = action.payload;
      const participant = state.participants.find(p => p.id === userId);
      if (participant) {
        Object.assign(participant, updates);
      }
    },
    
    setParticipantReady: (state, action) => {
      const { userId, isReady } = action.payload;
      if (isReady && !state.readyParticipants.includes(userId)) {
        state.readyParticipants.push(userId);
      } else if (!isReady) {
        state.readyParticipants = state.readyParticipants.filter(id => id !== userId);
      }
      state.allReady = state.readyParticipants.length === state.participants.length;
    },
    
    // Chat management
    addMessage: (state, action) => {
      const message = {
        ...action.payload,
        timestamp: action.payload.timestamp || new Date().toISOString()
      };
      state.messages.push(message);
      
      // Increment unread count if chat is closed
      if (!state.chatOpen && message.userId !== state.myParticipantId) {
        state.unreadCount += 1;
      }
    },
    
    clearMessages: (state) => {
      state.messages = [];
      state.unreadCount = 0;
    },
    
    markMessagesRead: (state) => {
      state.unreadCount = 0;
    },
    
    setTypingUser: (state, action) => {
      const { userId, isTyping } = action.payload;
      if (isTyping && !state.typingUsers.includes(userId)) {
        state.typingUsers.push(userId);
      } else if (!isTyping) {
        state.typingUsers = state.typingUsers.filter(id => id !== userId);
      }
    },
    
    // Presence management
    updatePresence: (state, action) => {
      const { userId, presence } = action.payload;
      state.presence[userId] = {
        ...state.presence[userId],
        ...presence,
        lastSeen: new Date().toISOString()
      };
    },
    
    updateCursor: (state, action) => {
      const { userId, position } = action.payload;
      state.cursors[userId] = {
        ...position,
        timestamp: new Date().toISOString()
      };
    },
    
    removeCursor: (state, action) => {
      const userId = action.payload;
      delete state.cursors[userId];
    },
    
    addSharedHighlight: (state, action) => {
      const highlight = action.payload;
      if (!state.highlights.find(h => h.id === highlight.id)) {
        state.highlights.push(highlight);
      }
    },
    
    removeSharedHighlight: (state, action) => {
      const highlightId = action.payload;
      state.highlights = state.highlights.filter(h => h.id !== highlightId);
    },
    
    // Quiz collaboration
    setQuizMode: (state, action) => {
      state.quizMode = action.payload;
      state.teamAnswers = {};
      state.teamVotes = {};
      state.consensusAnswer = null;
    },
    
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
      state.teamAnswers = {};
      state.teamVotes = {};
      state.consensusAnswer = null;
    },
    
    submitTeamAnswer: (state, action) => {
      const { participantId, answer } = action.payload;
      state.teamAnswers[participantId] = answer;
    },
    
    voteForAnswer: (state, action) => {
      const { participantId, answer } = action.payload;
      // Remove previous vote
      Object.keys(state.teamVotes).forEach(ans => {
        if (state.teamVotes[ans].includes(participantId)) {
          state.teamVotes[ans] = state.teamVotes[ans].filter(id => id !== participantId);
        }
      });
      
      // Add new vote
      if (!state.teamVotes[answer]) {
        state.teamVotes[answer] = [];
      }
      state.teamVotes[answer].push(participantId);
    },
    
    setConsensusAnswer: (state, action) => {
      state.consensusAnswer = action.payload;
    },
    
    updateIndividualScore: (state, action) => {
      const { participantId, score } = action.payload;
      state.individualScores[participantId] = score;
    },
    
    updateTeamScore: (state, action) => {
      state.teamScore = action.payload;
    },
    
    // Leaderboard
    setLeaderboardFilter: (state, action) => {
      state.leaderboardFilter = action.payload;
    },
    
    updateMyPosition: (state, action) => {
      state.myPosition = action.payload;
    },
    
    // Whiteboard
    addDrawing: (state, action) => {
      state.whiteboardState.drawings.push(action.payload);
    },
    
    clearDrawings: (state) => {
      state.whiteboardState.drawings = [];
    },
    
    updateDrawingTool: (state, action) => {
      state.whiteboardState.activeTool = action.payload;
    },
    
    updateDrawingColor: (state, action) => {
      state.whiteboardState.color = action.payload;
    },
    
    updateDrawingThickness: (state, action) => {
      state.whiteboardState.thickness = action.payload;
    },
    
    // Shared content
    setSharedContent: (state, action) => {
      const { content, type } = action.payload;
      state.sharedContent = content;
      state.sharedContentType = type;
      state.contentSyncVersion += 1;
    },
    
    updateSharedContent: (state, action) => {
      const updates = action.payload;
      state.sharedContent = {
        ...state.sharedContent,
        ...updates
      };
      state.contentSyncVersion += 1;
    },
    
    // UI state
    toggleChat: (state) => {
      state.chatOpen = !state.chatOpen;
      if (state.chatOpen) {
        state.unreadCount = 0;
      }
    },
    
    setChatOpen: (state, action) => {
      state.chatOpen = action.payload;
      if (action.payload) {
        state.unreadCount = 0;
      }
    },
    
    toggleVideoCall: (state) => {
      state.videoCallActive = !state.videoCallActive;
    },
    
    setVideoCallActive: (state, action) => {
      state.videoCallActive = action.payload;
    },
    
    toggleWhiteboard: (state) => {
      state.whiteboardOpen = !state.whiteboardOpen;
    },
    
    setWhiteboardOpen: (state, action) => {
      state.whiteboardOpen = action.payload;
    },
    
    toggleLeaderboard: (state) => {
      state.showLeaderboard = !state.showLeaderboard;
    },
    
    setShowLeaderboard: (state, action) => {
      state.showLeaderboard = action.payload;
    },
    
    // Room state
    setRoomStatus: (state, action) => {
      state.roomStatus = action.payload;
      if (action.payload === 'active') {
        state.sessionStartTime = new Date().toISOString();
      }
    },
    
    updateSessionDuration: (state, action) => {
      state.sessionDuration = action.payload;
    },
    
    // Reset
    resetCollaboration: (state) => {
      return { ...initialState };
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    // Create room
    builder
      .addCase(createRoom.pending, (state) => {
        state.loading.createRoom = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading.createRoom = false;
        const room = action.payload;
        state.roomId = room.id;
        state.roomName = room.name;
        state.roomTopic = room.topic;
        state.roomPrivacy = room.privacy;
        state.maxParticipants = room.maxParticipants;
        state.scheduledTime = room.scheduledTime;
        state.hostId = room.hostId;
        state.roomStatus = 'lobby';
        state.myParticipantId = room.hostId;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading.createRoom = false;
        state.error = action.payload || 'Failed to create room';
      });
    
    // Join room
    builder
      .addCase(joinRoom.pending, (state) => {
        state.loading.joinRoom = true;
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.loading.joinRoom = false;
        const room = action.payload;
        state.roomId = room.id;
        state.roomName = room.name;
        state.roomTopic = room.topic;
        state.roomPrivacy = room.privacy;
        state.maxParticipants = room.maxParticipants;
        state.hostId = room.hostId;
        state.roomStatus = room.status;
        state.participants = room.participants || [];
        state.participantCount = state.participants.length;
        state.myParticipantId = room.myParticipantId;
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.loading.joinRoom = false;
        state.error = action.payload || 'Failed to join room';
      });
    
    // Leave room
    builder
      .addCase(leaveRoom.pending, (state) => {
        state.loading.leaveRoom = true;
      })
      .addCase(leaveRoom.fulfilled, (state) => {
        state.loading.leaveRoom = false;
        // Keep room data for navigation, but clear participant data
        state.participants = [];
        state.participantCount = 0;
        state.messages = [];
        state.wsConnected = false;
      })
      .addCase(leaveRoom.rejected, (state, action) => {
        state.loading.leaveRoom = false;
        state.error = action.payload || 'Failed to leave room';
      });
    
    // Fetch room details
    builder
      .addCase(fetchRoomDetails.pending, (state) => {
        state.loading.fetchRoom = true;
        state.error = null;
      })
      .addCase(fetchRoomDetails.fulfilled, (state, action) => {
        state.loading.fetchRoom = false;
        const room = action.payload;
        state.roomId = room.id;
        state.roomName = room.name;
        state.roomTopic = room.topic;
        state.roomPrivacy = room.privacy;
        state.maxParticipants = room.maxParticipants;
        state.hostId = room.hostId;
        state.roomStatus = room.status;
        state.participants = room.participants || [];
        state.participantCount = state.participants.length;
      })
      .addCase(fetchRoomDetails.rejected, (state, action) => {
        state.loading.fetchRoom = false;
        state.error = action.payload || 'Failed to fetch room details';
      });
    
    // Fetch user presence
    builder
      .addCase(fetchUserPresence.pending, (state) => {
        state.loading.fetchPresence = true;
      })
      .addCase(fetchUserPresence.fulfilled, (state, action) => {
        state.loading.fetchPresence = false;
        const { userId, presence } = action.payload;
        state.presence[userId] = presence;
      })
      .addCase(fetchUserPresence.rejected, (state, action) => {
        state.loading.fetchPresence = false;
        state.error = action.payload || 'Failed to fetch presence';
      });
    
    // Broadcast message
    builder
      .addCase(broadcastMessage.pending, (state) => {
        state.loading.broadcast = true;
      })
      .addCase(broadcastMessage.fulfilled, (state) => {
        state.loading.broadcast = false;
      })
      .addCase(broadcastMessage.rejected, (state, action) => {
        state.loading.broadcast = false;
        state.error = action.payload || 'Failed to broadcast message';
      });
    
    // Fetch leaderboard
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading.leaderboard = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading.leaderboard = false;
        state.leaderboard = action.payload.rankings || [];
        state.myPosition = action.payload.myPosition;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading.leaderboard = false;
        state.error = action.payload || 'Failed to fetch leaderboard';
      });
    
    // Submit shared answer
    builder
      .addCase(submitSharedAnswer.pending, (state) => {
        state.loading.submitAnswer = true;
        state.error = null;
      })
      .addCase(submitSharedAnswer.fulfilled, (state, action) => {
        state.loading.submitAnswer = false;
        const { correct, score, teamScore } = action.payload;
        if (state.quizMode === 'team') {
          state.teamScore = teamScore;
        } else if (state.quizMode === 'competitive') {
          state.individualScores[state.myParticipantId] = score;
        }
      })
      .addCase(submitSharedAnswer.rejected, (state, action) => {
        state.loading.submitAnswer = false;
        state.error = action.payload || 'Failed to submit answer';
      });
    
    // Update ready status
    builder
      .addCase(updateReadyStatus.pending, (state) => {
        state.loading.updateReady = true;
      })
      .addCase(updateReadyStatus.fulfilled, (state, action) => {
        state.loading.updateReady = false;
        const { userId, isReady } = action.payload;
        if (isReady && !state.readyParticipants.includes(userId)) {
          state.readyParticipants.push(userId);
        } else if (!isReady) {
          state.readyParticipants = state.readyParticipants.filter(id => id !== userId);
        }
        state.allReady = state.readyParticipants.length === state.participants.length;
      })
      .addCase(updateReadyStatus.rejected, (state, action) => {
        state.loading.updateReady = false;
        state.error = action.payload || 'Failed to update ready status';
      });
    
    // Start room session
    builder
      .addCase(startRoomSession.pending, (state) => {
        state.loading.startSession = true;
        state.error = null;
      })
      .addCase(startRoomSession.fulfilled, (state, action) => {
        state.loading.startSession = false;
        state.roomStatus = 'active';
        state.sessionStartTime = new Date().toISOString();
      })
      .addCase(startRoomSession.rejected, (state, action) => {
        state.loading.startSession = false;
        state.error = action.payload || 'Failed to start session';
      });
  }
});

export const {
  setWsConnected,
  setWsError,
  setReconnecting,
  incrementReconnectAttempts,
  addParticipant,
  removeParticipant,
  updateParticipant,
  setParticipantReady,
  addMessage,
  clearMessages,
  markMessagesRead,
  setTypingUser,
  updatePresence,
  updateCursor,
  removeCursor,
  addSharedHighlight,
  removeSharedHighlight,
  setQuizMode,
  setCurrentQuestion,
  submitTeamAnswer,
  voteForAnswer,
  setConsensusAnswer,
  updateIndividualScore,
  updateTeamScore,
  setLeaderboardFilter,
  updateMyPosition,
  addDrawing,
  clearDrawings,
  updateDrawingTool,
  updateDrawingColor,
  updateDrawingThickness,
  setSharedContent,
  updateSharedContent,
  toggleChat,
  setChatOpen,
  toggleVideoCall,
  setVideoCallActive,
  toggleWhiteboard,
  setWhiteboardOpen,
  toggleLeaderboard,
  setShowLeaderboard,
  setRoomStatus,
  updateSessionDuration,
  resetCollaboration,
  clearError
} = collaborationSlice.actions;

export default collaborationSlice.reducer;
