import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { personalizationService } from '../../services/api';

const initialState = {
  language: 'en',
  culture: 'US',
  theme: 'light',
  fontSize: 'medium',
  fontFamily: 'sans-serif',
  colorScheme: 'default',
  highContrast: false,
  reducedMotion: false,
  notifications: {
    email: true,
    push: true,
    inApp: true
  },
  privacy: {
    shareProgress: false,
    showProfile: true,
    allowMessages: true
  },
  accessibility: {
    screenReader: false,
    keyboardNavigation: false,
    audioDescriptions: false,
    closedCaptions: true
  },
  isLoading: false,
  error: null
};

export const savePreferences = createAsyncThunk(
  'preferences/savePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await personalizationService.savePreferences(preferences);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save preferences');
    }
  }
);

export const fetchPreferences = createAsyncThunk(
  'preferences/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await personalizationService.getPreferences();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch preferences');
    }
  }
);

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setCulture: (state, action) => {
      state.culture = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },
    setFontFamily: (state, action) => {
      state.fontFamily = action.payload;
    },
    setColorScheme: (state, action) => {
      state.colorScheme = action.payload;
    },
    toggleHighContrast: (state) => {
      state.highContrast = !state.highContrast;
    },
    toggleReducedMotion: (state) => {
      state.reducedMotion = !state.reducedMotion;
    },
    updateNotificationPreference: (state, action) => {
      const { key, value } = action.payload;
      state.notifications[key] = value;
    },
    updatePrivacyPreference: (state, action) => {
      const { key, value } = action.payload;
      state.privacy[key] = value;
    },
    updateAccessibilityPreference: (state, action) => {
      const { key, value } = action.payload;
      state.accessibility[key] = value;
    },
    resetPreferences: () => {
      return initialState;
    },
    clearPreferencesError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(savePreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(savePreferences.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(savePreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        return { ...state, ...action.payload, isLoading: false, error: null };
      })
      .addCase(fetchPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setLanguage,
  setCulture,
  setTheme,
  setFontSize,
  setFontFamily,
  setColorScheme,
  toggleHighContrast,
  toggleReducedMotion,
  updateNotificationPreference,
  updatePrivacyPreference,
  updateAccessibilityPreference,
  resetPreferences,
  clearPreferencesError
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
