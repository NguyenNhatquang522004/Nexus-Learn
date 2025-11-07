import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLightbulb, FaImage, FaClock } from 'react-icons/fa';

const QuestionCard = ({ 
  question, 
  onAnswer, 
  onHint, 
  showHint, 
  hint, 
  loading,
  timeSpent,
  questionNumber,
  totalQuestions,
  disabled
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [fillBlankAnswers, setFillBlankAnswers] = useState({});
  const [showHintContent, setShowHintContent] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    // Reset answers when question changes
    setSelectedAnswer(null);
    setTextAnswer('');
    setFillBlankAnswers({});
    setShowHintContent(false);
  }, [question?.id]);

  const handleSubmit = () => {
    let answer;

    switch (question.type) {
      case 'multiple_choice':
        answer = selectedAnswer;
        break;
      case 'short_answer':
        answer = textAnswer.trim();
        break;
      case 'true_false':
        answer = selectedAnswer;
        break;
      case 'fill_blank':
        answer = fillBlankAnswers;
        break;
      default:
        return;
    }

    if (!answer || (question.type === 'fill_blank' && Object.keys(fillBlankAnswers).length === 0)) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    onAnswer(answer);
  };

  const handleHintClick = () => {
    if (!showHintContent && !hint) {
      onHint(question.id);
    }
    setShowHintContent(!showHintContent);
  };

  const getDifficultyColor = () => {
    switch (question.difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={!disabled ? { scale: 1.02 } : {}}
                whileTap={!disabled ? { scale: 0.98 } : {}}
                onClick={() => !disabled && setSelectedAnswer(option)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswer === option && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
        );

      case 'short_answer':
        return (
          <div>
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={disabled}
              placeholder="Type your answer here..."
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={500}
            />
            <div className="mt-2 text-sm text-gray-500 text-right">
              {textAnswer.length} / 500 characters
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              onClick={() => !disabled && setSelectedAnswer(true)}
              className={`p-8 rounded-xl border-2 font-semibold text-lg transition-all ${
                selectedAnswer === true
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-4xl mb-2">✓</div>
              True
            </motion.button>
            <motion.button
              whileHover={!disabled ? { scale: 1.05 } : {}}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              onClick={() => !disabled && setSelectedAnswer(false)}
              className={`p-8 rounded-xl border-2 font-semibold text-lg transition-all ${
                selectedAnswer === false
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-4xl mb-2">✗</div>
              False
            </motion.button>
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-4">
            {question.blanks.map((blank, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="font-semibold text-gray-700">Blank {index + 1}:</span>
                <input
                  type="text"
                  value={fillBlankAnswers[index] || ''}
                  onChange={(e) => setFillBlankAnswers({
                    ...fillBlankAnswers,
                    [index]: e.target.value
                  })}
                  disabled={disabled}
                  placeholder={`Enter answer for blank ${index + 1}`}
                  className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        x: isShaking ? [-10, 10, -10, 10, 0] : 0
      }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor()}`}>
            {question.difficulty}
          </span>
        </div>
        <div className="flex items-center text-gray-500 text-sm">
          <FaClock className="mr-2" />
          {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Question Image */}
      {question.image && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <img
            src={question.image}
            alt="Question illustration"
            className="w-full max-h-64 object-contain rounded-xl"
          />
        </motion.div>
      )}

      {/* Question Text */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {question.text}
        </h2>
        {question.description && (
          <p className="text-gray-600">
            {question.description}
          </p>
        )}
      </div>

      {/* Answer Section */}
      <div className="mb-6">
        {renderQuestionContent()}
      </div>

      {/* Hint Section */}
      {showHint && (
        <div className="mb-6">
          <button
            onClick={handleHintClick}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium mb-2"
          >
            <FaLightbulb className="mr-2" />
            {showHintContent ? 'Hide Hint' : 'Show Hint'} (Costs 5 points)
          </button>
          <AnimatePresence>
            {showHintContent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-yellow-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : hint ? (
                  <p className="text-yellow-900">{hint}</p>
                ) : (
                  <p className="text-yellow-900">Click to load hint...</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        onClick={handleSubmit}
        disabled={disabled}
        className={`w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Submit Answer
      </motion.button>
    </motion.div>
  );
};

export default QuestionCard;
