import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  assessmentService,
  personalizationService,
  knowledgeGraphService,
  analyticsService
} from '../../services/api';

// Async thunks
export const generateQuiz = createAsyncThunk(
  'quiz/generateQuiz',
  async ({ conceptId, difficulty, questionCount, userId }, { rejectWithValue }) => {
    try {
      const quiz = await assessmentService.generateQuestions({
        conceptId,
        difficulty,
        questionCount,
        userId
      });
      return quiz;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAdaptiveQuestion = createAsyncThunk(
  'quiz/fetchAdaptiveQuestion',
  async ({ userId, performanceHistory, currentDifficulty }, { rejectWithValue }) => {
    try {
      const question = await assessmentService.getAdaptiveQuestion({
        userId,
        performanceHistory,
        currentDifficulty
      });
      return question;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'quiz/submitAnswer',
  async ({ quizId, questionId, answer, timeSpent, userId }, { rejectWithValue }) => {
    try {
      const result = await assessmentService.gradeAnswer({
        quizId,
        questionId,
        answer,
        timeSpent,
        userId
      });
      
      // Track analytics event
      await analyticsService.trackEvent({
        userId,
        eventType: 'answer_submitted',
        metadata: {
          questionId,
          correct: result.correct,
          timeSpent
        }
      });
      
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchQuiz = createAsyncThunk(
  'quiz/fetchQuiz',
  async (quizId, { rejectWithValue }) => {
    try {
      const quiz = await assessmentService.getQuiz(quizId);
      return quiz;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const completeQuiz = createAsyncThunk(
  'quiz/completeQuiz',
  async ({ quizId, userId, answers, score, timeSpent }, { rejectWithValue }) => {
    try {
      const results = await assessmentService.submitQuiz(quizId, {
        userId,
        answers,
        score,
        timeSpent
      });
      
      // Update mastery levels based on performance
      if (results.conceptMastery) {
        await knowledgeGraphService.updateMastery({
          userId,
          masteryData: results.conceptMastery
        });
      }
      
      // Track quiz completion
      await analyticsService.trackEvent({
        userId,
        eventType: 'quiz_completed',
        metadata: {
          quizId,
          score,
          timeSpent,
          questionCount: Object.keys(answers).length
        }
      });
      
      return results;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getFeedback = createAsyncThunk(
  'quiz/getFeedback',
  async ({ userId, questionId, correct, conceptId }, { rejectWithValue }) => {
    try {
      const feedback = await personalizationService.getQuizFeedback({
        userId,
        questionId,
        correct,
        conceptId
      });
      return feedback;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const requestHint = createAsyncThunk(
  'quiz/requestHint',
  async ({ questionId, userId }, { rejectWithValue }) => {
    try {
      const hint = await assessmentService.getHint({
        questionId,
        userId
      });
      return { questionId, hint };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  quizId: null,
  conceptId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  userAnswers: {},
  feedback: {},
  hints: {},
  score: 0,
  correctCount: 0,
  incorrectCount: 0,
  skippedCount: 0,
  timeRemaining: null,
  totalTime: null,
  timeSpent: 0,
  isPaused: false,
  showFeedback: false,
  currentFeedback: null,
  completed: false,
  results: null,
  settings: {
    difficulty: 'medium',
    questionCount: 10,
    timeLimit: null,
    allowHints: true,
    adaptiveDifficulty: true,
    showExplanations: true
  },
  adaptiveSettings: {
    currentDifficulty: 'medium',
    performanceHistory: []
  },
  loading: {
    quiz: false,
    question: false,
    grading: false,
    results: false,
    hint: false
  },
  error: null,
  startTime: null,
  endTime: null
};

// Quiz slice
const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    setQuizSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload
      };
    },
    
    startQuiz: (state, action) => {
      state.startTime = new Date().toISOString();
      state.timeRemaining = state.settings.timeLimit || null;
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.userAnswers = {};
      state.feedback = {};
      state.hints = {};
      state.score = 0;
      state.correctCount = 0;
      state.incorrectCount = 0;
      state.skippedCount = 0;
      state.timeSpent = 0;
      state.completed = false;
      state.results = null;
      state.showFeedback = false;
      state.currentFeedback = null;
      state.isPaused = false;
    },
    
    answerQuestion: (state, action) => {
      const { questionId, answer } = action.payload;
      state.userAnswers[questionId] = {
        answer,
        timestamp: new Date().toISOString()
      };
    },
    
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
        state.showFeedback = false;
        state.currentFeedback = null;
      }
    },
    
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
        state.showFeedback = false;
        state.currentFeedback = null;
      }
    },
    
    goToQuestion: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.questions.length) {
        state.currentQuestionIndex = index;
        state.showFeedback = false;
        state.currentFeedback = null;
      }
    },
    
    skipQuestion: (state) => {
      const currentQuestion = state.questions[state.currentQuestionIndex];
      if (currentQuestion) {
        state.answers[currentQuestion.id] = {
          skipped: true,
          timestamp: new Date().toISOString()
        };
        state.skippedCount += 1;
        
        if (state.currentQuestionIndex < state.questions.length - 1) {
          state.currentQuestionIndex += 1;
        }
      }
    },
    
    togglePause: (state) => {
      state.isPaused = !state.isPaused;
    },
    
    decrementTime: (state) => {
      if (state.timeRemaining !== null && state.timeRemaining > 0 && !state.isPaused) {
        state.timeRemaining -= 1;
        state.timeSpent += 1;
      }
    },
    
    setShowFeedback: (state, action) => {
      state.showFeedback = action.payload;
    },
    
    clearCurrentFeedback: (state) => {
      state.currentFeedback = null;
      state.showFeedback = false;
    },
    
    updateScore: (state, action) => {
      state.score = action.payload;
    },
    
    resetQuiz: (state) => {
      return {
        ...initialState,
        settings: state.settings
      };
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Generate quiz
      .addCase(generateQuiz.pending, (state) => {
        state.loading.quiz = true;
        state.error = null;
      })
      .addCase(generateQuiz.fulfilled, (state, action) => {
        state.loading.quiz = false;
        state.quizId = action.payload.quizId;
        state.conceptId = action.payload.conceptId;
        state.questions = action.payload.questions;
        state.totalTime = action.payload.estimatedTime;
        
        if (state.settings.timeLimit) {
          state.timeRemaining = state.settings.timeLimit * 60; // Convert minutes to seconds
        }
      })
      .addCase(generateQuiz.rejected, (state, action) => {
        state.loading.quiz = false;
        state.error = action.payload || 'Failed to generate quiz';
      })
      
      // Fetch adaptive question
      .addCase(fetchAdaptiveQuestion.pending, (state) => {
        state.loading.question = true;
      })
      .addCase(fetchAdaptiveQuestion.fulfilled, (state, action) => {
        state.loading.question = false;
        state.questions.push(action.payload);
        state.adaptiveSettings.currentDifficulty = action.payload.difficulty;
      })
      .addCase(fetchAdaptiveQuestion.rejected, (state, action) => {
        state.loading.question = false;
        state.error = action.payload || 'Failed to fetch adaptive question';
      })
      
      // Submit answer
      .addCase(submitAnswer.pending, (state) => {
        state.loading.grading = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.loading.grading = false;
        
        const { questionId, correct, score, feedback, explanation, relatedConcepts } = action.payload;
        
        // Store answer result
        state.answers[questionId] = {
          correct,
          score,
          timestamp: new Date().toISOString()
        };
        
        // Update feedback
        state.feedback[questionId] = {
          correct,
          explanation,
          relatedConcepts,
          customFeedback: feedback
        };
        
        // Update counts
        if (correct) {
          state.correctCount += 1;
        } else {
          state.incorrectCount += 1;
        }
        
        // Update total score
        state.score += score;
        
        // Set current feedback
        state.currentFeedback = {
          questionId,
          correct,
          explanation,
          relatedConcepts,
          customFeedback: feedback
        };
        state.showFeedback = true;
        
        // Update adaptive settings
        if (state.settings.adaptiveDifficulty) {
          state.adaptiveSettings.performanceHistory.push({
            questionId,
            correct,
            difficulty: state.questions[state.currentQuestionIndex]?.difficulty,
            timeSpent: action.meta.arg.timeSpent
          });
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.loading.grading = false;
        state.error = action.payload || 'Failed to submit answer';
      })
      
      // Fetch quiz
      .addCase(fetchQuiz.pending, (state) => {
        state.loading.quiz = true;
      })
      .addCase(fetchQuiz.fulfilled, (state, action) => {
        state.loading.quiz = false;
        state.quizId = action.payload.quizId;
        state.conceptId = action.payload.conceptId;
        state.questions = action.payload.questions;
        state.answers = action.payload.answers || {};
        state.score = action.payload.score || 0;
        state.completed = action.payload.completed || false;
      })
      .addCase(fetchQuiz.rejected, (state, action) => {
        state.loading.quiz = false;
        state.error = action.payload || 'Failed to fetch quiz';
      })
      
      // Complete quiz
      .addCase(completeQuiz.pending, (state) => {
        state.loading.results = true;
      })
      .addCase(completeQuiz.fulfilled, (state, action) => {
        state.loading.results = false;
        state.completed = true;
        state.endTime = new Date().toISOString();
        state.results = action.payload;
        state.isPaused = true; // Stop timer
      })
      .addCase(completeQuiz.rejected, (state, action) => {
        state.loading.results = false;
        state.error = action.payload || 'Failed to complete quiz';
      })
      
      // Get feedback
      .addCase(getFeedback.fulfilled, (state, action) => {
        const { questionId, feedback } = action.payload;
        if (state.feedback[questionId]) {
          state.feedback[questionId].personalizedFeedback = feedback;
        }
      })
      
      // Request hint
      .addCase(requestHint.pending, (state) => {
        state.loading.hint = true;
      })
      .addCase(requestHint.fulfilled, (state, action) => {
        state.loading.hint = false;
        const { questionId, hint } = action.payload;
        state.hints[questionId] = hint;
        
        // Deduct points for using hint
        state.score = Math.max(0, state.score - 5);
      })
      .addCase(requestHint.rejected, (state, action) => {
        state.loading.hint = false;
        state.error = action.payload || 'Failed to get hint';
      });
  }
});

export const {
  setQuizSettings,
  startQuiz,
  answerQuestion,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  skipQuestion,
  togglePause,
  decrementTime,
  setShowFeedback,
  clearCurrentFeedback,
  updateScore,
  resetQuiz,
  clearError
} = quizSlice.actions;

export default quizSlice.reducer;
