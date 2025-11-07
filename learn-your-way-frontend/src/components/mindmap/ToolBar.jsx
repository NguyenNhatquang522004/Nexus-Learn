import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaProjectDiagram,
  FaSitemap,
  FaCircleNotch,
  FaSearchPlus,
  FaSearchMinus,
  FaExpand,
  FaFilter,
  FaSearch,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaTimes
} from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ToolBar.css';

const ToolBar = ({
  layout,
  zoom,
  pan,
  filters,
  showLabels,
  subjects = [],
  onLayoutChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFilterChange,
  onToggleLabels,
  onSearch,
  onExport,
  containerRef
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  const layouts = [
    { id: 'force_directed', label: 'Force-Directed', icon: FaProjectDiagram },
    { id: 'tree', label: 'Hierarchical Tree', icon: FaSitemap },
    { id: 'radial', label: 'Radial Layout', icon: FaCircleNotch }
  ];

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    onZoomIn?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    onZoomOut?.(newZoom);
  };

  const handleExportPNG = async () => {
    if (!containerRef?.current || exporting) return;
    
    try {
      setExporting(true);
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `mindmap-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export PNG failed:', error);
      alert('Failed to export as PNG');
    } finally {
      setExporting(false);
    }
  };

  const handleExportSVG = () => {
    if (!containerRef?.current || exporting) return;
    
    try {
      setExporting(true);
      const svgElement = containerRef.current.querySelector('svg');
      if (!svgElement) throw new Error('SVG not found');
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `mindmap-${Date.now()}.svg`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export SVG failed:', error);
      alert('Failed to export as SVG');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!containerRef?.current || exporting) return;
    
    try {
      setExporting(true);
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`mindmap-${Date.now()}.pdf`);
      
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export PDF failed:', error);
      alert('Failed to export as PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const handleFilterChange = (filterType, value) => {
    onFilterChange?.({
      ...filters,
      [filterType]: value
    });
  };

  return (
    <div className="mind-map-toolbar">
      {/* Layout Selector */}
      <div className="toolbar-section">
        <label className="toolbar-label">Layout:</label>
        <div className="button-group">
          {layouts.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`toolbar-button ${layout === id ? 'active' : ''}`}
              onClick={() => onLayoutChange?.(id)}
              title={label}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="toolbar-section">
        <label className="toolbar-label">Zoom:</label>
        <div className="button-group">
          <button
            className="toolbar-button"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            title="Zoom In"
          >
            <FaSearchPlus />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            className="toolbar-button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.1}
            title="Zoom Out"
          >
            <FaSearchMinus />
          </button>
          <button
            className="toolbar-button"
            onClick={onResetView}
            title="Reset View"
          >
            <FaExpand />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="toolbar-section search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="toolbar-button" title="Search">
            <FaSearch />
          </button>
        </form>
      </div>

      {/* Filter Toggle */}
      <div className="toolbar-section">
        <button
          className={`toolbar-button ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Filters"
        >
          <FaFilter />
        </button>
      </div>

      {/* Labels Toggle */}
      <div className="toolbar-section">
        <button
          className={`toolbar-button ${showLabels ? 'active' : ''}`}
          onClick={onToggleLabels}
          title={showLabels ? 'Hide Labels' : 'Show Labels'}
        >
          {showLabels ? <FaEye /> : <FaEyeSlash />}
        </button>
      </div>

      {/* Export */}
      <div className="toolbar-section">
        <button
          className="toolbar-button"
          onClick={() => setShowExportMenu(!showExportMenu)}
          title="Export"
          disabled={exporting}
        >
          <FaDownload />
        </button>
        
        <AnimatePresence>
          {showExportMenu && (
            <motion.div
              className="export-menu"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className="export-option"
                onClick={handleExportPNG}
                disabled={exporting}
              >
                Export as PNG
              </button>
              <button
                className="export-option"
                onClick={handleExportSVG}
                disabled={exporting}
              >
                Export as SVG
              </button>
              <button
                className="export-option"
                onClick={handleExportPDF}
                disabled={exporting}
              >
                Export as PDF
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filter-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="filter-header">
              <h3>Filters</h3>
              <button
                className="close-button"
                onClick={() => setShowFilters(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="filter-content">
              {/* Subject Filter */}
              {subjects.length > 0 && (
                <div className="filter-group">
                  <label className="filter-label">Subject:</label>
                  <select
                    value={filters.subject || ''}
                    onChange={(e) => handleFilterChange('subject', e.target.value || null)}
                    className="filter-select"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mastery Level Filter */}
              <div className="filter-group">
                <label className="filter-label">Mastery Level:</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.showNotStarted !== false}
                      onChange={(e) => handleFilterChange('showNotStarted', e.target.checked)}
                    />
                    <span className="mastery-indicator not-started" />
                    Not Started
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.showInProgress !== false}
                      onChange={(e) => handleFilterChange('showInProgress', e.target.checked)}
                    />
                    <span className="mastery-indicator in-progress" />
                    In Progress
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.showCompleted !== false}
                      onChange={(e) => handleFilterChange('showCompleted', e.target.checked)}
                    />
                    <span className="mastery-indicator completed" />
                    Completed
                  </label>
                </div>
              </div>

              {/* Apply Filters Button */}
              <button
                className="apply-filters-button"
                onClick={() => {
                  onFilterChange?.(filters);
                  setShowFilters(false);
                }}
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolBar;
