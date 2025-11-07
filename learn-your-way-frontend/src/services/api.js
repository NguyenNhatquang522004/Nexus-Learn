import axios from 'axios';
import { storageService } from './storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ENDPOINTS = {
  security: import.meta.env.VITE_SECURITY_AGENT_URL || 'http://localhost:8017',
  personalization: import.meta.env.VITE_PERSONALIZATION_AGENT_URL || 'http://localhost:8002',
  content: import.meta.env.VITE_CONTENT_AGENT_URL || 'http://localhost:8001',
  contentQuality: import.meta.env.VITE_CONTENT_QUALITY_AGENT_URL || 'http://localhost:8013',
  assessment: import.meta.env.VITE_ASSESSMENT_AGENT_URL || 'http://localhost:8003',
  analytics: import.meta.env.VITE_ANALYTICS_AGENT_URL || 'http://localhost:8004',
  learningScience: import.meta.env.VITE_LEARNING_SCIENCE_AGENT_URL || 'http://localhost:8005',
  knowledgeGraph: import.meta.env.VITE_KNOWLEDGE_GRAPH_AGENT_URL || 'http://localhost:8006',
  mindmap: import.meta.env.VITE_MINDMAP_AGENT_URL || 'http://localhost:8007',
  visual: import.meta.env.VITE_VISUAL_AGENT_URL || 'http://localhost:8009',
  audio: import.meta.env.VITE_AUDIO_AGENT_URL || 'http://localhost:8008',
  translation: import.meta.env.VITE_TRANSLATION_AGENT_URL || 'http://localhost:8014',
  realtime: import.meta.env.VITE_REALTIME_AGENT_URL || 'http://localhost:8012'
};

const createApiClient = (baseURL = API_BASE_URL) => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  client.interceptors.request.use(
    (config) => {
      const token = storageService.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => {
      return response.data;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = storageService.getRefreshToken();
          if (refreshToken) {
            const response = await axios.post(
              `${ENDPOINTS.security}${import.meta.env.VITE_AUTH_REFRESH_ENDPOINT || '/api/auth/refresh'}`,
              { refreshToken }
            );

            const { token } = response.data;
            storageService.setToken(token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          storageService.clearAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();
const securityClient = createApiClient(ENDPOINTS.security);
const personalizationClient = createApiClient(ENDPOINTS.personalization);
const contentClient = createApiClient(ENDPOINTS.content);
const contentQualityClient = createApiClient(ENDPOINTS.contentQuality);
const assessmentClient = createApiClient(ENDPOINTS.assessment);
const analyticsClient = createApiClient(ENDPOINTS.analytics);
const learningScienceClient = createApiClient(ENDPOINTS.learningScience);
const knowledgeGraphClient = createApiClient(ENDPOINTS.knowledgeGraph);
const mindmapClient = createApiClient(ENDPOINTS.mindmap);
const visualClient = createApiClient(ENDPOINTS.visual);
const audioClient = createApiClient(ENDPOINTS.audio);
const translationClient = createApiClient(ENDPOINTS.translation);
const realtimeClient = createApiClient(ENDPOINTS.realtime);

export const securityService = {
  // Profile management
  getProfile: async (userId) => {
    return await securityClient.get(
      `${import.meta.env.VITE_SECURITY_PROFILE_ENDPOINT || '/api/profile'}/${userId}`
    );
  },

  updateProfile: async (userId, profileData) => {
    return await securityClient.put(
      `${import.meta.env.VITE_SECURITY_PROFILE_ENDPOINT || '/api/profile'}/${userId}`,
      profileData
    );
  },

  uploadAvatar: async (userId, formData) => {
    return await securityClient.post(
      `${import.meta.env.VITE_SECURITY_AVATAR_ENDPOINT || '/api/profile'}/${userId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  },

  // Settings management
  updateSettings: async (userId, settings) => {
    return await securityClient.put(
      `${import.meta.env.VITE_SECURITY_SETTINGS_ENDPOINT || '/api/settings'}/${userId}`,
      settings
    );
  },

  // Password management
  changePassword: async (passwordData) => {
    return await securityClient.post(
      import.meta.env.VITE_SECURITY_CHANGE_PASSWORD_ENDPOINT || '/api/change-password',
      passwordData
    );
  },

  // Privacy settings
  getPrivacySettings: async (userId) => {
    return await securityClient.get(
      `${import.meta.env.VITE_SECURITY_PRIVACY_ENDPOINT || '/api/privacy'}/${userId}`
    );
  },

  updatePrivacySettings: async (userId, privacySettings) => {
    return await securityClient.put(
      `${import.meta.env.VITE_SECURITY_PRIVACY_ENDPOINT || '/api/privacy'}/${userId}`,
      privacySettings
    );
  },

  // GDPR/Data export
  exportUserData: async (userId, options) => {
    return await securityClient.post(
      import.meta.env.VITE_SECURITY_EXPORT_DATA_ENDPOINT || '/api/export-data',
      { userId, ...options }
    );
  },

  // Account deletion
  deleteAccount: async (userId, data) => {
    return await securityClient.delete(
      `${import.meta.env.VITE_SECURITY_DELETE_ACCOUNT_ENDPOINT || '/api/account'}/${userId}`,
      { data }
    );
  },

  // Age verification (COPPA compliance)
  verifyAge: async (userId, verificationData) => {
    return await securityClient.post(
      `${import.meta.env.VITE_SECURITY_VERIFY_AGE_ENDPOINT || '/api/verify-age'}/${userId}`,
      verificationData
    );
  }
};

export const personalizationService = {
  saveProfile: async (profileData) => {
    return await personalizationClient.post(
      import.meta.env.VITE_PERSONALIZATION_PROFILE_ENDPOINT || '/api/personalization/profile',
      profileData
    );
  },

  getProfile: async () => {
    return await personalizationClient.get(
      import.meta.env.VITE_PERSONALIZATION_PROFILE_ENDPOINT || '/api/personalization/profile'
    );
  },

  updateProfile: async (profileData) => {
    return await personalizationClient.put(
      import.meta.env.VITE_PERSONALIZATION_PROFILE_ENDPOINT || '/api/personalization/profile',
      profileData
    );
  },

  savePreferences: async (preferences) => {
    return await personalizationClient.post(
      import.meta.env.VITE_PERSONALIZATION_PREFERENCES_ENDPOINT || '/api/personalization/preferences',
      preferences
    );
  },

  getPreferences: async () => {
    return await personalizationClient.get(
      import.meta.env.VITE_PERSONALIZATION_PREFERENCES_ENDPOINT || '/api/personalization/preferences'
    );
  },

  updatePreferences: async (userId, preferences) => {
    return await personalizationClient.put(
      `${import.meta.env.VITE_PERSONALIZATION_PREFERENCES_ENDPOINT || '/api/personalization/preferences'}/${userId}`,
      preferences
    );
  },

  submitLearningStyleQuiz: async (answers) => {
    return await personalizationClient.post(
      import.meta.env.VITE_PERSONALIZATION_QUIZ_ENDPOINT || '/api/personalization/quiz',
      { answers }
    );
  },

  getLearningStyle: async () => {
    return await personalizationClient.get(
      import.meta.env.VITE_PERSONALIZATION_LEARNING_STYLE_ENDPOINT || '/api/personalization/learning-style'
    );
  },

  getQuizQuestions: async () => {
    return await personalizationClient.get(
      `${import.meta.env.VITE_PERSONALIZATION_QUIZ_ENDPOINT || '/api/personalization/quiz'}/questions`
    );
  },

  personalizeContent: async (data) => {
    return await personalizationClient.post('/api/personalize', data);
  },

  getProfileById: async (userId) => {
    return await personalizationClient.get(`/api/profile/${userId}`);
  },

  // Get personalized quiz feedback
  getQuizFeedback: async (data) => {
    return await personalizationClient.post(
      import.meta.env.VITE_PERSONALIZATION_FEEDBACK_ENDPOINT || '/api/personalization/feedback',
      data
    );
  }
};

export const contentService = {
  uploadFile: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return await contentClient.post(
      import.meta.env.VITE_CONTENT_UPLOAD_ENDPOINT || '/api/content/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      }
    );
  },

  getContent: async (contentId) => {
    return await contentClient.get(`/api/content/${contentId}`);
  },

  listContent: async (filters = {}) => {
    return await contentClient.get('/api/content', { params: filters });
  },

  deleteContent: async (contentId) => {
    return await contentClient.delete(`/api/content/${contentId}`);
  },

  saveNote: async (data) => {
    return await contentClient.post('/api/content/notes', data);
  },

  getNotes: async (userId, conceptId) => {
    return await contentClient.get(`/api/content/notes/${userId}/${conceptId}`);
  },

  deleteNote: async (noteId) => {
    return await contentClient.delete(`/api/content/notes/${noteId}`);
  },

  saveHighlights: async (data) => {
    return await contentClient.post('/api/content/highlights', data);
  },

  getHighlights: async (userId, conceptId) => {
    return await contentClient.get(`/api/content/highlights/${userId}/${conceptId}`);
  },

  updateProgress: async (data) => {
    return await contentClient.post('/api/content/progress', data);
  },

  getProgress: async (userId, conceptId) => {
    return await contentClient.get(`/api/content/progress/${userId}/${conceptId}`);
  },

  toggleBookmark: async (data) => {
    return await contentClient.post('/api/content/bookmark', data);
  },

  getBookmarks: async (userId) => {
    return await contentClient.get(`/api/content/bookmarks/${userId}`);
  },

  // Upload content (educators)
  uploadContent: async (formData) => {
    return await contentClient.post(
      import.meta.env.VITE_CONTENT_INGEST_ENDPOINT || '/api/ingest',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
  },

  // Get processing status
  getProcessingStatus: async (jobId) => {
    return await contentClient.get(
      `${import.meta.env.VITE_CONTENT_STATUS_ENDPOINT || '/api/status'}/${jobId}`
    );
  },

  // Get extracted content
  getExtractedContent: async (fileId) => {
    return await contentClient.get(
      `${import.meta.env.VITE_CONTENT_EXTRACT_ENDPOINT || '/api/extract'}/${fileId}`
    );
  },

  // Reprocess file
  reprocessFile: async (fileId) => {
    return await contentClient.post(
      `${import.meta.env.VITE_CONTENT_REPROCESS_ENDPOINT || '/api/reprocess'}/${fileId}`
    );
  },

  // Publish content
  publishContent: async (contentId, settings) => {
    return await contentClient.post(
      `${import.meta.env.VITE_CONTENT_PUBLISH_ENDPOINT || '/api/content'}/${contentId}/publish`,
      settings
    );
  },

  // Get user's content (for educators)
  getUserContent: async (userId, filters = {}) => {
    return await contentClient.get(
      `${import.meta.env.VITE_CONTENT_USER_ENDPOINT || '/api/content/user'}/${userId}`,
      { params: filters }
    );
  },

  // Duplicate content
  duplicateContent: async (contentId) => {
    return await contentClient.post(
      `${import.meta.env.VITE_CONTENT_DUPLICATE_ENDPOINT || '/api/content'}/${contentId}/duplicate`
    );
  },

  // Update content metadata
  updateContentMetadata: async (contentId, metadata) => {
    return await contentClient.put(
      `${import.meta.env.VITE_CONTENT_METADATA_ENDPOINT || '/api/content'}/${contentId}/metadata`,
      metadata
    );
  }
};

// Content Quality Agent Service (Port 8013)
export const contentQualityService = {
  // Validate content for quality checks
  validateContent: async (data) => {
    try {
      const response = await contentQualityClient.post(
        import.meta.env.VITE_CONTENT_QUALITY_VALIDATE_ENDPOINT || '/api/validate',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Content validation error:', error);
      throw error;
    }
  },

  // Approve content for publishing
  approveContent: async (contentId, approvalData = {}) => {
    try {
      const response = await contentQualityClient.post(
        `${import.meta.env.VITE_CONTENT_QUALITY_APPROVE_ENDPOINT || '/api/approve'}/${contentId}`,
        {
          approver: approvalData.approver || null,
          comments: approvalData.comments || '',
          timestamp: approvalData.timestamp || new Date().toISOString()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Content approval error:', error);
      throw error;
    }
  },

  // Reject content with reason
  rejectContent: async (contentId, data = {}) => {
    try {
      const response = await contentQualityClient.post(
        `${import.meta.env.VITE_CONTENT_QUALITY_REJECT_ENDPOINT || '/api/reject'}/${contentId}`,
        {
          reason: data.reason || '',
          requiredChanges: data.requiredChanges || []
        }
      );
      return response.data;
    } catch (error) {
      console.error('Content rejection error:', error);
      throw error;
    }
  }
};

export const assessmentService = {
  // Generate quiz questions
  generateQuestions: async (data) => {
    return await assessmentClient.post(
      import.meta.env.VITE_ASSESSMENT_GENERATE_QUESTIONS_ENDPOINT || '/api/assessment/generate-questions',
      data
    );
  },

  // Get adaptive question based on performance
  getAdaptiveQuestion: async (data) => {
    return await assessmentClient.post(
      import.meta.env.VITE_ASSESSMENT_ADAPTIVE_QUESTION_ENDPOINT || '/api/assessment/adaptive-question',
      data
    );
  },

  // Grade a single answer
  gradeAnswer: async (data) => {
    return await assessmentClient.post(
      import.meta.env.VITE_ASSESSMENT_GRADE_ANSWER_ENDPOINT || '/api/assessment/grade-answer',
      data
    );
  },

  // Get hint for a question
  getHint: async (data) => {
    return await assessmentClient.post(
      import.meta.env.VITE_ASSESSMENT_HINT_ENDPOINT || '/api/assessment/hint',
      data
    );
  },

  // Get quiz by ID
  getQuiz: async (quizId) => {
    return await assessmentClient.get(
      `${import.meta.env.VITE_ASSESSMENT_QUIZ_ENDPOINT || '/api/assessment/quiz'}/${quizId}`
    );
  },

  // Submit complete quiz
  submitQuiz: async (quizId, data) => {
    return await assessmentClient.post(
      `${import.meta.env.VITE_ASSESSMENT_QUIZ_ENDPOINT || '/api/assessment/quiz'}/${quizId}/submit`,
      data
    );
  },

  // Get quiz results
  getQuizResults: async (quizId) => {
    return await assessmentClient.get(
      `${import.meta.env.VITE_ASSESSMENT_QUIZ_ENDPOINT || '/api/assessment/quiz'}/${quizId}/results`
    );
  }
};

export const analyticsService = {
  trackEvent: async (eventData) => {
    return await analyticsClient.post(
      import.meta.env.VITE_ANALYTICS_TRACK_ENDPOINT || '/api/analytics/track',
      eventData
    );
  },

  getUserAnalytics: async () => {
    return await analyticsClient.get('/api/analytics/user');
  },

  getContentAnalytics: async (contentId) => {
    return await analyticsClient.get(`/api/analytics/content/${contentId}`);
  },

  // Dashboard-specific endpoints
  getMetrics: async (userId) => {
    return await analyticsClient.get(`/api/analytics/metrics/${userId}`);
  },

  getEngagement: async (userId) => {
    return await analyticsClient.get(`/api/analytics/engagement/${userId}`);
  },

  getDashboardData: async (userId) => {
    return await analyticsClient.get('/api/analytics/dashboard-data', {
      params: { userId }
    });
  },

  getActivityFeed: async (userId) => {
    return await analyticsClient.get(`/api/analytics/activity-feed/${userId}`);
  },

  // Profile-specific analytics
  getUserMetrics: async (userId) => {
    return await analyticsClient.get(
      `${import.meta.env.VITE_ANALYTICS_METRICS_ENDPOINT || '/api/metrics'}/${userId}`
    );
  },

  getUserAchievements: async (userId) => {
    return await analyticsClient.get(
      `${import.meta.env.VITE_ANALYTICS_ACHIEVEMENTS_ENDPOINT || '/api/achievements'}/${userId}`
    );
  },

  getUserActivity: async (userId, limit = 10) => {
    return await analyticsClient.get(
      `${import.meta.env.VITE_ANALYTICS_ACTIVITY_ENDPOINT || '/api/activity'}/${userId}`,
      { params: { limit } }
    );
  }
};

export const learningScienceService = {
  getRecommendations: async (userId) => {
    return await learningScienceClient.get(
      `${import.meta.env.VITE_LEARNING_SCIENCE_RECOMMENDATIONS_ENDPOINT || '/api/learning-science/recommendations'}/${userId}`
    );
  },

  getNextTopic: async (userId) => {
    return await learningScienceClient.get(`/api/next-topic/${userId}`);
  },

  getSpacedRepetition: async () => {
    return await learningScienceClient.get('/api/learning-science/spaced-repetition');
  },

  getStudyPlan: async (userId) => {
    return await learningScienceClient.get(`/api/study-plan/${userId}`);
  },

  getUpcomingReviews: async (userId) => {
    return await learningScienceClient.get(`/api/upcoming-reviews/${userId}`);
  },
};

export const knowledgeGraphService = {
  getGraph: async (contentId) => {
    return await knowledgeGraphClient.get(
      `${import.meta.env.VITE_KNOWLEDGE_GRAPH_ENDPOINT || '/api/knowledge-graph'}/${contentId}`
    );
  },

  getRelatedTopics: async (topicId) => {
    return await knowledgeGraphClient.get(
      `${import.meta.env.VITE_KNOWLEDGE_GRAPH_ENDPOINT || '/api/knowledge-graph'}/related/${topicId}`
    );
  },

  getLearningPath: async (userId, conceptId) => {
    return await knowledgeGraphClient.get(`/api/graph/learning-path/${userId}/${conceptId}`);
  },

  getMastery: async (userId) => {
    return await knowledgeGraphClient.get(`/api/mastery/${userId}`);
  },

  getPrerequisites: async (conceptId) => {
    return await knowledgeGraphClient.get(`/api/prerequisites/${conceptId}`);
  },

  getRelatedConcepts: async (conceptId) => {
    return await knowledgeGraphClient.get(`/api/related/${conceptId}`);
  },

  getConceptGraph: async (conceptId) => {
    return await knowledgeGraphClient.get(`/api/graph/${conceptId}`);
  },

  getMindMap: async (conceptId) => {
    return await knowledgeGraphClient.get(`/api/mindmap/${conceptId}`);
  },

  // Update mastery levels based on quiz performance
  updateMastery: async (data) => {
    return await knowledgeGraphClient.put(
      import.meta.env.VITE_KNOWLEDGE_GRAPH_MASTERY_UPDATE_ENDPOINT || '/api/knowledge-graph/mastery',
      data
    );
  }
};

export const mindmapService = {
  generateMindmap: async (conceptId) => {
    return await mindmapClient.post(
      import.meta.env.VITE_MINDMAP_GENERATE_ENDPOINT || '/api/mindmap/generate',
      { contentId: conceptId }
    );
  },

  getMindmap: async (mindmapId) => {
    return await mindmapClient.get(`/api/mindmap/${mindmapId}`);
  },

  updateMindmap: async (mindmapId, data) => {
    return await mindmapClient.put(`/api/mindmap/${mindmapId}`, data);
  },

  getGraph: async (conceptId, userId = null) => {
    const params = userId ? { userId } : {};
    return await mindmapClient.get(`/api/graph/${conceptId}`, { params });
  },

  getPrerequisiteTree: async (conceptId) => {
    return await mindmapClient.get(`/api/prerequisite-tree/${conceptId}`);
  },

  applyLayout: async (data) => {
    return await mindmapClient.post('/api/layout', data);
  },

  exportMindmap: async (data) => {
    return await mindmapClient.post('/api/export', data, {
      responseType: 'blob'
    });
  },

  getNodeChildren: async (nodeId) => {
    return await mindmapClient.get(`/api/graph/${nodeId}/children`);
  }
};

export const visualService = {
  generateImages: async (data) => {
    return await visualClient.post('/api/generate-images', data);
  },

  getImage: async (imageId) => {
    return await visualClient.get(`/api/image/${imageId}`);
  },

  getVisualEnhancements: async (conceptId) => {
    return await visualClient.get(`/api/enhancements/${conceptId}`);
  }
};

export const audioService = {
  generateAudio: async (data) => {
    return await audioClient.post('/api/generate-audio', data);
  },

  getAudio: async (audioId) => {
    return await audioClient.get(`/api/audio/${audioId}`);
  },

  getTranscript: async (audioId) => {
    return await audioClient.get(`/api/transcript/${audioId}`);
  },

  streamAudio: async (audioId) => {
    return `${ENDPOINTS.audio}/api/stream/${audioId}`;
  },

  getWordTimings: async (audioId) => {
    return await audioClient.get(`/api/word-timings/${audioId}`);
  }
};

export const translationService = {
  translate: async (data) => {
    return await translationClient.post('/api/translate', data);
  },

  detectLanguage: async (text) => {
    return await translationClient.post('/api/detect-language', { text });
  },

  getSupportedLanguages: async () => {
    return await translationClient.get('/api/supported-languages');
  }
};

export const realtimeService = {
  // Room management
  createRoom: async (roomData) => {
    return await realtimeClient.post(
      import.meta.env.VITE_REALTIME_CREATE_ROOM_ENDPOINT || '/api/create-room',
      roomData
    );
  },

  joinRoom: async (roomId) => {
    return await realtimeClient.post(
      import.meta.env.VITE_REALTIME_JOIN_ROOM_ENDPOINT || '/api/join-room',
      { roomId }
    );
  },

  leaveRoom: async (roomId) => {
    return await realtimeClient.post(
      import.meta.env.VITE_REALTIME_LEAVE_ROOM_ENDPOINT || '/api/leave-room',
      { roomId }
    );
  },

  getRoomDetails: async (roomId) => {
    return await realtimeClient.get(
      `${import.meta.env.VITE_REALTIME_ROOM_ENDPOINT || '/api/room'}/${roomId}`
    );
  },

  // Broadcasting
  broadcastToRoom: async (roomId, message) => {
    return await realtimeClient.post(
      `${import.meta.env.VITE_REALTIME_BROADCAST_ENDPOINT || '/api/broadcast'}/${roomId}`,
      message
    );
  },

  // Presence
  getUserPresence: async (userId) => {
    return await realtimeClient.get(
      `${import.meta.env.VITE_REALTIME_PRESENCE_ENDPOINT || '/api/presence'}/${userId}`
    );
  },

  updatePresence: async (presenceData) => {
    return await realtimeClient.post(
      import.meta.env.VITE_REALTIME_PRESENCE_UPDATE_ENDPOINT || '/api/presence/update',
      presenceData
    );
  },

  // Ready status
  updateReadyStatus: async (roomId, isReady) => {
    return await realtimeClient.post(
      import.meta.env.VITE_REALTIME_READY_ENDPOINT || '/api/ready',
      { roomId, isReady }
    );
  },

  // Session control
  startSession: async (roomId) => {
    return await realtimeClient.post(
      import.meta.env.VITE_REALTIME_START_SESSION_ENDPOINT || '/api/start-session',
      { roomId }
    );
  },

  endSession: async (roomId) => {
    return await realtimeClient.post(
      import.meta.env.VITE_REALTIME_END_SESSION_ENDPOINT || '/api/end-session',
      { roomId }
    );
  },

  // Leaderboard
  getLeaderboard: async (roomId, filter = 'all') => {
    return await realtimeClient.get(
      `${import.meta.env.VITE_REALTIME_LEADERBOARD_ENDPOINT || '/api/leaderboard'}/${roomId}`,
      { params: { filter } }
    );
  },

  // Quiz collaboration
  submitAnswer: async (roomId, answerData) => {
    return await realtimeClient.post(
      import.meta.env.VITE_REALTIME_SUBMIT_ANSWER_ENDPOINT || '/api/submit-answer',
      { roomId, ...answerData }
    );
  },

  // WebSocket connection helper
  getWebSocketUrl: (userId) => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = import.meta.env.VITE_REALTIME_AGENT_URL || 'http://localhost:8012';
    const wsUrl = baseUrl.replace(/^https?:/, wsProtocol);
    const endpoint = import.meta.env.VITE_REALTIME_WS_ENDPOINT || '/ws';
    return `${wsUrl}${endpoint}/${userId}`;
  }
};

export {
  apiClient,
  securityClient,
  personalizationClient,
  contentClient,
  contentQualityClient,
  assessmentClient,
  analyticsClient,
  learningScienceClient,
  knowledgeGraphClient,
  mindmapClient,
  visualClient,
  audioClient,
  translationClient,
  realtimeClient
};

export default apiClient;
