import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  contentService,
  contentQualityService,
  knowledgeGraphService
} from '../../services/api';

// Async thunks
export const uploadFile = createAsyncThunk(
  'upload/uploadFile',
  async ({ file, userId, metadata }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const response = await contentService.uploadContent(formData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const pollProcessingStatus = createAsyncThunk(
  'upload/pollProcessingStatus',
  async ({ jobId }, { rejectWithValue }) => {
    try {
      const response = await contentService.getProcessingStatus(jobId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchExtractedContent = createAsyncThunk(
  'upload/fetchExtractedContent',
  async ({ fileId }, { rejectWithValue }) => {
    try {
      const response = await contentService.getExtractedContent(fileId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const validateContent = createAsyncThunk(
  'upload/validateContent',
  async ({ contentId, content }, { rejectWithValue }) => {
    try {
      const response = await contentQualityService.validateContent({
        contentId,
        content
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const publishContent = createAsyncThunk(
  'upload/publishContent',
  async ({ contentId, settings }, { rejectWithValue }) => {
    try {
      const response = await contentService.publishContent(contentId, settings);
      
      // Update knowledge graph with concepts
      if (settings.concepts && settings.concepts.length > 0) {
        await knowledgeGraphService.addNodes(settings.concepts);
      }
      
      // Create relationships if provided
      if (settings.relationships && settings.relationships.length > 0) {
        await knowledgeGraphService.addRelationships(settings.relationships);
      }
      
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const approveContent = createAsyncThunk(
  'upload/approveContent',
  async ({ contentId, approvalData }, { rejectWithValue }) => {
    try {
      const response = await contentQualityService.approveContent(contentId, approvalData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const rejectContent = createAsyncThunk(
  'upload/rejectContent',
  async ({ contentId, reason }, { rejectWithValue }) => {
    try {
      const response = await contentQualityService.rejectContent(contentId, { reason });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchContentLibrary = createAsyncThunk(
  'upload/fetchContentLibrary',
  async ({ userId, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await contentService.getUserContent(userId, filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteContent = createAsyncThunk(
  'upload/deleteContent',
  async ({ contentId }, { rejectWithValue }) => {
    try {
      const response = await contentService.deleteContent(contentId);
      return { contentId, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const duplicateContent = createAsyncThunk(
  'upload/duplicateContent',
  async ({ contentId }, { rejectWithValue }) => {
    try {
      const response = await contentService.duplicateContent(contentId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateMetadata = createAsyncThunk(
  'upload/updateMetadata',
  async ({ contentId, metadata }, { rejectWithValue }) => {
    try {
      const response = await contentService.updateContentMetadata(contentId, metadata);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const reprocessContent = createAsyncThunk(
  'upload/reprocessContent',
  async ({ fileId }, { rejectWithValue }) => {
    try {
      const response = await contentService.reprocessFile(fileId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  // Upload state
  uploadProgress: 0,
  uploading: false,
  uploadedFile: null,
  
  // Processing state
  processing: false,
  jobId: null,
  processingStatus: {
    stage: 'idle', // idle, uploading, extracting, analyzing, creating_graph, quality_check, complete, error
    progress: 0,
    message: '',
    logs: [],
    estimatedTime: null
  },
  
  // Extracted content
  extractedContent: {
    text: '',
    images: [],
    concepts: [],
    relationships: [],
    metadata: {}
  },
  
  // Metadata form
  metadata: {
    title: '',
    subject: '',
    gradeLevel: '',
    difficulty: 'medium',
    language: 'en',
    tags: [],
    description: '',
    author: '',
    source: ''
  },
  
  // Concept graph
  conceptGraph: {
    nodes: [],
    edges: []
  },
  
  // Quality check results
  qualityCheck: {
    score: 0,
    factCheck: null,
    safetyCheck: null,
    plagiarismCheck: null,
    biasCheck: null,
    issues: [],
    passed: false
  },
  
  // Publish settings
  publishSettings: {
    visibility: 'private', // private, class, school, public
    accessControl: {
      classes: [],
      students: []
    },
    scheduledPublish: null,
    notifications: {
      notifyStudents: true,
      addToStudyPlan: false
    }
  },
  
  // Content library
  contentLibrary: [],
  libraryFilters: {
    search: '',
    subject: null,
    status: null, // draft, published, archived
    sortBy: 'createdAt', // createdAt, updatedAt, title, views
    sortOrder: 'desc'
  },
  
  // Recent uploads
  recentUploads: [],
  
  // UI state
  currentStep: 'upload', // upload, processing, preview, quality, publish, complete
  selectedContent: null,
  
  // Loading states
  loading: {
    upload: false,
    status: false,
    extract: false,
    validate: false,
    publish: false,
    approve: false,
    library: false,
    delete: false,
    duplicate: false,
    metadata: false,
    reprocess: false
  },
  
  error: null
};

// Upload slice
const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    
    setProcessingStatus: (state, action) => {
      state.processingStatus = {
        ...state.processingStatus,
        ...action.payload
      };
    },
    
    addProcessingLog: (state, action) => {
      state.processingStatus.logs.push({
        timestamp: new Date().toISOString(),
        message: action.payload
      });
    },
    
    setMetadata: (state, action) => {
      state.metadata = {
        ...state.metadata,
        ...action.payload
      };
    },
    
    updateMetadataField: (state, action) => {
      const { field, value } = action.payload;
      state.metadata[field] = value;
    },
    
    addTag: (state, action) => {
      if (!state.metadata.tags.includes(action.payload)) {
        state.metadata.tags.push(action.payload);
      }
    },
    
    removeTag: (state, action) => {
      state.metadata.tags = state.metadata.tags.filter(tag => tag !== action.payload);
    },
    
    setConceptGraph: (state, action) => {
      state.conceptGraph = action.payload;
    },
    
    updateConceptNode: (state, action) => {
      const { nodeId, updates } = action.payload;
      const node = state.conceptGraph.nodes.find(n => n.id === nodeId);
      if (node) {
        Object.assign(node, updates);
      }
    },
    
    addConceptNode: (state, action) => {
      state.conceptGraph.nodes.push(action.payload);
    },
    
    removeConceptNode: (state, action) => {
      const nodeId = action.payload;
      state.conceptGraph.nodes = state.conceptGraph.nodes.filter(n => n.id !== nodeId);
      state.conceptGraph.edges = state.conceptGraph.edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
    },
    
    addConceptEdge: (state, action) => {
      state.conceptGraph.edges.push(action.payload);
    },
    
    removeConceptEdge: (state, action) => {
      const { source, target } = action.payload;
      state.conceptGraph.edges = state.conceptGraph.edges.filter(
        e => !(e.source === source && e.target === target)
      );
    },
    
    setPublishSettings: (state, action) => {
      state.publishSettings = {
        ...state.publishSettings,
        ...action.payload
      };
    },
    
    updatePublishSetting: (state, action) => {
      const { field, value } = action.payload;
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        state.publishSettings[parent][child] = value;
      } else {
        state.publishSettings[field] = value;
      }
    },
    
    setLibraryFilters: (state, action) => {
      state.libraryFilters = {
        ...state.libraryFilters,
        ...action.payload
      };
    },
    
    updateLibraryFilter: (state, action) => {
      const { field, value } = action.payload;
      state.libraryFilters[field] = value;
    },
    
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    
    nextStep: (state) => {
      const steps = ['upload', 'processing', 'preview', 'quality', 'publish', 'complete'];
      const currentIndex = steps.indexOf(state.currentStep);
      if (currentIndex < steps.length - 1) {
        state.currentStep = steps[currentIndex + 1];
      }
    },
    
    previousStep: (state) => {
      const steps = ['upload', 'processing', 'preview', 'quality', 'publish', 'complete'];
      const currentIndex = steps.indexOf(state.currentStep);
      if (currentIndex > 0) {
        state.currentStep = steps[currentIndex - 1];
      }
    },
    
    setSelectedContent: (state, action) => {
      state.selectedContent = action.payload;
    },
    
    addRecentUpload: (state, action) => {
      state.recentUploads.unshift(action.payload);
      if (state.recentUploads.length > 10) {
        state.recentUploads.pop();
      }
    },
    
    resetUpload: (state) => {
      state.uploadProgress = 0;
      state.uploading = false;
      state.uploadedFile = null;
      state.processing = false;
      state.jobId = null;
      state.processingStatus = initialState.processingStatus;
      state.extractedContent = initialState.extractedContent;
      state.metadata = initialState.metadata;
      state.conceptGraph = initialState.conceptGraph;
      state.qualityCheck = initialState.qualityCheck;
      state.publishSettings = initialState.publishSettings;
      state.currentStep = 'upload';
      state.error = null;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.loading.upload = true;
        state.uploading = true;
        state.uploadProgress = 0;
        state.error = null;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.loading.upload = false;
        state.uploading = false;
        state.uploadProgress = 100;
        state.uploadedFile = action.payload.file;
        state.jobId = action.payload.jobId;
        state.processing = true;
        state.currentStep = 'processing';
        state.addRecentUpload = action.payload;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loading.upload = false;
        state.uploading = false;
        state.error = action.payload || 'Failed to upload file';
      })
      
      // Poll processing status
      .addCase(pollProcessingStatus.pending, (state) => {
        state.loading.status = true;
      })
      .addCase(pollProcessingStatus.fulfilled, (state, action) => {
        state.loading.status = false;
        state.processingStatus = {
          ...state.processingStatus,
          stage: action.payload.stage,
          progress: action.payload.progress,
          message: action.payload.message,
          estimatedTime: action.payload.estimatedTime
        };
        
        if (action.payload.stage === 'complete') {
          state.processing = false;
          state.currentStep = 'preview';
        } else if (action.payload.stage === 'error') {
          state.processing = false;
          state.error = action.payload.message;
        }
      })
      .addCase(pollProcessingStatus.rejected, (state, action) => {
        state.loading.status = false;
        state.error = action.payload || 'Failed to fetch processing status';
      })
      
      // Fetch extracted content
      .addCase(fetchExtractedContent.pending, (state) => {
        state.loading.extract = true;
      })
      .addCase(fetchExtractedContent.fulfilled, (state, action) => {
        state.loading.extract = false;
        state.extractedContent = action.payload;
        
        // Initialize metadata from extracted content
        if (action.payload.metadata) {
          state.metadata = {
            ...state.metadata,
            ...action.payload.metadata
          };
        }
        
        // Initialize concept graph
        if (action.payload.concepts) {
          state.conceptGraph.nodes = action.payload.concepts;
        }
        if (action.payload.relationships) {
          state.conceptGraph.edges = action.payload.relationships;
        }
      })
      .addCase(fetchExtractedContent.rejected, (state, action) => {
        state.loading.extract = false;
        state.error = action.payload || 'Failed to fetch extracted content';
      })
      
      // Validate content
      .addCase(validateContent.pending, (state) => {
        state.loading.validate = true;
      })
      .addCase(validateContent.fulfilled, (state, action) => {
        state.loading.validate = false;
        state.qualityCheck = action.payload;
        
        if (action.payload.passed) {
          state.currentStep = 'publish';
        }
      })
      .addCase(validateContent.rejected, (state, action) => {
        state.loading.validate = false;
        state.error = action.payload || 'Failed to validate content';
      })
      
      // Publish content
      .addCase(publishContent.pending, (state) => {
        state.loading.publish = true;
      })
      .addCase(publishContent.fulfilled, (state, action) => {
        state.loading.publish = false;
        state.currentStep = 'complete';
        
        // Add to library
        state.contentLibrary.unshift(action.payload);
      })
      .addCase(publishContent.rejected, (state, action) => {
        state.loading.publish = false;
        state.error = action.payload || 'Failed to publish content';
      })
      
      // Approve content
      .addCase(approveContent.pending, (state) => {
        state.loading.approve = true;
      })
      .addCase(approveContent.fulfilled, (state, action) => {
        state.loading.approve = false;
        state.qualityCheck.passed = true;
      })
      .addCase(approveContent.rejected, (state, action) => {
        state.loading.approve = false;
        state.error = action.payload || 'Failed to approve content';
      })
      
      // Reject content
      .addCase(rejectContent.pending, (state) => {
        state.loading.approve = true;
      })
      .addCase(rejectContent.fulfilled, (state) => {
        state.loading.approve = false;
        state.qualityCheck.passed = false;
        state.currentStep = 'preview';
      })
      .addCase(rejectContent.rejected, (state, action) => {
        state.loading.approve = false;
        state.error = action.payload || 'Failed to reject content';
      })
      
      // Fetch content library
      .addCase(fetchContentLibrary.pending, (state) => {
        state.loading.library = true;
      })
      .addCase(fetchContentLibrary.fulfilled, (state, action) => {
        state.loading.library = false;
        state.contentLibrary = action.payload.contents || action.payload;
      })
      .addCase(fetchContentLibrary.rejected, (state, action) => {
        state.loading.library = false;
        state.error = action.payload || 'Failed to fetch content library';
      })
      
      // Delete content
      .addCase(deleteContent.pending, (state) => {
        state.loading.delete = true;
      })
      .addCase(deleteContent.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.contentLibrary = state.contentLibrary.filter(
          content => content.id !== action.payload.contentId
        );
      })
      .addCase(deleteContent.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload || 'Failed to delete content';
      })
      
      // Duplicate content
      .addCase(duplicateContent.pending, (state) => {
        state.loading.duplicate = true;
      })
      .addCase(duplicateContent.fulfilled, (state, action) => {
        state.loading.duplicate = false;
        state.contentLibrary.unshift(action.payload);
      })
      .addCase(duplicateContent.rejected, (state, action) => {
        state.loading.duplicate = false;
        state.error = action.payload || 'Failed to duplicate content';
      })
      
      // Update metadata
      .addCase(updateMetadata.pending, (state) => {
        state.loading.metadata = true;
      })
      .addCase(updateMetadata.fulfilled, (state, action) => {
        state.loading.metadata = false;
        state.metadata = action.payload.metadata;
        
        // Update in library if exists
        const content = state.contentLibrary.find(c => c.id === action.payload.id);
        if (content) {
          content.metadata = action.payload.metadata;
        }
      })
      .addCase(updateMetadata.rejected, (state, action) => {
        state.loading.metadata = false;
        state.error = action.payload || 'Failed to update metadata';
      })
      
      // Reprocess content
      .addCase(reprocessContent.pending, (state) => {
        state.loading.reprocess = true;
      })
      .addCase(reprocessContent.fulfilled, (state, action) => {
        state.loading.reprocess = false;
        state.jobId = action.payload.jobId;
        state.processing = true;
        state.currentStep = 'processing';
      })
      .addCase(reprocessContent.rejected, (state, action) => {
        state.loading.reprocess = false;
        state.error = action.payload || 'Failed to reprocess content';
      });
  }
});

export const {
  setUploadProgress,
  setProcessingStatus,
  addProcessingLog,
  setMetadata,
  updateMetadataField,
  addTag,
  removeTag,
  setConceptGraph,
  updateConceptNode,
  addConceptNode,
  removeConceptNode,
  addConceptEdge,
  removeConceptEdge,
  setPublishSettings,
  updatePublishSetting,
  setLibraryFilters,
  updateLibraryFilter,
  setCurrentStep,
  nextStep,
  previousStep,
  setSelectedContent,
  addRecentUpload,
  resetUpload,
  clearError
} = uploadSlice.actions;

export default uploadSlice.reducer;
