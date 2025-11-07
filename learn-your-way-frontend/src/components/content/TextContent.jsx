import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  FaVolumeUp, 
  FaHighlighter, 
  FaBookmark, 
  FaExpand, 
  FaCopy,
  FaSearch,
  FaBook
} from 'react-icons/fa';
import { 
  addHighlight, 
  removeHighlight, 
  updateHighlightColor,
  setProgress 
} from '../../store/slices/contentSlice';
import { showToast } from '../../store/slices/uiSlice';

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#fef3c7' },
  { name: 'Green', value: '#d1fae5' },
  { name: 'Blue', value: '#dbeafe' },
  { name: 'Pink', value: '#fce7f3' },
  { name: 'Orange', value: '#fed7aa' }
];

const TextContent = ({ content, onTextToSpeech }) => {
  const dispatch = useDispatch();
  const { highlights, progress } = useSelector((state) => state.content);
  const [selectedText, setSelectedText] = useState(null);
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [showGlossary, setShowGlossary] = useState(false);
  const [glossaryTerm, setGlossaryTerm] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [expandedExample, setExpandedExample] = useState(null);
  const [readingTime, setReadingTime] = useState(0);
  const contentRef = useRef(null);
  const selectionRef = useRef(null);
  const readingTimerRef = useRef(null);

  // Calculate reading time
  useEffect(() => {
    if (content?.text) {
      const words = content.text.split(/\s+/).length;
      const estimatedMinutes = Math.ceil(words / 200); // 200 words per minute
      setReadingTime(estimatedMinutes);
    }
  }, [content?.text]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const scrollProgress = (scrollTop / scrollHeight) * 100;

      if (scrollProgress > progress) {
        dispatch(setProgress(Math.min(100, scrollProgress)));
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [progress, dispatch]);

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectedText({
        text,
        range,
        position: {
          top: rect.top + window.scrollY - 50,
          left: rect.left + rect.width / 2
        }
      });
    } else {
      setSelectedText(null);
    }
  }, []);

  // Add highlight
  const handleAddHighlight = useCallback(() => {
    if (!selectedText) return;

    const { text, range } = selectedText;

    dispatch(addHighlight({
      text,
      start: range.startOffset,
      end: range.endOffset,
      color: highlightColor
    }));

    dispatch(showToast({
      message: 'Text highlighted',
      type: 'success',
      duration: 2000
    }));

    setSelectedText(null);
    window.getSelection().removeAllRanges();
  }, [selectedText, highlightColor, dispatch]);

  // Remove highlight
  const handleRemoveHighlight = useCallback((highlightId) => {
    dispatch(removeHighlight(highlightId));
    dispatch(showToast({
      message: 'Highlight removed',
      type: 'info',
      duration: 2000
    }));
  }, [dispatch]);

  // Change highlight color
  const handleChangeHighlightColor = useCallback((highlightId, color) => {
    dispatch(updateHighlightColor({ id: highlightId, color }));
  }, [dispatch]);

  // Copy to clipboard
  const handleCopyText = useCallback(() => {
    if (!selectedText) return;

    navigator.clipboard.writeText(selectedText.text);
    dispatch(showToast({
      message: 'Text copied to clipboard',
      type: 'success',
      duration: 2000
    }));

    setSelectedText(null);
  }, [selectedText, dispatch]);

  // Show glossary for term
  const handleShowGlossary = useCallback((term) => {
    const definition = content?.vocabulary?.[term];
    if (definition) {
      setGlossaryTerm({ term, definition });
      setShowGlossary(true);
    }
  }, [content]);

  // Text-to-speech for selected text
  const handleSpeakText = useCallback(() => {
    if (!selectedText || !onTextToSpeech) return;

    onTextToSpeech(selectedText.text);
    setSelectedText(null);
  }, [selectedText, onTextToSpeech]);

  // Render text with highlights and interactive terms
  const renderContent = useCallback(() => {
    if (!content?.personalizedText && !content?.text) {
      return <p>No content available</p>;
    }

    const text = content.personalizedText || content.text;
    let processedText = text;

    // Apply highlights
    if (highlights && highlights.length > 0) {
      highlights.forEach((highlight) => {
        const highlightSpan = `<mark style="background-color: ${highlight.color}; cursor: pointer;" data-highlight-id="${highlight.id}">${highlight.text}</mark>`;
        processedText = processedText.replace(highlight.text, highlightSpan);
      });
    }

    // Make vocabulary terms interactive
    if (content.vocabulary) {
      Object.keys(content.vocabulary).forEach((term) => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        processedText = processedText.replace(
          regex,
          `<span class="glossary-term" data-term="${term}">${term}</span>`
        );
      });
    }

    return (
      <div
        dangerouslySetInnerHTML={{ __html: processedText }}
        onClick={(e) => {
          if (e.target.classList.contains('glossary-term')) {
            const term = e.target.getAttribute('data-term');
            handleShowGlossary(term);
          } else if (e.target.hasAttribute('data-highlight-id')) {
            const highlightId = parseInt(e.target.getAttribute('data-highlight-id'));
            handleRemoveHighlight(highlightId);
          }
        }}
      />
    );
  }, [content, highlights, handleShowGlossary, handleRemoveHighlight]);

  return (
    <div className="relative h-full">
      {/* Reading info bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>📖 {readingTime} min read</span>
          <span>📊 {Math.round(progress)}% complete</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTextToSpeech && onTextToSpeech(content?.personalizedText || content?.text)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
          >
            <FaVolumeUp />
            Listen
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div
        ref={contentRef}
        className="h-full overflow-y-auto p-8 prose prose-lg max-w-4xl mx-auto"
        onMouseUp={handleTextSelection}
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: '1.8',
          fontSize: '18px'
        }}
      >
        {/* Title */}
        {content?.title && (
          <h1 className="text-4xl font-bold mb-6 text-gray-900">
            {content.title}
          </h1>
        )}

        {/* Main content */}
        <div className="text-gray-800">
          {renderContent()}
        </div>

        {/* Personalized examples */}
        {content?.examples && content.examples.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">
              💡 Examples for You
            </h3>
            <div className="space-y-4">
              {content.examples.map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedExample(expandedExample === index ? null : index)}
                  >
                    <h4 className="font-medium text-blue-900">
                      {example.title}
                    </h4>
                    <FaExpand className={`text-blue-600 transition-transform ${expandedExample === index ? 'rotate-180' : ''}`} />
                  </div>
                  {expandedExample === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-3 text-blue-800"
                    >
                      {example.content}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Cultural context */}
        {content?.culturalContext && (
          <div className="mt-8 p-6 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-xl font-semibold mb-3 text-purple-900 flex items-center gap-2">
              🌍 Cultural Context
            </h3>
            <p className="text-purple-800">{content.culturalContext}</p>
          </div>
        )}
      </div>

      {/* Text selection toolbar */}
      {selectedText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: selectedText.position.top,
            left: selectedText.position.left,
            transform: 'translateX(-50%)',
            zIndex: 1000
          }}
          className="flex items-center gap-2 bg-white shadow-lg rounded-lg p-2 border"
        >
          <button
            onClick={handleAddHighlight}
            className="p-2 hover:bg-gray-100 rounded"
            title="Highlight"
          >
            <FaHighlighter className="text-yellow-600" />
          </button>
          <button
            onClick={handleCopyText}
            className="p-2 hover:bg-gray-100 rounded"
            title="Copy"
          >
            <FaCopy className="text-gray-600" />
          </button>
          <button
            onClick={handleSpeakText}
            className="p-2 hover:bg-gray-100 rounded"
            title="Listen"
          >
            <FaVolumeUp className="text-blue-600" />
          </button>
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Choose color"
          >
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: highlightColor }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute top-full mt-2 bg-white shadow-lg rounded-lg p-2 flex gap-2">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    setHighlightColor(color.value);
                    setShowColorPicker(false);
                  }}
                  className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-600"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Glossary modal */}
      {showGlossary && glossaryTerm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowGlossary(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaBook className="text-primary-600" />
                {glossaryTerm.term}
              </h3>
              <button
                onClick={() => setShowGlossary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {glossaryTerm.definition}
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* CSS for interactive elements */}
      <style jsx>{`
        .glossary-term {
          color: #3b82f6;
          text-decoration: underline;
          text-decoration-style: dotted;
          cursor: help;
        }
        .glossary-term:hover {
          color: #2563eb;
          background-color: #dbeafe;
          padding: 0 4px;
          border-radius: 4px;
        }
        mark {
          padding: 2px 4px;
          border-radius: 2px;
          transition: all 0.2s;
        }
        mark:hover {
          filter: brightness(0.9);
          box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default TextContent;
