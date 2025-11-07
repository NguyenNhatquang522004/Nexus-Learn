import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaClock, FaCheckCircle, FaTimesCircle, FaRedo, FaBook, FaShare, FaMedal, FaChartBar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const QuizResults = ({ results, onRetake, onLearnMore }) => {
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showAchievement, setShowAchievement] = useState(false);

  useEffect(() => {
    // Animate score count-up
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = results.finalScore / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setAnimatedScore(Math.min(currentStep * increment, results.finalScore));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedScore(results.finalScore);
        
        // Show achievement after score animation
        if (results.achievements && results.achievements.length > 0) {
          setTimeout(() => setShowAchievement(true), 500);
        }
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [results.finalScore, results.achievements]);

  const handleShare = () => {
    const shareText = `I scored ${results.finalScore.toFixed(1)}% on my quiz! 🎯\n${results.accuracy.toFixed(1)}% accuracy in ${formatTime(results.timeSpent)}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Quiz Results',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Results copied to clipboard!');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-500';
    if (score >= 70) return 'from-blue-500 to-cyan-500';
    if (score >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getPerformanceMessage = (score) => {
    if (score >= 90) return '🌟 Outstanding Performance!';
    if (score >= 70) return '👏 Great Job!';
    if (score >= 50) return '💪 Good Effort!';
    return '📚 Keep Learning!';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Achievement Modal */}
        {showAchievement && results.achievements && results.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAchievement(false)}
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl mb-4"
                >
                  🏆
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievement Unlocked!</h2>
                <div className="space-y-2">
                  {results.achievements.map((achievement, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
                      <p className="font-semibold text-gray-900">{achievement.name}</p>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <FaTrophy className="text-4xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Quiz Complete!
          </h1>
          <p className="text-lg text-gray-600">
            {getPerformanceMessage(results.finalScore)}
          </p>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className={`text-8xl font-bold bg-gradient-to-br ${getScoreGradient(results.finalScore)} bg-clip-text text-transparent mb-4`}
            >
              {animatedScore.toFixed(1)}%
            </motion.div>
            <p className="text-xl text-gray-600">Your Score</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <FaCheckCircle className="text-4xl text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-700 mb-1">
                {results.correctCount}
              </div>
              <p className="text-gray-600">Correct</p>
            </div>

            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <FaClock className="text-4xl text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {formatTime(results.timeSpent)}
              </div>
              <p className="text-gray-600">Time Spent</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <FaChartBar className="text-4xl text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-700 mb-1">
                {results.accuracy.toFixed(1)}%
              </div>
              <p className="text-gray-600">Accuracy</p>
            </div>
          </div>

          {results.averageScore !== undefined && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <p className="text-center text-gray-700">
                Average score: <span className="font-bold">{results.averageScore.toFixed(1)}%</span>
                {results.finalScore > results.averageScore ? (
                  <span className="text-green-600 ml-2">📈 Above average!</span>
                ) : (
                  <span className="text-blue-600 ml-2">💪 Keep improving!</span>
                )}
              </p>
            </div>
          )}
        </motion.div>

        {/* Performance Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FaChartBar className="mr-3 text-blue-600" />
            Performance Breakdown
          </h2>

          {/* Question Review */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Review</h3>
            <div className="space-y-3">
              {results.questionResults.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    question.correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {question.correct ? (
                          <FaCheckCircle className="text-green-600 mr-2" />
                        ) : (
                          <FaTimesCircle className="text-red-600 mr-2" />
                        )}
                        <span className="font-semibold text-gray-900">
                          Question {index + 1}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{question.text}</p>
                      <div className="text-sm">
                        <p className="text-gray-600">
                          Your answer: <span className="font-medium">{question.userAnswer}</span>
                        </p>
                        {!question.correct && (
                          <p className="text-gray-600">
                            Correct answer: <span className="font-medium text-green-700">{question.correctAnswer}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      question.correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {question.points} pts
                    </div>
                  </div>
                  {question.explanation && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-sm text-gray-700">{question.explanation}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Concept Mastery */}
          {results.conceptMastery && results.conceptMastery.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Concept Mastery</h3>
              <div className="space-y-3">
                {results.conceptMastery.map((concept, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{concept.name}</span>
                      <span className={`font-bold ${getScoreColor(concept.mastery)}`}>
                        {concept.mastery.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${concept.mastery}%` }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 1 }}
                        className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(concept.mastery)}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak Areas */}
          {results.weakAreas && results.weakAreas.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.weakAreas.map((area, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/content/${area.conceptId}`)}
                    className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-left hover:bg-yellow-100 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">{area.name}</p>
                        <p className="text-sm text-gray-600">{area.questionsWrong} question(s) need review</p>
                      </div>
                      <FaBook className="text-yellow-600 text-xl" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetake}
              className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <FaRedo className="text-3xl mx-auto mb-3" />
              <p className="font-semibold text-lg">Retake Quiz</p>
              <p className="text-sm opacity-90 mt-1">Try again to improve your score</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLearnMore}
              className="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <FaBook className="text-3xl mx-auto mb-3" />
              <p className="font-semibold text-lg">Learn More</p>
              <p className="text-sm opacity-90 mt-1">Review concepts you struggled with</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="p-6 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <FaShare className="text-3xl mx-auto mb-3" />
              <p className="font-semibold text-lg">Share Results</p>
              <p className="text-sm opacity-90 mt-1">Show off your achievement</p>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizResults;
