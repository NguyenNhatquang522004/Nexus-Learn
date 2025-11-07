import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import D3Visualization from '../components/mindmap/D3Visualization';
import ToolBar from '../components/mindmap/ToolBar';
import NodeDetails from '../components/mindmap/NodeDetails';
import {
  generateMindMap,
  fetchMindMap,
  fetchLearningPath,
  applyLayout,
  setLayout,
  setSelectedNode,
  setHoveredNode,
  setZoom,
  setPan,
  setFilters,
  applyFilters,
  clearFilters,
  resetView,
  setSearchQuery,
  toggleLabels
} from '../store/slices/mindMapSlice';
import './MindMapViewer.css';

const MindMapViewer = () => {
  const { conceptId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const containerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showPathModal, setShowPathModal] = useState(false);

  const {
    graphData,
    layout,
    selectedNode,
    hoveredNode,
    zoom,
    pan,
    filters,
    highlightedPath,
    searchResults,
    masteryData,
    learningPath,
    prerequisiteTree,
    showLabels,
    loading,
    error
  } = useSelector(state => state.mindMap);

  const { user } = useSelector(state => state.auth);

  // Extract unique subjects from nodes
  const subjects = [...new Set(graphData.nodes.map(node => node.subject).filter(Boolean))];

  // Load mind map on mount
  useEffect(() => {
    if (conceptId) {
      if (conceptId.startsWith('mindmap-')) {
        dispatch(fetchMindMap({ mindmapId: conceptId, userId: user?.id }));
      } else {
        dispatch(generateMindMap({ conceptId, userId: user?.id }));
      }
    }
  }, [conceptId, user?.id, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case '0':
          handleResetView();
          break;
        case 'Escape':
          dispatch(setSelectedNode(null));
          setContextMenu(null);
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.querySelector('.search-input')?.focus();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, zoom]);

  // Close context menu on click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleLayoutChange = (newLayout) => {
    dispatch(setLayout(newLayout));
    
    // Apply layout transformation via backend
    if (graphData.nodes.length > 0) {
      dispatch(applyLayout({ graphData, layoutType: newLayout }));
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    dispatch(setZoom(newZoom));
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    dispatch(setZoom(newZoom));
  };

  const handleResetView = () => {
    dispatch(resetView());
  };

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    dispatch(applyFilters());
  };

  const handleSearch = (query) => {
    dispatch(setSearchQuery(query));
    
    // Focus on first search result
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      dispatch(setSelectedNode(firstResult.id));
      
      // Center view on node (simplified)
      // In production, calculate proper pan values based on node position
    }
  };

  const handleNodeClick = (node) => {
    dispatch(setSelectedNode(node.id));
  };

  const handleNodeDoubleClick = (node) => {
    navigate(`/content/${node.id}`);
  };

  const handleNodeHover = (nodeId) => {
    dispatch(setHoveredNode(nodeId));
  };

  const handleNodeContextMenu = (node, event) => {
    setContextMenu({
      node,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleShowPath = () => {
    if (selectedNode && user?.id) {
      dispatch(fetchLearningPath({ userId: user.id, conceptId: selectedNode }));
      setShowPathModal(true);
    }
  };

  const handleContextMenuAction = (action, node) => {
    switch (action) {
      case 'learn':
        navigate(`/content/${node.id}`);
        break;
      case 'quiz':
        navigate(`/quiz/${node.id}`);
        break;
      case 'bookmark':
        // Implement bookmark functionality
        console.log('Bookmark', node.id);
        break;
      case 'path':
        dispatch(setSelectedNode(node.id));
        handleShowPath();
        break;
      default:
        break;
    }
    setContextMenu(null);
  };

  const handleToggleLabels = () => {
    dispatch(toggleLabels());
  };

  const handleNodeNavigate = (nodeId) => {
    if (nodeId) {
      dispatch(setSelectedNode(nodeId));
    } else {
      dispatch(setSelectedNode(null));
    }
  };

  const selectedNodeData = selectedNode
    ? graphData.nodes.find(n => n.id === selectedNode)
    : null;

  const selectedNodeMastery = selectedNode
    ? masteryData[selectedNode] || 0
    : 0;

  const selectedNodePrerequisites = selectedNode && prerequisiteTree
    ? prerequisiteTree.prerequisites || []
    : [];

  const selectedNodeRelated = selectedNode
    ? graphData.edges
        .filter(e => e.source === selectedNode || e.target === selectedNode)
        .map(e => {
          const relatedId = e.source === selectedNode ? e.target : e.source;
          return graphData.nodes.find(n => n.id === relatedId);
        })
        .filter(Boolean)
        .slice(0, 4)
    : [];

  if (loading.graph) {
    return (
      <div className="mind-map-loading">
        <FaSpinner className="spinner" />
        <p>Loading mind map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mind-map-error">
        <FaExclamationTriangle className="error-icon" />
        <h2>Failed to Load Mind Map</h2>
        <p>{error}</p>
        <button
          className="retry-button"
          onClick={() => {
            if (conceptId) {
              if (conceptId.startsWith('mindmap-')) {
                dispatch(fetchMindMap({ mindmapId: conceptId, userId: user?.id }));
              } else {
                dispatch(generateMindMap({ conceptId, userId: user?.id }));
              }
            }
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="mind-map-empty">
        <h2>No Concepts Found</h2>
        <p>Try searching for a concept to generate a mind map.</p>
      </div>
    );
  }

  return (
    <div className="mind-map-viewer" ref={containerRef}>
      {/* Toolbar */}
      <ToolBar
        layout={layout}
        zoom={zoom}
        pan={pan}
        filters={filters}
        showLabels={showLabels}
        subjects={subjects}
        onLayoutChange={handleLayoutChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onFilterChange={handleFilterChange}
        onToggleLabels={handleToggleLabels}
        onSearch={handleSearch}
        containerRef={containerRef}
      />

      {/* Visualization Canvas */}
      <div className="mind-map-canvas">
        <D3Visualization
          nodes={graphData.nodes}
          edges={graphData.edges}
          layout={layout}
          selectedNode={selectedNode}
          hoveredNode={hoveredNode}
          highlightedPath={highlightedPath}
          zoom={zoom}
          pan={pan}
          showLabels={showLabels}
          nodeSize="normal"
          edgeStyle="curved"
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeHover={handleNodeHover}
          onNodeContextMenu={handleNodeContextMenu}
          onZoomChange={(z) => dispatch(setZoom(z))}
          onPanChange={(p) => dispatch(setPan(p))}
        />
      </div>

      {/* Legend */}
      <div className="mind-map-legend">
        <h4>Mastery Levels</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ff4444' }} />
            <span>Not Started</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ffaa00' }} />
            <span>In Progress</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#ffdd00' }} />
            <span>Good Progress</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#44ff44' }} />
            <span>Mastered</span>
          </div>
        </div>
      </div>

      {/* Node Details Panel */}
      <AnimatePresence>
        {selectedNodeData && (
          <NodeDetails
            node={selectedNodeData}
            masteryLevel={selectedNodeMastery}
            prerequisites={selectedNodePrerequisites}
            relatedConcepts={selectedNodeRelated}
            isBookmarked={false}
            onClose={() => dispatch(setSelectedNode(null))}
            onBookmark={(nodeId) => console.log('Bookmark', nodeId)}
            onNavigate={handleNodeNavigate}
          />
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <button
              className="context-menu-item"
              onClick={() => handleContextMenuAction('learn', contextMenu.node)}
            >
              Learn Topic
            </button>
            <button
              className="context-menu-item"
              onClick={() => handleContextMenuAction('quiz', contextMenu.node)}
            >
              Take Quiz
            </button>
            <button
              className="context-menu-item"
              onClick={() => handleContextMenuAction('path', contextMenu.node)}
            >
              Show Learning Path
            </button>
            <button
              className="context-menu-item"
              onClick={() => handleContextMenuAction('bookmark', contextMenu.node)}
            >
              Bookmark
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Learning Path Modal */}
      <AnimatePresence>
        {showPathModal && learningPath && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPathModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Learning Path</h2>
              <p className="path-info">
                Estimated Time: {learningPath.estimatedTime || 'N/A'}
              </p>
              <div className="path-steps">
                {learningPath.path?.map((step, index) => (
                  <div key={step.id} className="path-step">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">
                      <h4>{step.name}</h4>
                      {step.description && <p>{step.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="modal-close-button"
                onClick={() => setShowPathModal(false)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MindMapViewer;
