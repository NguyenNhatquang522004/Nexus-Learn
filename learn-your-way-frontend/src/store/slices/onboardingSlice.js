import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { personalizationService } from '../../services/api';

const initialState = {
  basicInfo: {
    name: '',
    age: null,
    grade: '',
    school: ''
  },
  interests: [],
  goals: [],
  subjectPreferences: [],
  difficultyLevel: 'intermediate',
  isComplete: false,
  currentStep: 1,
  totalSteps: 4,
  isLoading: false,
  error: null
};

export const saveProfile = createAsyncThunk(
  'profile/saveProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await personalizationService.saveProfile(profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save profile');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await personalizationService.getProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setBasicInfo: (state, action) => {
      state.basicInfo = { ...state.basicInfo, ...action.payload };
    },
    setInterests: (state, action) => {
      state.interests = action.payload;
    },
    addInterest: (state, action) => {
      if (!state.interests.includes(action.payload)) {
        state.interests.push(action.payload);
      }
    },
    removeInterest: (state, action) => {
      state.interests = state.interests.filter(interest => interest !== action.payload);
    },
    setGoals: (state, action) => {
      state.goals = action.payload;
    },
    addGoal: (state, action) => {
      if (!state.goals.includes(action.payload)) {
        state.goals.push(action.payload);
      }
    },
    removeGoal: (state, action) => {
      state.goals = state.goals.filter(goal => goal !== action.payload);
    },
    setSubjectPreferences: (state, action) => {
      state.subjectPreferences = action.payload;
    },
    addSubjectPreference: (state, action) => {
      if (!state.subjectPreferences.includes(action.payload)) {
        state.subjectPreferences.push(action.payload);
      }
    },
    removeSubjectPreference: (state, action) => {
      state.subjectPreferences = state.subjectPreferences.filter(
        subject => subject !== action.payload
      );
    },
    setDifficultyLevel: (state, action) => {
      state.difficultyLevel = action.payload;
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    nextStep: (state) => {
      if (state.currentStep < state.totalSteps) {
        state.currentStep += 1;
      }
    },
    previousStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
      }
    },
    completeProfile: (state) => {
      state.isComplete = true;
    },
    resetProfile: () => {
      return initialState;
    },
    clearProfileError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isComplete = true;
        state.error = null;
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.basicInfo = action.payload.basicInfo || initialState.basicInfo;
        state.interests = action.payload.interests || [];
        state.goals = action.payload.goals || [];
        state.subjectPreferences = action.payload.subjectPreferences || [];
        state.difficultyLevel = action.payload.difficultyLevel || 'intermediate';
        state.isComplete = action.payload.isComplete || false;
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setBasicInfo,
  setInterests,
  addInterest,
  removeInterest,
  setGoals,
  addGoal,
  removeGoal,
  setSubjectPreferences,
  addSubjectPreference,
  removeSubjectPreference,
  setDifficultyLevel,
  setCurrentStep,
  nextStep,
  previousStep,
  completeProfile,
  resetProfile,
  clearProfileError
} = profileSlice.actions;

export default profileSlice.reducer;
