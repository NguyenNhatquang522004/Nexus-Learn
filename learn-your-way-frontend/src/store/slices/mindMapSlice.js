import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  mindmapService,
  knowledgeGraphService
} from '../../services/api';

// Async thunks
export const generateMindMap = createAsyncThunk(
  'mindMap/generateMindMap',
  async ({ conceptId, userId }, { rejectWithValue }) => {
    try {
      const response = await mindmapService.generateMindmap(conceptId);
      
      // Fetch mastery levels for the user
      let masteryData = {};
      if (userId) {
        try {
          const mastery = await knowledgeGraphService.getMastery(userId);
          masteryData = mastery.concepts || {};
        } catch (err) {
          console.error('Failed to fetch mastery data:', err);
        }
      }
      
      return {
        ...response,
        masteryData
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMindMap = createAsyncThunk(
  'mindMap/fetchMindMap',
  async ({ mindmapId, userId }, { rejectWithValue }) => {
    try {
      const response = await mindmapService.getMindmap(mindmapId);
      
      // Fetch mastery levels for the user
      let masteryData = {};
      if (userId) {
        try {
          const mastery = await knowledgeGraphService.getMastery(userId);
          masteryData = mastery.concepts || {};
        } catch (err) {
          console.error('Failed to fetch mastery data:', err);
        }
      }
      
      return {
        ...response,
        masteryData
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPrerequisiteTree = createAsyncThunk(
  'mindMap/fetchPrerequisiteTree',
  async (conceptId, { rejectWithValue }) => {
    try {
      const response = await knowledgeGraphService.getPrerequisites(conceptId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchLearningPath = createAsyncThunk(
  'mindMap/fetchLearningPath',
  async ({ userId, conceptId }, { rejectWithValue }) => {
    try {
      const response = await knowledgeGraphService.getLearningPath(userId, conceptId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const applyLayout = createAsyncThunk(
  'mindMap/applyLayout',
  async ({ graphData, layoutType }, { rejectWithValue }) => {
    try {
      const response = await mindmapService.applyLayout({
        nodes: graphData.nodes,
        edges: graphData.edges,
        layout: layoutType
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const exportMindMap = createAsyncThunk(
  'mindMap/exportMindMap',
  async ({ graphData, format }, { rejectWithValue }) => {
    try {
      const response = await mindmapService.exportMindmap({
        nodes: graphData.nodes,
        edges: graphData.edges,
        format
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  graphData: {
    nodes: [],
    edges: []
  },
  originalGraphData: null,
  layout: 'force_directed',
  selectedNode: null,
  hoveredNode: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  filters: {
    subject: null,
    difficulty: null,
    masteryLevel: null,
    showCompleted: true,
    showInProgress: true,
    showNotStarted: true
  },
  expandedNodes: [],
  highlightedPath: [],
  searchQuery: '',
  searchResults: [],
  masteryData: {},
  prerequisiteTree: null,
  learningPath: null,
  loading: {
    graph: false,
    layout: false,
    export: false,
    prerequisiteTree: false,
    learningPath: false
  },
  error: null,
  viewMode: '2d', // '2d' or '3d'
  showLabels: true,
  showEdgeLabels: false,
  nodeSize: 'normal', // 'small', 'normal', 'large'
  edgeStyle: 'curved', // 'straight', 'curved'
};

// Mind Map slice
const mindMapSlice = createSlice({
  name: 'mindMap',
  initialState,
  reducers: {
    setLayout: (state, action) => {
      state.layout = action.payload;
    },
    
    setSelectedNode: (state, action) => {
      state.selectedNode = action.payload;
    },
    
    setHoveredNode: (state, action) => {
      state.hoveredNode = action.payload;
    },
    
    setZoom: (state, action) => {
      state.zoom = action.payload;
    },
    
    setPan: (state, action) => {
      state.pan = action.payload;
    },
    
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload
      };
    },
    
    toggleNodeExpansion: (state, action) => {
      const nodeId = action.payload;
      const index = state.expandedNodes.indexOf(nodeId);
      
      if (index === -1) {
        state.expandedNodes.push(nodeId);
      } else {
        state.expandedNodes.splice(index, 1);
      }
    },
    
    expandAllNodes: (state) => {
      state.expandedNodes = state.graphData.nodes.map(node => node.id);
    },
    
    collapseAllNodes: (state) => {
      state.expandedNodes = [];
    },
    
    setHighlightedPath: (state, action) => {
      state.highlightedPath = action.payload;
    },
    
    clearHighlightedPath: (state) => {
      state.highlightedPath = [];
    },
    
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      
      if (action.payload.trim()) {
        const query = action.payload.toLowerCase();
        state.searchResults = state.graphData.nodes.filter(node =>
          node.name.toLowerCase().includes(query) ||
          node.description?.toLowerCase().includes(query)
        );
      } else {
        state.searchResults = [];
      }
    },
    
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
    },
    
    applyFilters: (state) => {
      if (!state.originalGraphData) {
        state.originalGraphData = JSON.parse(JSON.stringify(state.graphData));
      }
      
      let filteredNodes = [...state.originalGraphData.nodes];
      
      // Filter by subject
      if (state.filters.subject) {
        filteredNodes = filteredNodes.filter(node => node.subject === state.filters.subject);
      }
      
      // Filter by difficulty
      if (state.filters.difficulty) {
        filteredNodes = filteredNodes.filter(node => node.difficulty === state.filters.difficulty);
      }
      
      // Filter by mastery level
      if (state.filters.masteryLevel) {
        filteredNodes = filteredNodes.filter(node => {
          const mastery = state.masteryData[node.id] || 0;
          return mastery >= state.filters.masteryLevel[0] && mastery <= state.filters.masteryLevel[1];
        });
      }
      
      // Filter by completion status
      filteredNodes = filteredNodes.filter(node => {
        const mastery = state.masteryData[node.id] || 0;
        if (mastery === 0 && !state.filters.showNotStarted) return false;
        if (mastery > 0 && mastery < 100 && !state.filters.showInProgress) return false;
        if (mastery === 100 && !state.filters.showCompleted) return false;
        return true;
      });
      
      // Filter edges to only include those between visible nodes
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = state.originalGraphData.edges.filter(edge =>
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
      
      state.graphData = {
        nodes: filteredNodes,
        edges: filteredEdges
      };
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
      if (state.originalGraphData) {
        state.graphData = JSON.parse(JSON.stringify(state.originalGraphData));
        state.originalGraphData = null;
      }
    },
    
    updateNodePosition: (state, action) => {
      const { nodeId, x, y } = action.payload;
      const node = state.graphData.nodes.find(n => n.id === nodeId);
      if (node) {
        node.x = x;
        node.y = y;
        node.fx = x; // Fix position
        node.fy = y;
      }
    },
    
    releaseNodePosition: (state, action) => {
      const nodeId = action.payload;
      const node = state.graphData.nodes.find(n => n.id === nodeId);
      if (node) {
        delete node.fx;
        delete node.fy;
      }
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    toggleLabels: (state) => {
      state.showLabels = !state.showLabels;
    },
    
    toggleEdgeLabels: (state) => {
      state.showEdgeLabels = !state.showEdgeLabels;
    },
    
    setNodeSize: (state, action) => {
      state.nodeSize = action.payload;
    },
    
    setEdgeStyle: (state, action) => {
      state.edgeStyle = action.payload;
    },
    
    resetView: (state) => {
      state.zoom = 1;
      state.pan = { x: 0, y: 0 };
      state.selectedNode = null;
      state.hoveredNode = null;
      state.highlightedPath = [];
    },
    
    resetMindMap: (state) => {
      return {
        ...initialState,
        masteryData: state.masteryData
      };
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Generate mind map
      .addCase(generateMindMap.pending, (state) => {
        state.loading.graph = true;
        state.error = null;
      })
      .addCase(generateMindMap.fulfilled, (state, action) => {
        state.loading.graph = false;
        state.graphData = {
          nodes: action.payload.nodes || [],
          edges: action.payload.edges || []
        };
        state.masteryData = action.payload.masteryData || {};
        state.originalGraphData = null;
      })
      .addCase(generateMindMap.rejected, (state, action) => {
        state.loading.graph = false;
        state.error = action.payload || 'Failed to generate mind map';
      })
      
      // Fetch mind map
      .addCase(fetchMindMap.pending, (state) => {
        state.loading.graph = true;
        state.error = null;
      })
      .addCase(fetchMindMap.fulfilled, (state, action) => {
        state.loading.graph = false;
        state.graphData = {
          nodes: action.payload.nodes || [],
          edges: action.payload.edges || []
        };
        state.masteryData = action.payload.masteryData || {};
        state.originalGraphData = null;
      })
      .addCase(fetchMindMap.rejected, (state, action) => {
        state.loading.graph = false;
        state.error = action.payload || 'Failed to fetch mind map';
      })
      
      // Fetch prerequisite tree
      .addCase(fetchPrerequisiteTree.pending, (state) => {
        state.loading.prerequisiteTree = true;
      })
      .addCase(fetchPrerequisiteTree.fulfilled, (state, action) => {
        state.loading.prerequisiteTree = false;
        state.prerequisiteTree = action.payload;
      })
      .addCase(fetchPrerequisiteTree.rejected, (state, action) => {
        state.loading.prerequisiteTree = false;
        state.error = action.payload || 'Failed to fetch prerequisite tree';
      })
      
      // Fetch learning path
      .addCase(fetchLearningPath.pending, (state) => {
        state.loading.learningPath = true;
      })
      .addCase(fetchLearningPath.fulfilled, (state, action) => {
        state.loading.learningPath = false;
        state.learningPath = action.payload;
        
        // Highlight the learning path
        if (action.payload.path) {
          state.highlightedPath = action.payload.path;
        }
      })
      .addCase(fetchLearningPath.rejected, (state, action) => {
        state.loading.learningPath = false;
        state.error = action.payload || 'Failed to fetch learning path';
      })
      
      // Apply layout
      .addCase(applyLayout.pending, (state) => {
        state.loading.layout = true;
      })
      .addCase(applyLayout.fulfilled, (state, action) => {
        state.loading.layout = false;
        
        // Update node positions from layout
        if (action.payload.nodes) {
          action.payload.nodes.forEach(layoutNode => {
            const node = state.graphData.nodes.find(n => n.id === layoutNode.id);
            if (node) {
              node.x = layoutNode.x;
              node.y = layoutNode.y;
              if (layoutNode.z !== undefined) {
                node.z = layoutNode.z;
              }
            }
          });
        }
      })
      .addCase(applyLayout.rejected, (state, action) => {
        state.loading.layout = false;
        state.error = action.payload || 'Failed to apply layout';
      })
      
      // Export mind map
      .addCase(exportMindMap.pending, (state) => {
        state.loading.export = true;
      })
      .addCase(exportMindMap.fulfilled, (state, action) => {
        state.loading.export = false;
        
        // Trigger download
        if (action.payload.url) {
          const link = document.createElement('a');
          link.href = action.payload.url;
          link.download = action.payload.filename || 'mindmap';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      })
      .addCase(exportMindMap.rejected, (state, action) => {
        state.loading.export = false;
        state.error = action.payload || 'Failed to export mind map';
      });
  }
});

export const {
  setLayout,
  setSelectedNode,
  setHoveredNode,
  setZoom,
  setPan,
  setFilters,
  toggleNodeExpansion,
  expandAllNodes,
  collapseAllNodes,
  setHighlightedPath,
  clearHighlightedPath,
  setSearchQuery,
  clearSearch,
  applyFilters,
  clearFilters,
  updateNodePosition,
  releaseNodePosition,
  setViewMode,
  toggleLabels,
  toggleEdgeLabels,
  setNodeSize,
  setEdgeStyle,
  resetView,
  resetMindMap,
  clearError
} = mindMapSlice.actions;

export default mindMapSlice.reducer;
