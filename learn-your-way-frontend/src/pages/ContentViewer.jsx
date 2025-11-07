import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaBookmark,
  FaRegBookmark,
  FaDownload,
  FaShare,
  FaCheck,
  FaQuestionCircle,
  FaChevronRight,
  FaChevronLeft,
  FaComments
} from 'react-icons/fa';
import {
  fetchContent,
  fetchPrerequisites,
  fetchRelatedConcepts,
  fetchVisualEnhancements,
  fetchAudioContent,
  fetchMindMap,
  loadNotes,
  setFormat,
  resetContent
} from '../store/slices/contentSlice';
import { showToast } from '../store/slices/uiSlice';
import useContentSync from '../hooks/useContentSync';
import TextContent from '../components/content/TextContent';
import SlideViewer from '../components/content/SlideViewer';
import AudioPlayer from '../components/content/AudioPlayer';
import NotesPanel from '../components/content/NotesPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ContentViewer = () => {
  const { conceptId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { auth } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.profile);
  const { learningStyle } = useSelector((state) => state.learningStyle);
  const {
    content,
    format,
    currentSlide,
    audio,
    progress,
    bookmarked,
    prerequisites,
    relatedConcepts,
    mindMap,
    loading,
    error
  } = useSelector((state) => state.content);

  const userId = auth?.user?.id;
  const { toggleBookmark, isSyncing, lastSyncTime } = useContentSync(conceptId);
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('notes'); // notes | toc | mindmap | related
  const [showFeedback, setShowFeedback] = useState(false);

  // Load content on mount
  useEffect(() => {
    if (conceptId && userId) {
      // Fetch main content with personalization
      dispatch(fetchContent({
        conceptId,
        userId,
        learningStyle: learningStyle?.style || 'visual'
      }));

      // Fetch additional data
      dispatch(fetchPrerequisites(conceptId));
      dispatch(fetchRelatedConcepts(conceptId));
      dispatch(fetchMindMap(conceptId));
      dispatch(loadNotes({ userId, conceptId }));
    }
  }, [conceptId, userId, learningStyle, dispatch]);

  // Fetch audio when format changes to audio
  useEffect(() => {
    if (format === 'audio' && content?.personalizedText && !audio.url) {
      dispatch(fetchAudioContent({
        conceptId,
        text: content.personalizedText || content.text,
        voice: profile?.preferredVoice || 'default'
      }));
    }
  }, [format, content, audio.url, conceptId, profile, dispatch]);

  // Fetch visual enhancements for text content
  useEffect(() => {
    if (format === 'text' && content?.text && (!content.images || content.images.length === 0)) {
      dispatch(fetchVisualEnhancements({
        conceptId,
        contentText: content.text
      }));
    }
  }, [format, content, conceptId, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetContent());
    };
  }, [dispatch]);

  const handleFormatChange = useCallback((newFormat) => {
    dispatch(setFormat(newFormat));
  }, [dispatch]);

  const handleToggleBookmark = useCallback(() => {
    toggleBookmark();
  }, [toggleBookmark]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: content?.title || 'Content',
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      dispatch(showToast({
        message: 'Link copied to clipboard',
        type: 'success',
        duration: 2000
      }));
    }
  }, [content, dispatch]);

  const handleDownloadContent = useCallback(() => {
    const contentText = content?.personalizedText || content?.text || '';
    const blob = new Blob([contentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${content?.title || 'content'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dispatch(showToast({
      message: 'Content downloaded',
      type: 'success',
      duration: 2000
    }));
  }, [content, dispatch]);

  const handleTakeQuiz = useCallback(() => {
    navigate(`/quiz/${conceptId}`);
  }, [conceptId, navigate]);

  const handleTextToSpeech = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);

      dispatch(showToast({
        message: 'Reading text...',
        type: 'info',
        duration: 2000
      }));
    } else {
      dispatch(showToast({
        message: 'Text-to-speech not supported',
        type: 'error',
        duration: 3000
      }));
    }
  }, [dispatch]);

  const handleMarkComplete = useCallback(() => {
    if (progress === 100) {
      dispatch(showToast({
        message: 'Content already completed',
        type: 'info',
        duration: 2000
      }));
      return;
    }

    // Mark as complete
    dispatch(setFormat('text')); // Reset to prevent issues
    
    dispatch(showToast({
      message: 'Content marked as complete!',
      type: 'success',
      duration: 3000
    }));

    // Redirect to quiz
    setTimeout(() => {
      handleTakeQuiz();
    }, 1500);
  }, [progress, handleTakeQuiz, dispatch]);

  // Render breadcrumb navigation
  const renderBreadcrumbs = () => (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <button
        onClick={() => navigate('/learn')}
        className="hover:text-primary-600"
      >
        Learn
      </button>
      <FaChevronRight className="text-xs" />
      {content?.subject && (
        <>
          <span>{content.subject}</span>
          <FaChevronRight className="text-xs" />
        </>
      )}
      <span className="text-gray-900 font-medium">{content?.title}</span>
    </div>
  );

  // Render format switcher
  const renderFormatSwitcher = () => (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => handleFormatChange('text')}
        className={`px-4 py-2 rounded-lg transition-all ${
          format === 'text'
            ? 'bg-white text-primary-700 font-medium shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        📄 Text
      </button>
      {content?.slides && content.slides.length > 0 && (
        <button
          onClick={() => handleFormatChange('slides')}
          className={`px-4 py-2 rounded-lg transition-all ${
            format === 'slides'
              ? 'bg-white text-primary-700 font-medium shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Slides
        </button>
      )}
      <button
        onClick={() => handleFormatChange('audio')}
        className={`px-4 py-2 rounded-lg transition-all ${
          format === 'audio'
            ? 'bg-white text-primary-700 font-medium shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        🎧 Audio
      </button>
    </div>
  );

  // Render sidebar content
  const renderSidebarContent = () => {
    switch (sidebarTab) {
      case 'notes':
        return <NotesPanel conceptId={conceptId} />;
      
      case 'toc':
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              📑 Table of Contents
            </h3>
            {content?.tableOfContents && content.tableOfContents.length > 0 ? (
              <div className="space-y-2">
                {content.tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg text-sm"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No table of contents available</p>
            )}
          </div>
        );
      
      case 'mindmap':
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              🧠 Mind Map
            </h3>
            {mindMap ? (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <img
                  src={mindMap.imageUrl || '/mindmap-placeholder.png'}
                  alt="Mind Map"
                  className="w-full rounded"
                />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Loading mind map...</p>
            )}
          </div>
        );
      
      case 'related':
        return (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              🔗 Related Concepts
            </h3>
            {relatedConcepts && relatedConcepts.length > 0 ? (
              <div className="space-y-2">
                {relatedConcepts.map((concept, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(`/content/${concept.id}`)}
                    className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-primary-50 rounded-lg border hover:border-primary-300"
                  >
                    <p className="font-medium text-gray-900">{concept.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{concept.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No related concepts found</p>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading.content) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-600 mb-4">Error loading content: {error}</p>
        <button
          onClick={() => navigate('/learn')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Learn
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/learn')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft />
              Back
            </button>

            <div className="flex items-center gap-3">
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>

              {/* Bookmark button */}
              <button
                onClick={handleToggleBookmark}
                className={`p-2 rounded-lg ${
                  bookmarked
                    ? 'text-yellow-600 hover:text-yellow-700'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {bookmarked ? <FaBookmark className="text-xl" /> : <FaRegBookmark className="text-xl" />}
              </button>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg"
                title="Share"
              >
                <FaShare />
              </button>

              {/* Download button */}
              <button
                onClick={handleDownloadContent}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg"
                title="Download"
              >
                <FaDownload />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {renderBreadcrumbs()}
            {renderFormatSwitcher()}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content area */}
        <div className={`flex-1 overflow-hidden ${showSidebar ? 'mr-96' : ''}`}>
          {format === 'text' && (
            <TextContent
              content={content}
              onTextToSpeech={handleTextToSpeech}
            />
          )}

          {format === 'slides' && (
            <SlideViewer
              slides={content?.slides || []}
              title={content?.title}
            />
          )}

          {format === 'audio' && (
            <AudioPlayer
              audioUrl={audio.url}
              transcript={audio.transcript}
              duration={audio.duration}
            />
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <motion.div
            initial={{ x: 384 }}
            animate={{ x: 0 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l shadow-xl flex flex-col"
            style={{ top: '128px' }}
          >
            {/* Sidebar tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setSidebarTab('notes')}
                className={`flex-1 py-3 text-sm font-medium ${
                  sidebarTab === 'notes'
                    ? 'text-primary-700 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📝 Notes
              </button>
              <button
                onClick={() => setSidebarTab('toc')}
                className={`flex-1 py-3 text-sm font-medium ${
                  sidebarTab === 'toc'
                    ? 'text-primary-700 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📑 ToC
              </button>
              <button
                onClick={() => setSidebarTab('mindmap')}
                className={`flex-1 py-3 text-sm font-medium ${
                  sidebarTab === 'mindmap'
                    ? 'text-primary-700 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🧠 Map
              </button>
              <button
                onClick={() => setSidebarTab('related')}
                className={`flex-1 py-3 text-sm font-medium ${
                  sidebarTab === 'related'
                    ? 'text-primary-700 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔗 Related
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-hidden">
              {renderSidebarContent()}
            </div>

            {/* Toggle sidebar button */}
            <button
              onClick={() => setShowSidebar(false)}
              className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 bg-white border rounded-l-lg shadow-lg hover:bg-gray-50"
            >
              <FaChevronRight />
            </button>
          </motion.div>
        )}

        {/* Show sidebar button (when hidden) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed right-4 top-1/2 -translate-y-1/2 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700"
          >
            <FaChevronLeft />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Prerequisites warning */}
            {prerequisites && prerequisites.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-yellow-600">
                <FaQuestionCircle />
                <span>Review prerequisites first</span>
              </div>
            )}

            {/* Sync status */}
            {isSyncing && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Syncing...
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <FaComments />
              Feedback
            </button>

            {progress < 100 && (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaCheck />
                Mark Complete
              </button>
            )}

            <button
              onClick={handleTakeQuiz}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Take Quiz
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentViewer;
