import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from '../../services/adminService';

// ==================== ASYNC THUNKS ====================

// Analytics Thunks
export const fetchStudentProgress = createAsyncThunk(
  'admin/fetchStudentProgress',
  async (filters, { rejectWithValue }) => {
    try {
      return await adminService.getStudentProgress(filters);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchEngagementMetrics = createAsyncThunk(
  'admin/fetchEngagementMetrics',
  async (params, { rejectWithValue }) => {
    try {
      return await adminService.getEngagementMetrics(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchContentPerformance = createAsyncThunk(
  'admin/fetchContentPerformance',
  async (filters, { rejectWithValue }) => {
    try {
      return await adminService.getContentPerformance(filters);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchABTestResults = createAsyncThunk(
  'admin/fetchABTestResults',
  async (testId, { rejectWithValue }) => {
    try {
      return await adminService.getABTestResults(testId);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const exportAnalytics = createAsyncThunk(
  'admin/exportAnalytics',
  async (params, { rejectWithValue }) => {
    try {
      const blob = await adminService.exportAnalyticsData(params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${Date.now()}.${params.format || 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Content Management Thunks
export const fetchContentQueue = createAsyncThunk(
  'admin/fetchContentQueue',
  async (params, { rejectWithValue }) => {
    try {
      return await adminService.getContentQueue(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approveContentItem = createAsyncThunk(
  'admin/approveContentItem',
  async ({ contentId, data }, { rejectWithValue }) => {
    try {
      return await adminService.approveContent(contentId, data);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectContentItem = createAsyncThunk(
  'admin/rejectContentItem',
  async ({ contentId, data }, { rejectWithValue }) => {
    try {
      return await adminService.rejectContent(contentId, data);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateContentMetadata = createAsyncThunk(
  'admin/updateContentMetadata',
  async ({ contentId, metadata }, { rejectWithValue }) => {
    try {
      return await adminService.updateContentMetadata(contentId, metadata);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchContentAnalytics = createAsyncThunk(
  'admin/fetchContentAnalytics',
  async (contentId, { rejectWithValue }) => {
    try {
      return await adminService.getContentAnalytics(contentId);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const bulkApproveContent = createAsyncThunk(
  'admin/bulkApproveContent',
  async ({ contentIds, data }, { rejectWithValue }) => {
    try {
      return await adminService.bulkApproveContent(contentIds, data);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const bulkRejectContent = createAsyncThunk(
  'admin/bulkRejectContent',
  async ({ contentIds, data }, { rejectWithValue }) => {
    try {
      return await adminService.bulkRejectContent(contentIds, data);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// User Management Thunks
export const fetchStudentRoster = createAsyncThunk(
  'admin/fetchStudentRoster',
  async (params, { rejectWithValue }) => {
    try {
      return await adminService.getStudentRoster(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchStudentProgressReport = createAsyncThunk(
  'admin/fetchStudentProgressReport',
  async ({ studentId, params }, { rejectWithValue }) => {
    try {
      return await adminService.getStudentProgressReport(studentId, params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchInterventionTriggers = createAsyncThunk(
  'admin/fetchInterventionTriggers',
  async (params, { rejectWithValue }) => {
    try {
      return await adminService.getInterventionTriggers(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const exportStudents = createAsyncThunk(
  'admin/exportStudents',
  async ({ studentIds, options }, { rejectWithValue }) => {
    try {
      const blob = await adminService.exportStudentData(studentIds, options);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `students-${Date.now()}.${options.format || 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const sendBulkEmailToStudents = createAsyncThunk(
  'admin/sendBulkEmailToStudents',
  async ({ studentIds, emailData }, { rejectWithValue }) => {
    try {
      return await adminService.sendBulkEmail(studentIds, emailData);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const assignContent = createAsyncThunk(
  'admin/assignContent',
  async ({ studentIds, assignment }, { rejectWithValue }) => {
    try {
      return await adminService.assignContentToStudents(studentIds, assignment);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateStudentStatus = createAsyncThunk(
  'admin/updateStudentStatus',
  async ({ studentId, statusData }, { rejectWithValue }) => {
    try {
      return await adminService.updateStudentStatus(studentId, statusData);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// System Health Thunks
export const fetchAgentStatuses = createAsyncThunk(
  'admin/fetchAgentStatuses',
  async (_, { rejectWithValue }) => {
    try {
      return await adminService.getAllAgentStatuses();
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAPILatencyMetrics = createAsyncThunk(
  'admin/fetchAPILatencyMetrics',
  async (params, { rejectWithValue }) => {
    try {
      return await adminService.getAPILatencyMetrics(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchErrorLogs = createAsyncThunk(
  'admin/fetchErrorLogs',
  async (params, { rejectWithValue }) => {
    try {
      return await adminService.getErrorLogs(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchResourceUsage = createAsyncThunk(
  'admin/fetchResourceUsage',
  async (params, { rejectWithValue }) => {
    try {
      return await adminService.getResourceUsage(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSystemAlerts = createAsyncThunk(
  'admin/fetchSystemAlerts',
  async (params, { rejectWithValue }) => {
    try {
      return await adminService.getSystemAlerts(params);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const acknowledgeAlert = createAsyncThunk(
  'admin/acknowledgeAlert',
  async ({ alertId, data }, { rejectWithValue }) => {
    try {
      return await adminService.acknowledgeAlert(alertId, data);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const configureAlerts = createAsyncThunk(
  'admin/configureAlerts',
  async (config, { rejectWithValue }) => {
    try {
      return await adminService.configureAlertThresholds(config);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const restartAgent = createAsyncThunk(
  'admin/restartAgent',
  async (agentName, { rejectWithValue }) => {
    try {
      return await adminService.restartAgent(agentName);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==================== INITIAL STATE ====================

const initialState = {
  // Analytics
  analytics: {
    studentProgress: null,
    engagementMetrics: null,
    contentPerformance: [],
    abTestResults: [],
    loading: false,
    error: null
  },
  
  // Content Management
  content: {
    queue: {
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    },
    selectedContent: null,
    contentAnalytics: null,
    filters: {
      status: 'pending',
      sortBy: 'submittedAt',
      sortOrder: 'desc'
    },
    loading: false,
    error: null
  },
  
  // User Management
  users: {
    roster: {
      students: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      }
    },
    selectedStudent: null,
    progressReport: null,
    interventionTriggers: [],
    filters: {
      search: '',
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    },
    loading: false,
    error: null
  },
  
  // System Health
  system: {
    agentStatuses: {
      agents: [],
      summary: {
        total: 0,
        healthy: 0,
        unhealthy: 0,
        avgLatency: 0
      }
    },
    latencyMetrics: null,
    errorLogs: {
      logs: [],
      pagination: {
        page: 1,
        limit: 100,
        total: 0,
        totalPages: 0
      }
    },
    resourceUsage: null,
    alerts: [],
    alertConfig: null,
    loading: false,
    error: null
  },
  
  // Real-time updates
  realtime: {
    connected: false,
    lastUpdate: null,
    metrics: {}
  }
};

// ==================== SLICE ====================

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    // Content filters
    setContentFilters: (state, action) => {
      state.content.filters = { ...state.content.filters, ...action.payload };
    },
    resetContentFilters: (state) => {
      state.content.filters = initialState.content.filters;
    },
    setSelectedContent: (state, action) => {
      state.content.selectedContent = action.payload;
    },
    
    // User filters
    setUserFilters: (state, action) => {
      state.users.filters = { ...state.users.filters, ...action.payload };
    },
    resetUserFilters: (state) => {
      state.users.filters = initialState.users.filters;
    },
    setSelectedStudent: (state, action) => {
      state.users.selectedStudent = action.payload;
    },
    
    // Real-time updates
    setRealtimeConnection: (state, action) => {
      state.realtime.connected = action.payload;
    },
    updateRealtimeMetric: (state, action) => {
      const { metric, data } = action.payload;
      state.realtime.metrics[metric] = data;
      state.realtime.lastUpdate = new Date().toISOString();
    },
    updateAgentStatus: (state, action) => {
      const updatedAgent = action.payload;
      const index = state.system.agentStatuses.agents.findIndex(
        a => a.name === updatedAgent.name
      );
      if (index !== -1) {
        state.system.agentStatuses.agents[index] = updatedAgent;
      }
    },
    addErrorLog: (state, action) => {
      state.system.errorLogs.logs.unshift(action.payload);
      state.system.errorLogs.pagination.total += 1;
    },
    addSystemAlert: (state, action) => {
      state.system.alerts.unshift(action.payload);
    },
    
    // Clear errors
    clearAnalyticsError: (state) => {
      state.analytics.error = null;
    },
    clearContentError: (state) => {
      state.content.error = null;
    },
    clearUsersError: (state) => {
      state.users.error = null;
    },
    clearSystemError: (state) => {
      state.system.error = null;
    }
  },
  extraReducers: (builder) => {
    // ==================== ANALYTICS ====================
    builder
      .addCase(fetchStudentProgress.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchStudentProgress.fulfilled, (state, action) => {
        state.analytics.loading = false;
        state.analytics.studentProgress = action.payload;
      })
      .addCase(fetchStudentProgress.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload;
      })
      
      .addCase(fetchEngagementMetrics.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchEngagementMetrics.fulfilled, (state, action) => {
        state.analytics.loading = false;
        state.analytics.engagementMetrics = action.payload;
      })
      .addCase(fetchEngagementMetrics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload;
      })
      
      .addCase(fetchContentPerformance.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchContentPerformance.fulfilled, (state, action) => {
        state.analytics.loading = false;
        state.analytics.contentPerformance = action.payload;
      })
      .addCase(fetchContentPerformance.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload;
      })
      
      .addCase(fetchABTestResults.pending, (state) => {
        state.analytics.loading = true;
        state.analytics.error = null;
      })
      .addCase(fetchABTestResults.fulfilled, (state, action) => {
        state.analytics.loading = false;
        state.analytics.abTestResults = action.payload;
      })
      .addCase(fetchABTestResults.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload;
      });
    
    // ==================== CONTENT MANAGEMENT ====================
    builder
      .addCase(fetchContentQueue.pending, (state) => {
        state.content.loading = true;
        state.content.error = null;
      })
      .addCase(fetchContentQueue.fulfilled, (state, action) => {
        state.content.loading = false;
        state.content.queue.items = action.payload.items || [];
        state.content.queue.pagination = action.payload.pagination || initialState.content.queue.pagination;
      })
      .addCase(fetchContentQueue.rejected, (state, action) => {
        state.content.loading = false;
        state.content.error = action.payload;
      })
      
      .addCase(approveContentItem.fulfilled, (state, action) => {
        const index = state.content.queue.items.findIndex(
          item => item.id === action.payload.id
        );
        if (index !== -1) {
          state.content.queue.items[index] = action.payload;
        }
      })
      
      .addCase(rejectContentItem.fulfilled, (state, action) => {
        const index = state.content.queue.items.findIndex(
          item => item.id === action.payload.id
        );
        if (index !== -1) {
          state.content.queue.items[index] = action.payload;
        }
      })
      
      .addCase(updateContentMetadata.fulfilled, (state, action) => {
        const index = state.content.queue.items.findIndex(
          item => item.id === action.payload.id
        );
        if (index !== -1) {
          state.content.queue.items[index] = action.payload;
        }
      })
      
      .addCase(fetchContentAnalytics.fulfilled, (state, action) => {
        state.content.contentAnalytics = action.payload;
      })
      
      .addCase(bulkApproveContent.fulfilled, (state, action) => {
        const approvedIds = action.payload.successIds || [];
        state.content.queue.items = state.content.queue.items.map(item =>
          approvedIds.includes(item.id) ? { ...item, status: 'approved' } : item
        );
      })
      
      .addCase(bulkRejectContent.fulfilled, (state, action) => {
        const rejectedIds = action.payload.successIds || [];
        state.content.queue.items = state.content.queue.items.map(item =>
          rejectedIds.includes(item.id) ? { ...item, status: 'rejected' } : item
        );
      });
    
    // ==================== USER MANAGEMENT ====================
    builder
      .addCase(fetchStudentRoster.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchStudentRoster.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.roster.students = action.payload.students || [];
        state.users.roster.pagination = action.payload.pagination || initialState.users.roster.pagination;
      })
      .addCase(fetchStudentRoster.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })
      
      .addCase(fetchStudentProgressReport.pending, (state) => {
        state.users.loading = true;
        state.users.error = null;
      })
      .addCase(fetchStudentProgressReport.fulfilled, (state, action) => {
        state.users.loading = false;
        state.users.progressReport = action.payload;
      })
      .addCase(fetchStudentProgressReport.rejected, (state, action) => {
        state.users.loading = false;
        state.users.error = action.payload;
      })
      
      .addCase(fetchInterventionTriggers.fulfilled, (state, action) => {
        state.users.interventionTriggers = action.payload;
      })
      
      .addCase(updateStudentStatus.fulfilled, (state, action) => {
        const index = state.users.roster.students.findIndex(
          s => s.id === action.payload.id
        );
        if (index !== -1) {
          state.users.roster.students[index] = action.payload;
        }
      });
    
    // ==================== SYSTEM HEALTH ====================
    builder
      .addCase(fetchAgentStatuses.pending, (state) => {
        state.system.loading = true;
        state.system.error = null;
      })
      .addCase(fetchAgentStatuses.fulfilled, (state, action) => {
        state.system.loading = false;
        state.system.agentStatuses = action.payload;
      })
      .addCase(fetchAgentStatuses.rejected, (state, action) => {
        state.system.loading = false;
        state.system.error = action.payload;
      })
      
      .addCase(fetchAPILatencyMetrics.fulfilled, (state, action) => {
        state.system.latencyMetrics = action.payload;
      })
      
      .addCase(fetchErrorLogs.pending, (state) => {
        state.system.loading = true;
        state.system.error = null;
      })
      .addCase(fetchErrorLogs.fulfilled, (state, action) => {
        state.system.loading = false;
        state.system.errorLogs.logs = action.payload.logs || [];
        state.system.errorLogs.pagination = action.payload.pagination || initialState.system.errorLogs.pagination;
      })
      .addCase(fetchErrorLogs.rejected, (state, action) => {
        state.system.loading = false;
        state.system.error = action.payload;
      })
      
      .addCase(fetchResourceUsage.fulfilled, (state, action) => {
        state.system.resourceUsage = action.payload;
      })
      
      .addCase(fetchSystemAlerts.fulfilled, (state, action) => {
        state.system.alerts = action.payload;
      })
      
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const index = state.system.alerts.findIndex(
          a => a.id === action.payload.id
        );
        if (index !== -1) {
          state.system.alerts[index] = action.payload;
        }
      })
      
      .addCase(configureAlerts.fulfilled, (state, action) => {
        state.system.alertConfig = action.payload;
      });
  }
});

// ==================== ACTIONS ====================

export const {
  setContentFilters,
  resetContentFilters,
  setSelectedContent,
  setUserFilters,
  resetUserFilters,
  setSelectedStudent,
  setRealtimeConnection,
  updateRealtimeMetric,
  updateAgentStatus,
  addErrorLog,
  addSystemAlert,
  clearAnalyticsError,
  clearContentError,
  clearUsersError,
  clearSystemError
} = adminSlice.actions;

// ==================== SELECTORS ====================

// Analytics selectors
export const selectStudentProgress = (state) => state.admin.analytics.studentProgress;
export const selectEngagementMetrics = (state) => state.admin.analytics.engagementMetrics;
export const selectContentPerformance = (state) => state.admin.analytics.contentPerformance;
export const selectABTestResults = (state) => state.admin.analytics.abTestResults;
export const selectAnalyticsLoading = (state) => state.admin.analytics.loading;
export const selectAnalyticsError = (state) => state.admin.analytics.error;

// Content selectors
export const selectContentQueue = (state) => state.admin.content.queue.items;
export const selectContentPagination = (state) => state.admin.content.queue.pagination;
export const selectContentFilters = (state) => state.admin.content.filters;
export const selectSelectedContent = (state) => state.admin.content.selectedContent;
export const selectContentAnalytics = (state) => state.admin.content.contentAnalytics;
export const selectContentLoading = (state) => state.admin.content.loading;
export const selectContentError = (state) => state.admin.content.error;

// Filtered content queue
export const selectFilteredContentQueue = (state) => {
  const { items } = state.admin.content.queue;
  const { status, sortBy, sortOrder } = state.admin.content.filters;
  
  let filtered = items;
  
  if (status !== 'all') {
    filtered = filtered.filter(item => item.status === status);
  }
  
  filtered.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return filtered;
};

// User selectors
export const selectStudentRoster = (state) => state.admin.users.roster.students;
export const selectRosterPagination = (state) => state.admin.users.roster.pagination;
export const selectUserFilters = (state) => state.admin.users.filters;
export const selectSelectedStudent = (state) => state.admin.users.selectedStudent;
export const selectProgressReport = (state) => state.admin.users.progressReport;
export const selectInterventionTriggers = (state) => state.admin.users.interventionTriggers;
export const selectUsersLoading = (state) => state.admin.users.loading;
export const selectUsersError = (state) => state.admin.users.error;

// Filtered student roster
export const selectFilteredStudentRoster = (state) => {
  const { students } = state.admin.users.roster;
  const { search, status, sortBy, sortOrder } = state.admin.users.filters;
  
  let filtered = students;
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(student =>
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    );
  }
  
  if (status !== 'all') {
    filtered = filtered.filter(student => student.status === status);
  }
  
  filtered.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return filtered;
};

// System selectors
export const selectAgentStatuses = (state) => state.admin.system.agentStatuses;
export const selectHealthySummary = (state) => state.admin.system.agentStatuses.summary;
export const selectLatencyMetrics = (state) => state.admin.system.latencyMetrics;
export const selectErrorLogs = (state) => state.admin.system.errorLogs.logs;
export const selectErrorLogsPagination = (state) => state.admin.system.errorLogs.pagination;
export const selectResourceUsage = (state) => state.admin.system.resourceUsage;
export const selectSystemAlerts = (state) => state.admin.system.alerts;
export const selectAlertConfig = (state) => state.admin.system.alertConfig;
export const selectSystemLoading = (state) => state.admin.system.loading;
export const selectSystemError = (state) => state.admin.system.error;

// Unacknowledged alerts
export const selectUnacknowledgedAlerts = (state) => {
  return state.admin.system.alerts.filter(alert => !alert.acknowledged);
};

// Critical alerts
export const selectCriticalAlerts = (state) => {
  return state.admin.system.alerts.filter(
    alert => alert.severity === 'critical' && !alert.acknowledged
  );
};

// Real-time selectors
export const selectRealtimeConnection = (state) => state.admin.realtime.connected;
export const selectRealtimeMetrics = (state) => state.admin.realtime.metrics;
export const selectLastUpdate = (state) => state.admin.realtime.lastUpdate;

export default adminSlice.reducer;
