import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { personalizationService } from '../../services/api';

const initialState = {
  primaryStyle: null, // 'visual', 'auditory', 'kinesthetic', 'reading-writing'
  secondaryStyle: null,
  scores: {
    visual: 0,
    auditory: 0,
    kinesthetic: 0,
    readingWriting: 0
  },
  quizCompleted: false,
  quizAnswers: [],
  recommendations: [],
  isLoading: false,
  error: null
};

export const submitQuiz = createAsyncThunk(
  'learningStyle/submitQuiz',
  async (answers, { rejectWithValue }) => {
    try {
      const response = await personalizationService.submitLearningStyleQuiz(answers);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit learning style quiz'
      );
    }
  }
);

export const fetchLearningStyle = createAsyncThunk(
  'learningStyle/fetchLearningStyle',
  async (_, { rejectWithValue }) => {
    try {
      const response = await personalizationService.getLearningStyle();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch learning style');
    }
  }
);

const learningStyleSlice = createSlice({
  name: 'learningStyle',
  initialState,
  reducers: {
    setQuizAnswer: (state, action) => {
      const { questionId, answerId, answerValue } = action.payload;
      const existingAnswerIndex = state.quizAnswers.findIndex(
        (a) => a.questionId === questionId
      );

      if (existingAnswerIndex >= 0) {
        state.quizAnswers[existingAnswerIndex] = {
          questionId,
          answerId,
          answerValue
        };
      } else {
        state.quizAnswers.push({
          questionId,
          answerId,
          answerValue
        });
      }
    },
    clearQuizAnswers: (state) => {
      state.quizAnswers = [];
      state.quizCompleted = false;
    },
    setLearningStyle: (state, action) => {
      state.primaryStyle = action.payload.primary;
      state.secondaryStyle = action.payload.secondary;
      state.scores = action.payload.scores;
    },
    setScores: (state, action) => {
      state.scores = action.payload;
    },
    setRecommendations: (state, action) => {
      state.recommendations = action.payload;
    },
    resetLearningStyle: () => {
      return initialState;
    },
    clearLearningStyleError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitQuiz.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.isLoading = false;
        state.quizCompleted = true;
        state.primaryStyle = action.payload.primaryStyle;
        state.secondaryStyle = action.payload.secondaryStyle;
        state.scores = action.payload.scores;
        state.recommendations = action.payload.recommendations || [];
        state.error = null;
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchLearningStyle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLearningStyle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.primaryStyle = action.payload.primaryStyle;
        state.secondaryStyle = action.payload.secondaryStyle;
        state.scores = action.payload.scores;
        state.quizCompleted = action.payload.quizCompleted;
        state.recommendations = action.payload.recommendations || [];
        state.error = null;
      })
      .addCase(fetchLearningStyle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setQuizAnswer,
  clearQuizAnswers,
  setLearningStyle,
  setScores,
  setRecommendations,
  resetLearningStyle,
  clearLearningStyleError
} = learningStyleSlice.actions;

export default learningStyleSlice.reducer;
