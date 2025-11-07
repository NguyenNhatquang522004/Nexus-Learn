import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FaPlay,
  FaPause,
  FaForward,
  FaBackward,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeMute,
  FaDownload,
  FaExpand,
  FaCompress
} from 'react-icons/fa';
import {
  setAudioTime,
  setAudioPlaying,
  setPlaybackRate,
  setProgress
} from '../../store/slices/contentSlice';
import { showToast } from '../../store/slices/uiSlice';

const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const AudioPlayer = ({ audioUrl, transcript, duration }) => {
  const dispatch = useDispatch();
  const { audio } = useSelector((state) => state.content);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentWord, setCurrentWord] = useState(null);
  const [waveformData, setWaveformData] = useState([]);
  const audioRef = useRef(null);
  const transcriptRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = audio.playbackRate;
    }
  }, [audioUrl, audio.playbackRate]);

  // Generate waveform data (simplified visualization)
  useEffect(() => {
    if (duration) {
      const points = 100;
      const data = Array.from({ length: points }, () => Math.random() * 0.8 + 0.2);
      setWaveformData(data);
    }
  }, [duration]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw progress background
      const progressWidth = (audio.currentTime / duration) * width;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      waveformData.forEach((value, index) => {
        const x = index * barWidth;
        const barHeight = value * height;
        const y = (height - barHeight) / 2;

        // Color based on progress
        if (x < progressWidth) {
          ctx.fillStyle = '#3b82f6'; // Primary blue
        } else {
          ctx.fillStyle = '#cbd5e1'; // Gray
        }

        ctx.fillRect(x, y, barWidth - 1, barHeight);
      });

      // Draw playhead
      ctx.fillStyle = '#ef4444'; // Red
      ctx.fillRect(progressWidth - 1, 0, 2, height);
    };

    draw();
    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [waveformData, audio.currentTime, duration]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      dispatch(setAudioTime(audio.currentTime));
      
      // Calculate progress
      const progress = (audio.currentTime / duration) * 100;
      dispatch(setProgress(progress));

      // Find current word in transcript
      if (transcript && transcript.length > 0) {
        const word = transcript.find(
          (w) => audio.currentTime >= w.startTime && audio.currentTime <= w.endTime
        );
        if (word) {
          setCurrentWord(word);
          
          // Scroll transcript to current word
          if (transcriptRef.current) {
            const wordElement = document.getElementById(`word-${word.id}`);
            if (wordElement) {
              wordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
    };

    const handleEnded = () => {
      dispatch(setAudioPlaying(false));
      dispatch(setAudioTime(0));
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [transcript, duration, dispatch]);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      dispatch(setAudioPlaying(true));
    } else {
      audio.pause();
      dispatch(setAudioPlaying(false));
    }
  }, [dispatch]);

  const handleSeek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    dispatch(setAudioTime(time));
  }, [dispatch]);

  const handleSkipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.min(audio.currentTime + 10, duration);
  }, [duration]);

  const handleSkipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(audio.currentTime - 10, 0);
  }, []);

  const handleVolumeChange = useCallback((newVolume) => {
    const audio = audioRef.current;
    if (!audio) return;

    setVolume(newVolume);
    audio.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const handleChangePlaybackRate = useCallback((rate) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    dispatch(setPlaybackRate(rate));

    dispatch(showToast({
      message: `Playback speed: ${rate}x`,
      type: 'info',
      duration: 1500
    }));
  }, [dispatch]);

  const handleDownload = useCallback(() => {
    if (!audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'audio.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    dispatch(showToast({
      message: 'Download started',
      type: 'success',
      duration: 2000
    }));
  }, [audioUrl, dispatch]);

  const handleWaveformClick = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    handleSeek(newTime);
  }, [duration, handleSeek]);

  const handleTranscriptWordClick = useCallback((word) => {
    handleSeek(word.startTime);
  }, [handleSeek]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <FaVolumeMute />;
    if (volume < 0.5) return <FaVolumeDown />;
    return <FaVolumeUp />;
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} />

      {/* Waveform visualizer */}
      <div className={`relative ${isFullscreen ? 'p-8' : 'p-4'} bg-gradient-to-br from-primary-50 to-secondary-50`}>
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          onClick={handleWaveformClick}
          className="w-full h-32 cursor-pointer rounded-lg shadow-inner"
        />

        {/* Time display */}
        <div className="absolute top-6 left-6 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium">
          {formatTime(audio.currentTime)} / {formatTime(duration)}
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute top-6 right-6 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100"
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>

      {/* Playback controls */}
      <div className={`${isFullscreen ? 'bg-gray-800 text-white' : 'bg-white'} p-6 border-t`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Main controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSkipBackward}
              className={`p-3 rounded-full hover:bg-gray-100 ${isFullscreen ? 'hover:bg-gray-700' : ''}`}
              title="Skip backward 10s"
            >
              <FaBackward className="text-xl" />
            </button>

            <button
              onClick={handlePlayPause}
              className={`p-4 rounded-full ${
                isFullscreen
                  ? 'bg-primary-600 hover:bg-primary-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              } text-white shadow-lg`}
            >
              {audio.isPlaying ? (
                <FaPause className="text-2xl" />
              ) : (
                <FaPlay className="text-2xl ml-1" />
              )}
            </button>

            <button
              onClick={handleSkipForward}
              className={`p-3 rounded-full hover:bg-gray-100 ${isFullscreen ? 'hover:bg-gray-700' : ''}`}
              title="Skip forward 10s"
            >
              <FaForward className="text-xl" />
            </button>
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-full hover:bg-gray-100 ${isFullscreen ? 'hover:bg-gray-700' : ''}`}
            >
              {getVolumeIcon()}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>

          {/* Playback speed */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Speed:</span>
            <select
              value={audio.playbackRate}
              onChange={(e) => handleChangePlaybackRate(parseFloat(e.target.value))}
              className={`px-3 py-1 rounded-lg border ${
                isFullscreen
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300'
              }`}
            >
              {PLAYBACK_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className={`p-2 rounded-full hover:bg-gray-100 ${isFullscreen ? 'hover:bg-gray-700' : ''}`}
            title="Download audio"
          >
            <FaDownload />
          </button>
        </div>
      </div>

      {/* Synced transcript */}
      {transcript && transcript.length > 0 && (
        <div className={`flex-1 overflow-hidden ${isFullscreen ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className={`font-semibold ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                📝 Transcript
              </h3>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`text-sm ${
                  isFullscreen ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {showTranscript ? 'Hide' : 'Show'}
              </button>
            </div>

            {showTranscript && (
              <div
                ref={transcriptRef}
                className="flex-1 overflow-y-auto p-6 space-y-2"
              >
                {transcript.map((word, index) => (
                  <motion.span
                    key={word.id || index}
                    id={`word-${word.id || index}`}
                    onClick={() => handleTranscriptWordClick(word)}
                    className={`inline-block px-1 py-0.5 cursor-pointer rounded transition-all ${
                      currentWord?.id === word.id
                        ? isFullscreen
                          ? 'bg-primary-600 text-white font-semibold scale-110'
                          : 'bg-primary-600 text-white font-semibold scale-110'
                        : isFullscreen
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {word.text}{' '}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      {isFullscreen && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
          <p>Space: Play/Pause | ← →: Skip 10s | ↑ ↓: Volume | ESC: Exit</p>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
