import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks for fetching dashboard data
export const fetchDashboardMetrics = createAsyncThunk(
  'dashboard/fetchMetrics',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.analyticsService.getDashboardData(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchEngagementData = createAsyncThunk(
  'dashboard/fetchEngagement',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.analyticsService.getEngagement(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchLearningPath = createAsyncThunk(
  'dashboard/fetchLearningPath',
  async ({ userId, conceptId }, { rejectWithValue }) => {
    try {
      const response = await api.knowledgeGraphService.getLearningPath(userId, conceptId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMastery = createAsyncThunk(
  'dashboard/fetchMastery',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.knowledgeGraphService.getMastery(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchNextTopic = createAsyncThunk(
  'dashboard/fetchNextTopic',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.learningScienceService.getNextTopic(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchStudyPlan = createAsyncThunk(
  'dashboard/fetchStudyPlan',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.learningScienceService.getStudyPlan(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchActivityFeed = createAsyncThunk(
  'dashboard/fetchActivityFeed',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.analyticsService.getActivityFeed(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUpcomingReviews = createAsyncThunk(
  'dashboard/fetchUpcomingReviews',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.learningScienceService.getUpcomingReviews(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  // Metrics data
  metrics: {
    totalCourses: 0,
    completedCourses: 0,
    studyHours: 0,
    streak: 0,
    achievements: 0,
    masteryScore: 0,
  },
  
  // Progress tracking
  progress: {
    subjects: [],
    masteryHeatmap: [],
    timeSpent: [],
    conceptGraph: null,
  },
  
  // Recommendations
  recommendations: [],
  nextTopic: null,
  studyPlan: null,
  
  // Activity feed
  activityFeed: [],
  upcomingReviews: [],
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  
  // WebSocket state
  wsConnected: false,
  wsError: null,
  
  // Engagement data
  engagement: {
    lastActive: null,
    sessionDuration: 0,
    dailyGoal: 0,
    dailyProgress: 0,
  },
  
  // Learning path
  learningPath: null,
  
  // Mastery data
  mastery: {
    overall: 0,
    bySubject: {},
    byConcept: {},
  },
  
  // UI state
  loading: {
    metrics: false,
    progress: false,
    recommendations: false,
    activityFeed: false,
    engagement: false,
  },
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // WebSocket connection management
    setWsConnected: (state, action) => {
      state.wsConnected = action.payload;
      if (action.payload) {
        state.wsError = null;
      }
    },
    setWsError: (state, action) => {
      state.wsError = action.payload;
      state.wsConnected = false;
    },
    
    // Real-time updates from WebSocket
    updateProgress: (state, action) => {
      const { subject, progress: newProgress } = action.payload;
      const subjectIndex = state.progress.subjects.findIndex(s => s.name === subject);
      if (subjectIndex !== -1) {
        state.progress.subjects[subjectIndex].progress = newProgress;
      }
    },
    
    addAchievement: (state, action) => {
      state.metrics.achievements += 1;
      state.activityFeed.unshift({
        id: Date.now(),
        type: 'achievement',
        data: action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    
    addNotification: (state, action) => {
      state.notifications.unshift({
        id: Date.now(),
        ...action.payload,
        read: false,
        timestamp: new Date().toISOString(),
      });
      state.unreadCount += 1;
    },
    
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.unreadCount = 0;
    },
    
    removeNotification: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        if (!state.notifications[index].read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    updateStreak: (state, action) => {
      state.metrics.streak = action.payload;
    },
    
    updateStudyTime: (state, action) => {
      state.metrics.studyHours += action.payload;
    },
    
    addActivityFeedItem: (state, action) => {
      state.activityFeed.unshift({
        id: Date.now(),
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 items
      if (state.activityFeed.length > 50) {
        state.activityFeed = state.activityFeed.slice(0, 50);
      }
    },
    
    updateEngagement: (state, action) => {
      state.engagement = {
        ...state.engagement,
        ...action.payload,
      };
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetDashboard: (state) => {
      return initialState;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch Dashboard Metrics
    builder
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading.metrics = true;
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading.metrics = false;
        state.metrics = {
          ...state.metrics,
          ...action.payload.metrics,
        };
        if (action.payload.progress) {
          state.progress.subjects = action.payload.progress.subjects || [];
        }
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading.metrics = false;
        state.error = action.payload || 'Failed to fetch dashboard metrics';
      });
    
    // Fetch Engagement Data
    builder
      .addCase(fetchEngagementData.pending, (state) => {
        state.loading.engagement = true;
      })
      .addCase(fetchEngagementData.fulfilled, (state, action) => {
        state.loading.engagement = false;
        state.engagement = {
          ...state.engagement,
          ...action.payload,
        };
        if (action.payload.timeSpent) {
          state.progress.timeSpent = action.payload.timeSpent;
        }
      })
      .addCase(fetchEngagementData.rejected, (state, action) => {
        state.loading.engagement = false;
        state.error = action.payload || 'Failed to fetch engagement data';
      });
    
    // Fetch Learning Path
    builder
      .addCase(fetchLearningPath.pending, (state) => {
        state.loading.progress = true;
      })
      .addCase(fetchLearningPath.fulfilled, (state, action) => {
        state.loading.progress = false;
        state.learningPath = action.payload;
        if (action.payload.conceptGraph) {
          state.progress.conceptGraph = action.payload.conceptGraph;
        }
      })
      .addCase(fetchLearningPath.rejected, (state, action) => {
        state.loading.progress = false;
        state.error = action.payload || 'Failed to fetch learning path';
      });
    
    // Fetch Mastery
    builder
      .addCase(fetchMastery.pending, (state) => {
        state.loading.progress = true;
      })
      .addCase(fetchMastery.fulfilled, (state, action) => {
        state.loading.progress = false;
        state.mastery = action.payload;
        state.metrics.masteryScore = action.payload.overall || 0;
        if (action.payload.heatmap) {
          state.progress.masteryHeatmap = action.payload.heatmap;
        }
      })
      .addCase(fetchMastery.rejected, (state, action) => {
        state.loading.progress = false;
        state.error = action.payload || 'Failed to fetch mastery data';
      });
    
    // Fetch Next Topic
    builder
      .addCase(fetchNextTopic.pending, (state) => {
        state.loading.recommendations = true;
      })
      .addCase(fetchNextTopic.fulfilled, (state, action) => {
        state.loading.recommendations = false;
        state.nextTopic = action.payload;
      })
      .addCase(fetchNextTopic.rejected, (state, action) => {
        state.loading.recommendations = false;
        state.error = action.payload || 'Failed to fetch next topic';
      });
    
    // Fetch Study Plan
    builder
      .addCase(fetchStudyPlan.pending, (state) => {
        state.loading.recommendations = true;
      })
      .addCase(fetchStudyPlan.fulfilled, (state, action) => {
        state.loading.recommendations = false;
        state.studyPlan = action.payload;
        if (action.payload.recommendations) {
          state.recommendations = action.payload.recommendations;
        }
      })
      .addCase(fetchStudyPlan.rejected, (state, action) => {
        state.loading.recommendations = false;
        state.error = action.payload || 'Failed to fetch study plan';
      });
    
    // Fetch Activity Feed
    builder
      .addCase(fetchActivityFeed.pending, (state) => {
        state.loading.activityFeed = true;
      })
      .addCase(fetchActivityFeed.fulfilled, (state, action) => {
        state.loading.activityFeed = false;
        state.activityFeed = action.payload;
      })
      .addCase(fetchActivityFeed.rejected, (state, action) => {
        state.loading.activityFeed = false;
        state.error = action.payload || 'Failed to fetch activity feed';
      });
    
    // Fetch Upcoming Reviews
    builder
      .addCase(fetchUpcomingReviews.pending, (state) => {
        state.loading.activityFeed = true;
      })
      .addCase(fetchUpcomingReviews.fulfilled, (state, action) => {
        state.loading.activityFeed = false;
        state.upcomingReviews = action.payload;
      })
      .addCase(fetchUpcomingReviews.rejected, (state, action) => {
        state.loading.activityFeed = false;
        state.error = action.payload || 'Failed to fetch upcoming reviews';
      });
  },
});

export const {
  setWsConnected,
  setWsError,
  updateProgress,
  addAchievement,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  updateStreak,
  updateStudyTime,
  addActivityFeedItem,
  updateEngagement,
  clearError,
  resetDashboard,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
