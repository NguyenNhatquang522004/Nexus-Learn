import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaCompress,
  FaPrint,
  FaDownload,
  FaTh,
  FaPlay,
  FaPause
} from 'react-icons/fa';
import {
  setCurrentSlide,
  nextSlide as nextSlideAction,
  previousSlide as previousSlideAction,
  setProgress
} from '../../store/slices/contentSlice';
import { showToast } from '../../store/slices/uiSlice';

const SlideViewer = ({ slides, title }) => {
  const dispatch = useDispatch();
  const { currentSlide } = useSelector((state) => state.content);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showPresenterNotes, setShowPresenterNotes] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5000);
  const slideContainerRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  // Calculate progress based on current slide
  useEffect(() => {
    if (slides && slides.length > 0) {
      const progress = ((currentSlide + 1) / slides.length) * 100;
      dispatch(setProgress(progress));
    }
  }, [currentSlide, slides, dispatch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousSlide();
      } else if (e.key === 'Escape' && isFullscreen) {
        handleExitFullscreen();
      } else if (e.key === 'f') {
        handleToggleFullscreen();
      } else if (e.key === 'p') {
        setShowPresenterNotes((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen, currentSlide, slides]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay) {
      autoPlayTimerRef.current = setInterval(() => {
        if (currentSlide < slides.length - 1) {
          dispatch(nextSlideAction());
        } else {
          setAutoPlay(false);
        }
      }, autoPlayInterval);

      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [autoPlay, currentSlide, slides, autoPlayInterval, dispatch]);

  const handleNextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      dispatch(nextSlideAction());
    }
  }, [currentSlide, slides, dispatch]);

  const handlePreviousSlide = useCallback(() => {
    if (currentSlide > 0) {
      dispatch(previousSlideAction());
    }
  }, [currentSlide, dispatch]);

  const handleGoToSlide = useCallback((index) => {
    dispatch(setCurrentSlide(index));
    setShowThumbnails(false);
  }, [dispatch]);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      slideContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleExitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    const slidesHtml = slides
      .map(
        (slide, index) => `
      <div style="page-break-after: always; padding: 40px;">
        <h2 style="margin-bottom: 20px;">Slide ${index + 1}: ${slide.title || ''}</h2>
        <div>${slide.content || ''}</div>
        ${slide.presenterNotes ? `<div style="margin-top: 20px; padding: 10px; background: #f3f4f6; border-radius: 5px;"><strong>Notes:</strong> ${slide.presenterNotes}</div>` : ''}
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Slides'}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h2 { color: #1f2937; }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; margin-bottom: 40px;">${title || 'Slides'}</h1>
          ${slidesHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();

    dispatch(showToast({
      message: 'Print dialog opened',
      type: 'info',
      duration: 2000
    }));
  }, [slides, title, dispatch]);

  const handleExport = useCallback(() => {
    const slidesText = slides
      .map(
        (slide, index) => `
Slide ${index + 1}: ${slide.title || ''}
${slide.content?.replace(/<[^>]*>/g, '') || ''}
${slide.presenterNotes ? `\nNotes: ${slide.presenterNotes}` : ''}
---
    `
      )
      .join('\n\n');

    const blob = new Blob([slidesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'slides'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dispatch(showToast({
      message: 'Slides exported successfully',
      type: 'success',
      duration: 2000
    }));
  }, [slides, title, dispatch]);

  const handleToggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => !prev);
  }, []);

  if (!slides || slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No slides available</p>
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div
      ref={slideContainerRef}
      className={`relative h-full flex flex-col ${isFullscreen ? 'bg-black' : 'bg-gray-100'}`}
    >
      {/* Top controls */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            Slide {currentSlide + 1} of {slides.length}
          </span>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAutoPlay}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
          >
            {autoPlay ? <FaPause /> : <FaPlay />}
          </button>

          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Show thumbnails"
          >
            <FaTh />
          </button>

          <button
            onClick={() => setShowPresenterNotes(!showPresenterNotes)}
            className={`p-2 hover:bg-gray-100 rounded-lg ${showPresenterNotes ? 'bg-primary-100 text-primary-700' : ''}`}
            title="Toggle presenter notes"
          >
            📝
          </button>

          <button
            onClick={handlePrint}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Print slides"
          >
            <FaPrint />
          </button>

          <button
            onClick={handleExport}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Export slides"
          >
            <FaDownload />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* Main slide area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className={`w-full h-full flex flex-col ${isFullscreen ? 'max-w-7xl' : 'max-w-5xl'}`}
          >
            {/* Slide content */}
            <div className="flex-1 bg-white rounded-lg shadow-2xl p-12 overflow-y-auto">
              {currentSlideData.title && (
                <h2 className="text-4xl font-bold mb-6 text-gray-900">
                  {currentSlideData.title}
                </h2>
              )}

              {currentSlideData.image && (
                <img
                  src={currentSlideData.image}
                  alt={currentSlideData.title || `Slide ${currentSlide + 1}`}
                  className="w-full max-h-96 object-contain mb-6 rounded-lg"
                />
              )}

              <div
                className="prose prose-lg max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: currentSlideData.content }}
              />

              {currentSlideData.animation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mt-6"
                >
                  {currentSlideData.animationContent}
                </motion.div>
              )}
            </div>

            {/* Presenter notes */}
            {showPresenterNotes && currentSlideData.presenterNotes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <h4 className="font-semibold text-yellow-900 mb-2">
                  📝 Presenter Notes
                </h4>
                <p className="text-yellow-800 text-sm">
                  {currentSlideData.presenterNotes}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="absolute inset-y-0 left-4 right-4 flex items-center justify-between pointer-events-none">
        <button
          onClick={handlePreviousSlide}
          disabled={currentSlide === 0}
          className={`pointer-events-auto p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
            currentSlide === 0 ? 'invisible' : ''
          }`}
        >
          <FaChevronLeft className="text-2xl text-gray-700" />
        </button>

        <button
          onClick={handleNextSlide}
          disabled={currentSlide === slides.length - 1}
          className={`pointer-events-auto p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
            currentSlide === slides.length - 1 ? 'invisible' : ''
          }`}
        >
          <FaChevronRight className="text-2xl text-gray-700" />
        </button>
      </div>

      {/* Thumbnails panel */}
      <AnimatePresence>
        {showThumbnails && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-20 left-0 right-0 bg-white shadow-2xl p-4 max-h-64 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">All Slides</h3>
              <button
                onClick={() => setShowThumbnails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {slides.map((slide, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleGoToSlide(index)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden shadow-md ${
                    index === currentSlide ? 'ring-4 ring-primary-600' : ''
                  }`}
                >
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    {slide.image ? (
                      <img
                        src={slide.image}
                        alt={slide.title || `Slide ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <p className="text-xs font-semibold text-gray-700 line-clamp-2">
                          {slide.title || `Slide ${index + 1}`}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs py-1 px-2 text-center">
                    {index + 1}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts help */}
      {isFullscreen && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
          <p>← → : Navigate | F : Fullscreen | P : Notes | ESC : Exit</p>
        </div>
      )}
    </div>
  );
};

export default SlideViewer;
