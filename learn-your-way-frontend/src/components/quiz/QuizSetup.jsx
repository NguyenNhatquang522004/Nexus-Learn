import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaClock, FaGraduationCap, FaChartLine, FaQuestionCircle } from 'react-icons/fa';
import { knowledgeGraphService } from '../../services/api';

const QuizSetup = ({ onStart, loading, error }) => {
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(null);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(true);
  const [loadingConcepts, setLoadingConcepts] = useState(false);

  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    setLoadingConcepts(true);
    try {
      // Fetch available concepts from knowledge graph
      const response = await knowledgeGraphService.getGraph();
      setConcepts(response.concepts || []);
      
      if (response.concepts?.length > 0) {
        setSelectedConcept(response.concepts[0].id);
      }
    } catch (err) {
      console.error('Failed to load concepts:', err);
    } finally {
      setLoadingConcepts(false);
    }
  };

  const handleStart = () => {
    if (!selectedConcept) return;

    onStart({
      conceptId: selectedConcept,
      difficulty,
      questionCount,
      timeLimit,
      adaptiveDifficulty
    });
  };

  const difficultyLevels = [
    { value: 'easy', label: 'Easy', color: 'from-green-500 to-emerald-500' },
    { value: 'medium', label: 'Medium', color: 'from-blue-500 to-cyan-500' },
    { value: 'hard', label: 'Hard', color: 'from-orange-500 to-red-500' }
  ];

  const questionCounts = [5, 10, 15, 20];
  const timeLimits = [
    { value: null, label: 'No Limit' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <FaGraduationCap className="text-4xl text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Start Your Quiz
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Configure your quiz settings and test your knowledge. Choose adaptive mode for a personalized learning experience.
          </p>
        </motion.div>

        {/* Setup Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Concept Selection */}
          <div className="mb-8">
            <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
              <FaQuestionCircle className="mr-2 text-blue-600" />
              Select Topic
            </label>
            {loadingConcepts ? (
              <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
            ) : (
              <select
                value={selectedConcept || ''}
                onChange={(e) => setSelectedConcept(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 bg-white"
              >
                {concepts.map((concept) => (
                  <option key={concept.id} value={concept.id}>
                    {concept.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Difficulty Selection */}
          <div className="mb-8">
            <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
              <FaChartLine className="mr-2 text-blue-600" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-4">
              {difficultyLevels.map((level) => (
                <motion.button
                  key={level.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty(level.value)}
                  className={`relative overflow-hidden p-6 rounded-xl border-2 transition-all ${
                    difficulty === level.value
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {difficulty === level.value && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-10`}></div>
                  )}
                  <div className="relative">
                    <div className={`text-2xl font-bold bg-gradient-to-br ${level.color} bg-clip-text text-transparent mb-2`}>
                      {level.label}
                    </div>
                    {difficulty === level.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 bg-blue-500 rounded-full mx-auto flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="mb-8">
            <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
              <FaQuestionCircle className="mr-2 text-blue-600" />
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-4">
              {questionCounts.map((count) => (
                <motion.button
                  key={count}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuestionCount(count)}
                  className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                    questionCount === count
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {count}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Time Limit */}
          <div className="mb-8">
            <label className="flex items-center text-lg font-semibold text-gray-900 mb-4">
              <FaClock className="mr-2 text-blue-600" />
              Time Limit
            </label>
            <div className="grid grid-cols-3 gap-4">
              {timeLimits.map((limit) => (
                <motion.button
                  key={limit.value || 'none'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTimeLimit(limit.value)}
                  className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                    timeLimit === limit.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {limit.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Adaptive Difficulty Toggle */}
          <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Adaptive Difficulty
                </h3>
                <p className="text-sm text-gray-600">
                  Questions adjust based on your performance using AI-powered IRT model
                </p>
              </div>
              <button
                onClick={() => setAdaptiveDifficulty(!adaptiveDifficulty)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  adaptiveDifficulty ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <motion.span
                  animate={{ x: adaptiveDifficulty ? 28 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                />
              </button>
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={!selectedConcept || loading}
            className={`w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${
              (!selectedConcept || loading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Quiz...
              </>
            ) : (
              <>
                <FaPlay className="mr-2" />
                Start Quiz
              </>
            )}
          </motion.button>

          {/* Quiz Info */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-gray-600">
            <div>
              <div className="font-semibold text-gray-900">{questionCount}</div>
              <div>Questions</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {timeLimit ? `${timeLimit} min` : 'Unlimited'}
              </div>
              <div>Time</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900 capitalize">{difficulty}</div>
              <div>Difficulty</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default QuizSetup;
