import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPause, FaPlay, FaClock, FaChartLine } from 'react-icons/fa';
import QuizSetup from '../components/quiz/QuizSetup';
import QuestionCard from '../components/quiz/QuestionCard';
import FeedbackModal from '../components/quiz/FeedbackModal';
import QuizResults from '../components/quiz/QuizResults';
import {
  generateQuiz,
  fetchAdaptiveQuestion,
  submitAnswer,
  completeQuiz,
  getFeedback,
  requestHint,
  startQuiz,
  nextQuestion,
  skipQuestion,
  togglePause,
  decrementTime,
  clearCurrentFeedback,
  resetQuiz
} from '../store/slices/quizSlice';

const Quiz = () => {
  const { conceptId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const {
    quizId,
    questions,
    currentQuestionIndex,
    answers,
    userAnswers,
    timeRemaining,
    isPaused,
    showFeedback,
    currentFeedback,
    completed,
    results,
    settings,
    adaptiveSettings,
    loading,
    error,
    hints
  } = useSelector((state) => state.quiz);

  const [quizStarted, setQuizStarted] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Timer effect
  useEffect(() => {
    if (quizStarted && !isPaused && !completed && timeRemaining !== null) {
      const timer = setInterval(() => {
        dispatch(decrementTime());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, isPaused, completed, timeRemaining, dispatch]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && !completed) {
      handleCompleteQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]);

  const handleStartQuiz = async (config) => {
    try {
      dispatch(startQuiz());
      
      const response = await dispatch(generateQuiz({
        conceptId: conceptId || config.conceptId,
        difficulty: config.difficulty,
        questionCount: config.questionCount,
        userId: user?.id
      })).unwrap();

      if (response.quizId) {
        setQuizStarted(true);
        setQuestionStartTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to start quiz:', err);
    }
  };

  const handleAnswerSubmit = async (answer) => {
    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    try {
      const result = await dispatch(submitAnswer({
        quizId,
        questionId: currentQuestion.id,
        answer,
        timeSpent,
        userId: user?.id
      })).unwrap();

      // Fetch personalized feedback
      await dispatch(getFeedback({
        userId: user?.id,
        questionId: currentQuestion.id,
        correct: result.correct,
        conceptId: conceptId
      }));

      // Fetch adaptive question if needed and enabled
      if (settings.adaptiveDifficulty && currentQuestionIndex < settings.questionCount - 1) {
        await dispatch(fetchAdaptiveQuestion({
          userId: user?.id,
          performanceHistory: adaptiveSettings.performanceHistory,
          currentDifficulty: adaptiveSettings.currentDifficulty
        }));
      }
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  const handleNext = () => {
    dispatch(clearCurrentFeedback());
    
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(nextQuestion());
      setQuestionStartTime(Date.now());
    } else {
      handleCompleteQuiz();
    }
  };

  const handleSkip = () => {
    dispatch(skipQuestion());
    setQuestionStartTime(Date.now());
  };

  const handleCompleteQuiz = async () => {
    try {
      await dispatch(completeQuiz({
        quizId,
        userId: user?.id,
        answers: userAnswers,
        score: 0, // Will be calculated by backend
        timeSpent: settings.timeLimit ? (settings.timeLimit * 60 - (timeRemaining || 0)) : 0
      })).unwrap();
    } catch (err) {
      console.error('Failed to complete quiz:', err);
    }
  };

  const handleHintRequest = async (questionId) => {
    try {
      await dispatch(requestHint({
        questionId,
        userId: user?.id
      })).unwrap();
    } catch (err) {
      console.error('Failed to get hint:', err);
    }
  };

  const handleRetake = () => {
    dispatch(resetQuiz());
    setQuizStarted(false);
    setQuestionStartTime(Date.now());
  };

  const handleLearnMore = () => {
    if (results?.weakAreas && results.weakAreas.length > 0) {
      navigate(`/content/${results.weakAreas[0].conceptId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Show results
  if (completed && results) {
    return (
      <QuizResults
        results={{
          ...results,
          correctCount: Object.values(answers).filter(a => a.correct).length,
          timeSpent: settings.timeLimit ? (settings.timeLimit * 60 - (timeRemaining || 0)) : 0,
          accuracy: (Object.values(answers).filter(a => a.correct).length / questions.length) * 100
        }}
        onRetake={handleRetake}
        onLearnMore={handleLearnMore}
      />
    );
  }

  // Show quiz interface
  if (quizStarted && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Quiz Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold text-gray-900">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </div>
                {settings.adaptiveDifficulty && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FaChartLine className="mr-2" />
                    <span className="capitalize">{adaptiveSettings.currentDifficulty}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Timer */}
                {timeRemaining !== null && (
                  <div className={`flex items-center px-4 py-2 rounded-lg ${
                    timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    <FaClock className="mr-2" />
                    <span className="font-semibold">{formatTime(timeRemaining)}</span>
                  </div>
                )}

                {/* Pause Button */}
                <button
                  onClick={() => dispatch(togglePause())}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center"
                >
                  {isPaused ? (
                    <>
                      <FaPlay className="mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <FaPause className="mr-2" />
                      Pause
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              />
            </div>

            {/* Score Display */}
            <div className="mt-4 text-center">
              <span className="text-2xl font-bold text-gray-900">
                Current Score: <span className="text-blue-600">{Object.values(answers).reduce((sum, a) => sum + (a.score || 0), 0)} pts</span>
              </span>
            </div>
          </motion.div>

          {/* Pause Overlay */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-white rounded-2xl shadow-2xl p-8 max-w-md"
                >
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Quiz Paused</h2>
                  <p className="text-gray-600 mb-6 text-center">
                    Take your time. Click resume when you're ready to continue.
                  </p>
                  <button
                    onClick={() => dispatch(togglePause())}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                  >
                    Resume Quiz
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            {!isPaused && (
              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                onAnswer={handleAnswerSubmit}
                onHint={handleHintRequest}
                showHint={settings.allowHints}
                hint={hints[currentQuestion.id]}
                loading={loading.grading || loading.hint}
                timeSpent={Math.floor((Date.now() - questionStartTime) / 1000)}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                disabled={showFeedback}
              />
            )}
          </AnimatePresence>

          {/* Skip Button */}
          {!showFeedback && !isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <button
                onClick={handleSkip}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
              >
                Skip Question (-5 points)
              </button>
            </motion.div>
          )}

          {/* Feedback Modal */}
          <FeedbackModal
            isOpen={showFeedback}
            feedback={currentFeedback}
            onNext={handleNext}
            onTryAgain={null}
            allowRetry={false}
          />
        </div>
      </div>
    );
  }

  // Show setup screen
  return (
    <QuizSetup
      onStart={handleStartQuiz}
      loading={loading.quiz}
      error={error}
    />
  );
};

export default Quiz;
