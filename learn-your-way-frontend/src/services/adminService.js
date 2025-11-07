import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Agent endpoints configuration (ports 8000-8019)
const AGENT_ENDPOINTS = {
  orchestration: `${import.meta.env.VITE_ORCHESTRATION_ENDPOINT || 'http://localhost:8000'}/api`,
  content_ingestion: `${import.meta.env.VITE_CONTENT_INGESTION_ENDPOINT || 'http://localhost:8001'}/api`,
  knowledge_graph: `${import.meta.env.VITE_KNOWLEDGE_GRAPH_ENDPOINT || 'http://localhost:8002'}/api`,
  learning_science: `${import.meta.env.VITE_LEARNING_SCIENCE_ENDPOINT || 'http://localhost:8003'}/api`,
  personalization: `${import.meta.env.VITE_PERSONALIZATION_ENDPOINT || 'http://localhost:8004'}/api`,
  assessment: `${import.meta.env.VITE_ASSESSMENT_ENDPOINT || 'http://localhost:8005'}/api`,
  analytics: `${import.meta.env.VITE_ANALYTICS_ENDPOINT || 'http://localhost:8006'}/api`,
  mindmap: `${import.meta.env.VITE_MINDMAP_ENDPOINT || 'http://localhost:8007'}/api`,
  visual_generation: `${import.meta.env.VITE_VISUAL_GENERATION_ENDPOINT || 'http://localhost:8008'}/api`,
  audio_generation: `${import.meta.env.VITE_AUDIO_GENERATION_ENDPOINT || 'http://localhost:8009'}/api`,
  translation: `${import.meta.env.VITE_TRANSLATION_ENDPOINT || 'http://localhost:8010'}/api`,
  realtime_coordination: `${import.meta.env.VITE_REALTIME_COORDINATION_ENDPOINT || 'http://localhost:8011'}/api`,
  security_compliance: `${import.meta.env.VITE_SECURITY_COMPLIANCE_ENDPOINT || 'http://localhost:8012'}/api`,
  local_ai: `${import.meta.env.VITE_LOCAL_AI_ENDPOINT || 'http://localhost:8013'}/api`,
  caching: `${import.meta.env.VITE_CACHING_ENDPOINT || 'http://localhost:8014'}/api`,
  database_management: `${import.meta.env.VITE_DATABASE_MANAGEMENT_ENDPOINT || 'http://localhost:8015'}/api`,
  infrastructure: `${import.meta.env.VITE_INFRASTRUCTURE_ENDPOINT || 'http://localhost:8016'}/api`,
  content_quality: `${import.meta.env.VITE_CONTENT_QUALITY_ENDPOINT || 'http://localhost:8017'}/api`,
  testing_qa: `${import.meta.env.VITE_TESTING_QA_ENDPOINT || 'http://localhost:8018'}/api`,
  deployment: `${import.meta.env.VITE_DEPLOYMENT_ENDPOINT || 'http://localhost:8019'}/api`
};

// Configure axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add auth token interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== ANALYTICS SERVICES ====================

/**
 * Get student progress overview
 * @param {Object} filters - Filter options (dateRange, studentIds, courseIds)
 * @returns {Promise<Object>} Progress data with completion rates, time spent, achievements
 */
export const getStudentProgress = async (filters = {}) => {
  try {
    const response = await axios.get(`${AGENT_ENDPOINTS.analytics}/admin/student-progress`, {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch student progress:', error);
    throw error;
  }
};

/**
 * Get engagement metrics
 * @param {Object} params - Query parameters (startDate, endDate, granularity)
 * @returns {Promise<Object>} Engagement data (DAU, MAU, session duration, retention)
 */
export const getEngagementMetrics = async (params = {}) => {
  try {
    const response = await axios.get(`${AGENT_ENDPOINTS.analytics}/admin/engagement-metrics`, {
      params
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch engagement metrics:', error);
    throw error;
  }
};

/**
 * Get content performance analytics
 * @param {Object} filters - Filter options (contentType, dateRange, sortBy)
 * @returns {Promise<Array>} Content performance data
 */
export const getContentPerformance = async (filters = {}) => {
  try {
    const response = await axios.get(`${AGENT_ENDPOINTS.analytics}/admin/content-performance`, {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch content performance:', error);
    throw error;
  }
};

/**
 * Get A/B test results
 * @param {string} testId - Optional test ID to fetch specific test
 * @returns {Promise<Array>} A/B test results with statistical significance
 */
export const getABTestResults = async (testId = null) => {
  try {
    const url = testId 
      ? `${AGENT_ENDPOINTS.analytics}/admin/ab-tests/${testId}`
      : `${AGENT_ENDPOINTS.analytics}/admin/ab-tests`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch A/B test results:', error);
    throw error;
  }
};

/**
 * Export analytics data
 * @param {Object} params - Export parameters (type, format, filters)
 * @returns {Promise<Blob>} Export file blob
 */
export const exportAnalyticsData = async (params) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.analytics}/admin/export`,
      params,
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to export analytics data:', error);
    throw error;
  }
};

// ==================== CONTENT MANAGEMENT SERVICES ====================

/**
 * Get content review queue
 * @param {Object} params - Query parameters (status, page, limit, sortBy)
 * @returns {Promise<Object>} Paginated content queue
 */
export const getContentQueue = async (params = {}) => {
  try {
    const response = await axios.get(`${AGENT_ENDPOINTS.content_ingestion}/admin/review-queue`, {
      params: {
        page: 1,
        limit: 20,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch content queue:', error);
    throw error;
  }
};

/**
 * Approve content item
 * @param {string} contentId - Content ID
 * @param {Object} data - Approval data (notes, publishDate)
 * @returns {Promise<Object>} Updated content
 */
export const approveContent = async (contentId, data = {}) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.content_ingestion}/admin/content/${contentId}/approve`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Failed to approve content:', error);
    throw error;
  }
};

/**
 * Reject content item
 * @param {string} contentId - Content ID
 * @param {Object} data - Rejection data (reason, feedback)
 * @returns {Promise<Object>} Updated content
 */
export const rejectContent = async (contentId, data) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.content_ingestion}/admin/content/${contentId}/reject`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Failed to reject content:', error);
    throw error;
  }
};

/**
 * Update content metadata
 * @param {string} contentId - Content ID
 * @param {Object} metadata - Updated metadata (tags, difficulty, prerequisites)
 * @returns {Promise<Object>} Updated content
 */
export const updateContentMetadata = async (contentId, metadata) => {
  try {
    const response = await axios.patch(
      `${AGENT_ENDPOINTS.content_ingestion}/admin/content/${contentId}/metadata`,
      metadata
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update content metadata:', error);
    throw error;
  }
};

/**
 * Get content analytics
 * @param {string} contentId - Content ID
 * @returns {Promise<Object>} Content analytics data
 */
export const getContentAnalytics = async (contentId) => {
  try {
    const response = await axios.get(
      `${AGENT_ENDPOINTS.analytics}/admin/content/${contentId}/analytics`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch content analytics:', error);
    throw error;
  }
};

/**
 * Bulk approve content
 * @param {Array<string>} contentIds - Array of content IDs
 * @param {Object} data - Approval data
 * @returns {Promise<Object>} Bulk operation result
 */
export const bulkApproveContent = async (contentIds, data = {}) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.content_ingestion}/admin/content/bulk-approve`,
      { contentIds, ...data }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to bulk approve content:', error);
    throw error;
  }
};

/**
 * Bulk reject content
 * @param {Array<string>} contentIds - Array of content IDs
 * @param {Object} data - Rejection data
 * @returns {Promise<Object>} Bulk operation result
 */
export const bulkRejectContent = async (contentIds, data) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.content_ingestion}/admin/content/bulk-reject`,
      { contentIds, ...data }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to bulk reject content:', error);
    throw error;
  }
};

// ==================== USER MANAGEMENT SERVICES ====================

/**
 * Get student roster
 * @param {Object} params - Query parameters (search, filters, page, limit)
 * @returns {Promise<Object>} Paginated student list
 */
export const getStudentRoster = async (params = {}) => {
  try {
    const response = await axios.get(`${AGENT_ENDPOINTS.orchestration}/admin/students`, {
      params: {
        page: 1,
        limit: 50,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch student roster:', error);
    throw error;
  }
};

/**
 * Get student progress report
 * @param {string} studentId - Student ID
 * @param {Object} params - Report parameters (dateRange, includeDetails)
 * @returns {Promise<Object>} Detailed progress report
 */
export const getStudentProgressReport = async (studentId, params = {}) => {
  try {
    const response = await axios.get(
      `${AGENT_ENDPOINTS.analytics}/admin/students/${studentId}/progress-report`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch student progress report:', error);
    throw error;
  }
};

/**
 * Get intervention triggers
 * @param {Object} params - Filter parameters (riskLevel, type)
 * @returns {Promise<Array>} List of students needing intervention
 */
export const getInterventionTriggers = async (params = {}) => {
  try {
    const response = await axios.get(
      `${AGENT_ENDPOINTS.learning_science}/admin/intervention-triggers`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch intervention triggers:', error);
    throw error;
  }
};

/**
 * Export student data
 * @param {Array<string>} studentIds - Array of student IDs
 * @param {Object} options - Export options (format, includeFields)
 * @returns {Promise<Blob>} Export file blob
 */
export const exportStudentData = async (studentIds, options = {}) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.orchestration}/admin/students/export`,
      { studentIds, ...options },
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to export student data:', error);
    throw error;
  }
};

/**
 * Send bulk email to students
 * @param {Array<string>} studentIds - Array of student IDs
 * @param {Object} emailData - Email content (subject, body, template)
 * @returns {Promise<Object>} Email send result
 */
export const sendBulkEmail = async (studentIds, emailData) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.orchestration}/admin/students/bulk-email`,
      { studentIds, ...emailData }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to send bulk email:', error);
    throw error;
  }
};

/**
 * Assign content to students
 * @param {Array<string>} studentIds - Array of student IDs
 * @param {Object} assignment - Assignment data (contentIds, dueDate, instructions)
 * @returns {Promise<Object>} Assignment result
 */
export const assignContentToStudents = async (studentIds, assignment) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.personalization}/admin/assign-content`,
      { studentIds, ...assignment }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to assign content:', error);
    throw error;
  }
};

/**
 * Update student status
 * @param {string} studentId - Student ID
 * @param {Object} statusData - Status update (active, suspended, notes)
 * @returns {Promise<Object>} Updated student
 */
export const updateStudentStatus = async (studentId, statusData) => {
  try {
    const response = await axios.patch(
      `${AGENT_ENDPOINTS.orchestration}/admin/students/${studentId}/status`,
      statusData
    );
    return response.data;
  } catch (error) {
    console.error('Failed to update student status:', error);
    throw error;
  }
};

// ==================== SYSTEM HEALTH SERVICES ====================

/**
 * Get all agent statuses
 * @returns {Promise<Object>} Status of all agents
 */
export const getAllAgentStatuses = async () => {
  try {
    const statusPromises = Object.entries(AGENT_ENDPOINTS).map(async ([name, endpoint]) => {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${endpoint}/health`, { timeout: 5000 });
        const latency = Date.now() - startTime;
        
        return {
          name,
          status: response.data.status || 'healthy',
          latency,
          version: response.data.version || 'unknown',
          uptime: response.data.uptime || 0,
          lastCheck: new Date().toISOString(),
          healthy: response.status === 200
        };
      } catch (error) {
        return {
          name,
          status: 'unhealthy',
          latency: null,
          version: 'unknown',
          uptime: 0,
          lastCheck: new Date().toISOString(),
          healthy: false,
          error: error.message
        };
      }
    });

    const statuses = await Promise.all(statusPromises);
    
    return {
      agents: statuses,
      summary: {
        total: statuses.length,
        healthy: statuses.filter(s => s.healthy).length,
        unhealthy: statuses.filter(s => !s.healthy).length,
        avgLatency: statuses.reduce((sum, s) => sum + (s.latency || 0), 0) / statuses.length
      }
    };
  } catch (error) {
    console.error('Failed to fetch agent statuses:', error);
    throw error;
  }
};

/**
 * Get API latency metrics
 * @param {Object} params - Query parameters (timeRange, agentName)
 * @returns {Promise<Object>} Latency metrics data
 */
export const getAPILatencyMetrics = async (params = {}) => {
  try {
    const response = await axios.get(
      `${AGENT_ENDPOINTS.infrastructure}/admin/metrics/latency`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch API latency metrics:', error);
    throw error;
  }
};

/**
 * Get error logs
 * @param {Object} params - Query parameters (level, agentName, page, limit, startDate, endDate)
 * @returns {Promise<Object>} Paginated error logs
 */
export const getErrorLogs = async (params = {}) => {
  try {
    const response = await axios.get(
      `${AGENT_ENDPOINTS.infrastructure}/admin/logs/errors`,
      {
        params: {
          page: 1,
          limit: 100,
          ...params
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch error logs:', error);
    throw error;
  }
};

/**
 * Get resource usage metrics
 * @param {Object} params - Query parameters (agentName, timeRange)
 * @returns {Promise<Object>} Resource usage data (CPU, memory, disk)
 */
export const getResourceUsage = async (params = {}) => {
  try {
    const response = await axios.get(
      `${AGENT_ENDPOINTS.infrastructure}/admin/metrics/resources`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch resource usage:', error);
    throw error;
  }
};

/**
 * Get system alerts
 * @param {Object} params - Filter parameters (severity, acknowledged, agentName)
 * @returns {Promise<Array>} System alerts
 */
export const getSystemAlerts = async (params = {}) => {
  try {
    const response = await axios.get(
      `${AGENT_ENDPOINTS.infrastructure}/admin/alerts`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system alerts:', error);
    throw error;
  }
};

/**
 * Acknowledge alert
 * @param {string} alertId - Alert ID
 * @param {Object} data - Acknowledgment data (notes, actionTaken)
 * @returns {Promise<Object>} Updated alert
 */
export const acknowledgeAlert = async (alertId, data = {}) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.infrastructure}/admin/alerts/${alertId}/acknowledge`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    throw error;
  }
};

/**
 * Configure alert thresholds
 * @param {Object} config - Alert configuration (thresholds, notifications)
 * @returns {Promise<Object>} Updated configuration
 */
export const configureAlertThresholds = async (config) => {
  try {
    const response = await axios.put(
      `${AGENT_ENDPOINTS.infrastructure}/admin/alerts/config`,
      config
    );
    return response.data;
  } catch (error) {
    console.error('Failed to configure alert thresholds:', error);
    throw error;
  }
};

/**
 * Restart agent
 * @param {string} agentName - Agent name
 * @returns {Promise<Object>} Restart result
 */
export const restartAgent = async (agentName) => {
  try {
    const response = await axios.post(
      `${AGENT_ENDPOINTS.infrastructure}/admin/agents/${agentName}/restart`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to restart agent:', error);
    throw error;
  }
};

// ==================== REAL-TIME MONITORING ====================

/**
 * Get WebSocket URL for real-time monitoring
 * @returns {string} WebSocket URL
 */
export const getWebSocketURL = () => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = import.meta.env.VITE_WS_HOST || 'localhost:8011';
  return `${wsProtocol}//${wsHost}/ws/admin`;
};

/**
 * Subscribe to real-time metrics
 * @param {WebSocket} ws - WebSocket connection
 * @param {Array<string>} metrics - Metrics to subscribe to
 */
export const subscribeToMetrics = (ws, metrics) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'subscribe',
      metrics
    }));
  }
};

/**
 * Unsubscribe from metrics
 * @param {WebSocket} ws - WebSocket connection
 * @param {Array<string>} metrics - Metrics to unsubscribe from
 */
export const unsubscribeFromMetrics = (ws, metrics) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'unsubscribe',
      metrics
    }));
  }
};

export default {
  // Analytics
  getStudentProgress,
  getEngagementMetrics,
  getContentPerformance,
  getABTestResults,
  exportAnalyticsData,
  
  // Content Management
  getContentQueue,
  approveContent,
  rejectContent,
  updateContentMetadata,
  getContentAnalytics,
  bulkApproveContent,
  bulkRejectContent,
  
  // User Management
  getStudentRoster,
  getStudentProgressReport,
  getInterventionTriggers,
  exportStudentData,
  sendBulkEmail,
  assignContentToStudents,
  updateStudentStatus,
  
  // System Health
  getAllAgentStatuses,
  getAPILatencyMetrics,
  getErrorLogs,
  getResourceUsage,
  getSystemAlerts,
  acknowledgeAlert,
  configureAlertThresholds,
  restartAgent,
  
  // Real-time
  getWebSocketURL,
  subscribeToMetrics,
  unsubscribeFromMetrics
};
