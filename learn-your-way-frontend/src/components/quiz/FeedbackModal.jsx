import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaLightbulb, FaRedo } from 'react-icons/fa';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';

const FeedbackModal = ({ 
  isOpen, 
  feedback, 
  onNext, 
  onTryAgain,
  allowRetry = false
}) => {
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && feedback?.correct) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, feedback]);

  if (!isOpen || !feedback) return null;

  const handleRelatedConceptClick = (conceptId) => {
    navigate(`/content/${conceptId}`);
  };

  const encouragementMessages = [
    "🎉 Excellent work!",
    "✨ Outstanding!",
    "🌟 Brilliant!",
    "💪 Great job!",
    "🚀 Fantastic!",
    "⭐ Perfect!",
    "🎯 Well done!",
    "👏 Amazing!"
  ];

  const correctionMessages = [
    "Let's learn together",
    "Keep trying!",
    "Almost there!",
    "You're making progress",
    "Don't give up!",
    "Learning opportunity"
  ];

  const randomEncouragement = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
  const randomCorrection = correctionMessages[Math.floor(Math.random() * correctionMessages.length)];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti Effect for Correct Answers */}
          {showConfetti && feedback.correct && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
            />
          )}

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && onNext()}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                feedback.correct ? 'border-4 border-green-400' : 'border-4 border-red-400'
              }`}
            >
              {/* Header */}
              <div className={`p-8 ${
                feedback.correct 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50' 
                  : 'bg-gradient-to-br from-red-50 to-pink-50'
              }`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex items-center justify-center mb-4"
                >
                  {feedback.correct ? (
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
                      <FaCheckCircle className="text-white text-6xl" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                      <FaTimesCircle className="text-white text-6xl" />
                    </div>
                  )}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`text-3xl font-bold text-center mb-2 ${
                    feedback.correct ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {feedback.correct ? randomEncouragement : randomCorrection}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`text-center text-lg ${
                    feedback.correct ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {feedback.correct ? 'Your answer is correct!' : 'Not quite right, but that\'s okay!'}
                </motion.p>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Glow Feedback (Correct Answer) */}
                {feedback.correct && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6"
                  >
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                      <div className="flex items-start">
                        <FaLightbulb className="text-green-600 text-2xl mr-4 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-bold text-green-900 text-lg mb-2">Why this is correct:</h3>
                          <p className="text-green-800 leading-relaxed">
                            {feedback.explanation}
                          </p>
                          {feedback.customFeedback && (
                            <div className="mt-4 p-4 bg-white rounded-lg">
                              <p className="text-green-900 italic">
                                💡 {feedback.customFeedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Grow Feedback (Incorrect Answer) */}
                {!feedback.correct && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-6"
                  >
                    {/* Explanation */}
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                      <div className="flex items-start">
                        <FaLightbulb className="text-red-600 text-2xl mr-4 mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-bold text-red-900 text-lg mb-2">What to remember:</h3>
                          <p className="text-red-800 leading-relaxed">
                            {feedback.explanation}
                          </p>
                          {feedback.customFeedback && (
                            <div className="mt-4 p-4 bg-white rounded-lg">
                              <p className="text-red-900">
                                💡 {feedback.customFeedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Related Concepts */}
                    {feedback.relatedConcepts && feedback.relatedConcepts.length > 0 && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                        <h3 className="font-bold text-blue-900 text-lg mb-4">
                          📚 Learn more about:
                        </h3>
                        <div className="space-y-2">
                          {feedback.relatedConcepts.map((concept, index) => (
                            <motion.button
                              key={index}
                              whileHover={{ scale: 1.02, x: 5 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleRelatedConceptClick(concept.id)}
                              className="w-full text-left p-4 bg-white hover:bg-blue-100 rounded-lg border border-blue-200 transition-all flex items-center justify-between group"
                            >
                              <span className="text-blue-900 font-medium">{concept.name}</span>
                              <FaArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Try Again Option */}
                    {allowRetry && onTryAgain && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onTryAgain}
                        className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                      >
                        <FaRedo className="mr-2" />
                        Try Again (Reduced Points)
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {/* Next Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onNext}
                  className={`w-full py-4 px-6 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center mt-6 ${
                    feedback.correct
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600'
                  }`}
                >
                  Continue to Next Question
                  <FaArrowRight className="ml-2" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
