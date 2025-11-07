import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FaTimes,
  FaBook,
  FaQuestionCircle,
  FaBookmark,
  FaRegBookmark,
  FaStar,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowRight
} from 'react-icons/fa';
import './NodeDetails.css';

const NodeDetails = ({
  node,
  masteryLevel = 0,
  prerequisites = [],
  relatedConcepts = [],
  isBookmarked = false,
  onClose,
  onBookmark,
  onNavigate
}) => {
  const navigate = useNavigate();

  if (!node) return null;

  const getMasteryColor = (mastery) => {
    if (mastery === 0) return '#ff4444';
    if (mastery <= 20) return '#ff6644';
    if (mastery <= 50) return '#ffaa00';
    if (mastery <= 80) return '#ffdd00';
    if (mastery < 100) return '#88ff44';
    return '#44ff44';
  };

  const getMasteryLabel = (mastery) => {
    if (mastery === 0) return 'Not Started';
    if (mastery <= 50) return 'In Progress';
    if (mastery < 100) return 'Good Progress';
    return 'Mastered';
  };

  const handleLearn = () => {
    navigate(`/content/${node.id}`);
    onNavigate?.();
  };

  const handleQuiz = () => {
    navigate(`/quiz/${node.id}`);
    onNavigate?.();
  };

  const handleBookmark = () => {
    onBookmark?.(node.id);
  };

  const handlePrerequisiteClick = (prerequisite) => {
    if (prerequisite.isCompleted) {
      navigate(`/content/${prerequisite.id}`);
    } else {
      navigate(`/content/${prerequisite.id}`);
    }
    onNavigate?.();
  };

  const handleRelatedClick = (concept) => {
    onNavigate?.(concept.id);
  };

  return (
    <motion.div
      className="node-details-panel"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Close Button */}
      <button className="close-panel-button" onClick={onClose}>
        <FaTimes />
      </button>

      {/* Node Title */}
      <div className="node-title-section">
        <h2 className="node-title">{node.name || node.label}</h2>
        {node.subject && (
          <span className="subject-badge">{node.subject}</span>
        )}
      </div>

      {/* Importance Stars */}
      {node.importance && (
        <div className="importance-section">
          <label>Importance:</label>
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={i < node.importance ? 'star-filled' : 'star-empty'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mastery Progress */}
      <div className="mastery-section">
        <div className="mastery-header">
          <label>Mastery Level</label>
          <span className="mastery-label" style={{ color: getMasteryColor(masteryLevel) }}>
            {getMasteryLabel(masteryLevel)}
          </span>
        </div>
        
        <div className="progress-circle">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={getMasteryColor(masteryLevel)}
              strokeWidth="10"
              strokeDasharray={`${(masteryLevel / 100) * 314} 314`}
              strokeDashoffset="0"
              transform="rotate(-90 60 60)"
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="progress-text">
            <span className="progress-number">{masteryLevel}</span>
            <span className="progress-percent">%</span>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <motion.div
          className="prerequisites-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="section-title">
            Prerequisites
            <span className="count-badge">{prerequisites.length}</span>
          </h3>
          <div className="prerequisites-list">
            {prerequisites.slice(0, 5).map((prerequisite, index) => (
              <motion.div
                key={prerequisite.id}
                className="prerequisite-item"
                onClick={() => handlePrerequisiteClick(prerequisite)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <div className="prerequisite-status">
                  {prerequisite.isCompleted ? (
                    <FaCheckCircle className="status-icon completed" />
                  ) : (
                    <FaTimesCircle className="status-icon incomplete" />
                  )}
                </div>
                <span className="prerequisite-name">{prerequisite.name}</span>
                <FaArrowRight className="arrow-icon" />
              </motion.div>
            ))}
            {prerequisites.length > 5 && (
              <button className="show-all-button">
                Show all {prerequisites.length} prerequisites
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Related Concepts */}
      {relatedConcepts.length > 0 && (
        <motion.div
          className="related-concepts-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="section-title">Related Concepts</h3>
          <div className="related-concepts-grid">
            {relatedConcepts.slice(0, 4).map((concept, index) => (
              <motion.div
                key={concept.id}
                className="related-concept-card"
                onClick={() => handleRelatedClick(concept)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
              >
                <div className="concept-icon">{concept.icon || '📚'}</div>
                <div className="concept-info">
                  <div className="concept-name">{concept.name}</div>
                  {concept.subject && (
                    <div className="concept-subject">{concept.subject}</div>
                  )}
                  {concept.similarity && (
                    <div className="concept-similarity">
                      {Math.round(concept.similarity * 100)}% similar
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Description */}
      {node.description && (
        <motion.div
          className="description-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="section-title">Description</h3>
          <p className="description-text">{node.description}</p>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        className="actions-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button className="action-button primary" onClick={handleLearn}>
          <FaBook />
          <span>Learn</span>
        </button>
        <button className="action-button secondary" onClick={handleQuiz}>
          <FaQuestionCircle />
          <span>Take Quiz</span>
        </button>
        <button
          className={`action-button outline ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmark}
        >
          {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
          <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
        </button>
      </motion.div>
    </motion.div>
  );
};

export default NodeDetails;
