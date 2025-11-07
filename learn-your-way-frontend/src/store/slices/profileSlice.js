import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { securityService, analyticsService, personalizationService } from '../../services/api';

// Async thunks for profile management

// Fetch user profile data
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await securityService.getProfile(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch profile');
    }
  }
);

// Update profile information
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async ({ userId, profileData }, { rejectWithValue }) => {
    try {
      const response = await securityService.updateProfile(userId, profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update profile');
    }
  }
);

// Upload avatar image
export const uploadAvatar = createAsyncThunk(
  'profile/uploadAvatar',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await securityService.uploadAvatar(userId, formData);
      return response.avatarUrl;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to upload avatar');
    }
  }
);

// Fetch user statistics
export const fetchStats = createAsyncThunk(
  'profile/fetchStats',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getUserMetrics(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch stats');
    }
  }
);

// Fetch user achievements
export const fetchAchievements = createAsyncThunk(
  'profile/fetchAchievements',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getUserAchievements(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch achievements');
    }
  }
);

// Fetch activity timeline
export const fetchActivity = createAsyncThunk(
  'profile/fetchActivity',
  async ({ userId, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getUserActivity(userId, limit);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch activity');
    }
  }
);

// Update learning preferences
export const updatePreferences = createAsyncThunk(
  'profile/updatePreferences',
  async ({ userId, preferences }, { rejectWithValue }) => {
    try {
      const response = await personalizationService.updatePreferences(userId, preferences);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update preferences');
    }
  }
);

// Update settings
export const updateSettings = createAsyncThunk(
  'profile/updateSettings',
  async ({ userId, settings }, { rejectWithValue }) => {
    try {
      const response = await securityService.updateSettings(userId, settings);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update settings');
    }
  }
);

// Change password
export const changePassword = createAsyncThunk(
  'profile/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await securityService.changePassword(passwordData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to change password');
    }
  }
);

// Export user data (GDPR)
export const exportData = createAsyncThunk(
  'profile/exportData',
  async ({ userId, options, format }, { rejectWithValue }) => {
    try {
      const response = await securityService.exportUserData(userId, { ...options, format });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to export data');
    }
  }
);

// Delete account
export const deleteAccount = createAsyncThunk(
  'profile/deleteAccount',
  async ({ userId, password, reason }, { rejectWithValue }) => {
    try {
      const response = await securityService.deleteAccount(userId, { password, reason });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete account');
    }
  }
);

// Fetch privacy settings
export const fetchPrivacySettings = createAsyncThunk(
  'profile/fetchPrivacySettings',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await securityService.getPrivacySettings(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch privacy settings');
    }
  }
);

// Update privacy settings
export const updatePrivacySettings = createAsyncThunk(
  'profile/updatePrivacySettings',
  async ({ userId, privacySettings }, { rejectWithValue }) => {
    try {
      const response = await securityService.updatePrivacySettings(userId, privacySettings);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update privacy settings');
    }
  }
);

// Verify age (COPPA compliance)
export const verifyAge = createAsyncThunk(
  'profile/verifyAge',
  async ({ userId, dateOfBirth, parentalConsent }, { rejectWithValue }) => {
    try {
      const response = await securityService.verifyAge(userId, { dateOfBirth, parentalConsent });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to verify age');
    }
  }
);

// Initial state
const initialState = {
  // Profile data
  profile: {
    id: null,
    name: '',
    email: '',
    avatar: '',
    grade: '',
    school: '',
    bio: '',
    dateOfBirth: null,
    ageVerified: false,
    parentalConsent: false,
    createdAt: null,
    updatedAt: null,
  },

  // Statistics
  stats: {
    totalStudyTime: 0, // in minutes
    conceptsMastered: 0,
    quizzesCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0,
    level: 1,
    averageQuizScore: 0,
    studyRoomsJoined: 0,
    contentCreated: 0,
    lastActivity: null,
  },

  // Achievements
  achievements: [],
  achievementCategories: ['learning', 'social', 'milestones'],
  unlockedCount: 0,
  totalAchievements: 0,
  achievementProgress: 0,
  selectedCategory: 'learning',

  // Activity timeline
  activities: [],
  activityPage: 1,
  activityHasMore: false,

  // Learning preferences
  preferences: {
    learningStyle: 'visual', // visual, auditory, kinesthetic, reading
    difficultyPreference: 'intermediate', // beginner, intermediate, advanced
    language: 'en',
    interests: [],
    studyGoals: [],
    preferredContentFormat: 'mixed', // text, video, interactive, mixed
  },

  // Settings
  settings: {
    notifications: {
      email: true,
      reviewReminders: true,
      achievementAlerts: true,
      studyRoomInvites: true,
      weeklyProgress: false,
      newContent: true,
    },
    privacy: {
      showProfile: true,
      showOnLeaderboard: true,
      allowStudyRoomInvites: true,
      dataSharing: 'anonymous', // none, anonymous, full
      showActivity: true,
      publicProfile: false,
    },
    appearance: {
      theme: 'auto', // light, dark, auto
      language: 'en',
      fontSize: 'medium', // small, medium, large
      reducedMotion: false,
      highContrast: false,
    },
    account: {
      twoFactorEnabled: false,
      sessionTimeout: 30, // minutes
      connectedAccounts: [],
    },
  },

  // GDPR/Privacy
  gdpr: {
    consentGiven: false,
    consentDate: null,
    dataProcessingAgreed: false,
    marketingConsent: false,
    lastExportDate: null,
    exportInProgress: false,
    exportUrl: null,
  },

  // UI state
  editMode: false,
  activeSection: 'notifications', // for settings page
  showChangePasswordDialog: false,
  showDeleteAccountDialog: false,
  showExportDataDialog: false,
  showConsentDialog: false,
  showAgeVerificationDialog: false,

  // Loading states
  loading: {
    profile: false,
    stats: false,
    achievements: false,
    activity: false,
    preferences: false,
    settings: false,
    privacySettings: false,
    avatar: false,
    password: false,
    export: false,
    delete: false,
    ageVerification: false,
  },

  error: null,
  successMessage: null,
};

// Profile slice
const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // UI actions
    setEditMode: (state, action) => {
      state.editMode = action.payload;
    },
    setActiveSection: (state, action) => {
      state.activeSection = action.payload;
    },
    toggleChangePasswordDialog: (state) => {
      state.showChangePasswordDialog = !state.showChangePasswordDialog;
    },
    setShowChangePasswordDialog: (state, action) => {
      state.showChangePasswordDialog = action.payload;
    },
    toggleDeleteAccountDialog: (state) => {
      state.showDeleteAccountDialog = !state.showDeleteAccountDialog;
    },
    setShowDeleteAccountDialog: (state, action) => {
      state.showDeleteAccountDialog = action.payload;
    },
    toggleExportDataDialog: (state) => {
      state.showExportDataDialog = !state.showExportDataDialog;
    },
    setShowExportDataDialog: (state, action) => {
      state.showExportDataDialog = action.payload;
    },
    toggleConsentDialog: (state) => {
      state.showConsentDialog = !state.showConsentDialog;
    },
    setShowConsentDialog: (state, action) => {
      state.showConsentDialog = action.payload;
    },
    toggleAgeVerificationDialog: (state) => {
      state.showAgeVerificationDialog = !state.showAgeVerificationDialog;
    },
    setShowAgeVerificationDialog: (state, action) => {
      state.showAgeVerificationDialog = action.payload;
    },

    // Profile actions
    updateProfileField: (state, action) => {
      const { field, value } = action.payload;
      state.profile[field] = value;
    },
    updateMultipleProfileFields: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },

    // Preferences actions
    updatePreferenceField: (state, action) => {
      const { field, value } = action.payload;
      state.preferences[field] = value;
    },
    addInterest: (state, action) => {
      if (!state.preferences.interests.includes(action.payload)) {
        state.preferences.interests.push(action.payload);
      }
    },
    removeInterest: (state, action) => {
      state.preferences.interests = state.preferences.interests.filter(
        (interest) => interest !== action.payload
      );
    },
    addStudyGoal: (state, action) => {
      if (!state.preferences.studyGoals.includes(action.payload)) {
        state.preferences.studyGoals.push(action.payload);
      }
    },
    removeStudyGoal: (state, action) => {
      state.preferences.studyGoals = state.preferences.studyGoals.filter(
        (goal) => goal !== action.payload
      );
    },

    // Settings actions
    updateNotificationSetting: (state, action) => {
      const { setting, value } = action.payload;
      state.settings.notifications[setting] = value;
    },
    updatePrivacySetting: (state, action) => {
      const { setting, value } = action.payload;
      state.settings.privacy[setting] = value;
    },
    updateAppearanceSetting: (state, action) => {
      const { setting, value } = action.payload;
      state.settings.appearance[setting] = value;
    },
    updateAccountSetting: (state, action) => {
      const { setting, value } = action.payload;
      state.settings.account[setting] = value;
    },

    // Achievement actions
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },

    // Activity actions
    loadMoreActivities: (state) => {
      state.activityPage += 1;
    },
    appendActivities: (state, action) => {
      state.activities = [...state.activities, ...action.payload];
    },

    // GDPR actions
    updateGDPRConsent: (state, action) => {
      state.gdpr = { ...state.gdpr, ...action.payload };
    },

    // Message actions
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
      state.error = null;
    },
    clearMessages: (state) => {
      state.successMessage = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Reset
    resetProfileState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading.profile = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.profile = { ...state.profile, ...action.payload };
        state.successMessage = 'Profile updated successfully';
        state.editMode = false;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading.profile = false;
        state.error = action.payload;
      });

    // Upload avatar
    builder
      .addCase(uploadAvatar.pending, (state) => {
        state.loading.avatar = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading.avatar = false;
        state.profile.avatar = action.payload;
        state.successMessage = 'Avatar updated successfully';
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading.avatar = false;
        state.error = action.payload;
      });

    // Fetch stats
    builder
      .addCase(fetchStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      });

    // Fetch achievements
    builder
      .addCase(fetchAchievements.pending, (state) => {
        state.loading.achievements = true;
        state.error = null;
      })
      .addCase(fetchAchievements.fulfilled, (state, action) => {
        state.loading.achievements = false;
        state.achievements = action.payload.achievements || [];
        state.unlockedCount = action.payload.unlockedCount || 0;
        state.totalAchievements = action.payload.totalAchievements || 0;
        state.achievementProgress = state.totalAchievements > 0
          ? Math.round((state.unlockedCount / state.totalAchievements) * 100)
          : 0;
      })
      .addCase(fetchAchievements.rejected, (state, action) => {
        state.loading.achievements = false;
        state.error = action.payload;
      });

    // Fetch activity
    builder
      .addCase(fetchActivity.pending, (state) => {
        state.loading.activity = true;
        state.error = null;
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.loading.activity = false;
        if (state.activityPage === 1) {
          state.activities = action.payload.activities || [];
        } else {
          state.activities = [...state.activities, ...(action.payload.activities || [])];
        }
        state.activityHasMore = action.payload.hasMore || false;
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.loading.activity = false;
        state.error = action.payload;
      });

    // Update preferences
    builder
      .addCase(updatePreferences.pending, (state) => {
        state.loading.preferences = true;
        state.error = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.loading.preferences = false;
        state.preferences = { ...state.preferences, ...action.payload };
        state.successMessage = 'Preferences updated successfully';
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.loading.preferences = false;
        state.error = action.payload;
      });

    // Update settings
    builder
      .addCase(updateSettings.pending, (state) => {
        state.loading.settings = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading.settings = false;
        state.settings = { ...state.settings, ...action.payload };
        state.successMessage = 'Settings saved successfully';
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading.settings = false;
        state.error = action.payload;
      });

    // Change password
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading.password = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading.password = false;
        state.successMessage = 'Password changed successfully';
        state.showChangePasswordDialog = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading.password = false;
        state.error = action.payload;
      });

    // Export data
    builder
      .addCase(exportData.pending, (state) => {
        state.loading.export = true;
        state.gdpr.exportInProgress = true;
        state.error = null;
      })
      .addCase(exportData.fulfilled, (state, action) => {
        state.loading.export = false;
        state.gdpr.exportInProgress = false;
        state.gdpr.exportUrl = action.payload.downloadUrl;
        state.gdpr.lastExportDate = new Date().toISOString();
        state.successMessage = 'Data export ready for download';
      })
      .addCase(exportData.rejected, (state, action) => {
        state.loading.export = false;
        state.gdpr.exportInProgress = false;
        state.error = action.payload;
      });

    // Delete account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading.delete = false;
        state.successMessage = 'Account deletion scheduled. You have 30 days to cancel.';
        state.showDeleteAccountDialog = false;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      });

    // Fetch privacy settings
    builder
      .addCase(fetchPrivacySettings.pending, (state) => {
        state.loading.privacySettings = true;
        state.error = null;
      })
      .addCase(fetchPrivacySettings.fulfilled, (state, action) => {
        state.loading.privacySettings = false;
        state.settings.privacy = { ...state.settings.privacy, ...action.payload };
      })
      .addCase(fetchPrivacySettings.rejected, (state, action) => {
        state.loading.privacySettings = false;
        state.error = action.payload;
      });

    // Update privacy settings
    builder
      .addCase(updatePrivacySettings.pending, (state) => {
        state.loading.privacySettings = true;
        state.error = null;
      })
      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        state.loading.privacySettings = false;
        state.settings.privacy = { ...state.settings.privacy, ...action.payload };
        state.successMessage = 'Privacy settings updated successfully';
      })
      .addCase(updatePrivacySettings.rejected, (state, action) => {
        state.loading.privacySettings = false;
        state.error = action.payload;
      });

    // Verify age
    builder
      .addCase(verifyAge.pending, (state) => {
        state.loading.ageVerification = true;
        state.error = null;
      })
      .addCase(verifyAge.fulfilled, (state, action) => {
        state.loading.ageVerification = false;
        state.profile.ageVerified = action.payload.ageVerified;
        state.profile.parentalConsent = action.payload.parentalConsent;
        state.successMessage = 'Age verification completed successfully';
        state.showAgeVerificationDialog = false;
      })
      .addCase(verifyAge.rejected, (state, action) => {
        state.loading.ageVerification = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  setEditMode,
  setActiveSection,
  toggleChangePasswordDialog,
  setShowChangePasswordDialog,
  toggleDeleteAccountDialog,
  setShowDeleteAccountDialog,
  toggleExportDataDialog,
  setShowExportDataDialog,
  toggleConsentDialog,
  setShowConsentDialog,
  toggleAgeVerificationDialog,
  setShowAgeVerificationDialog,
  updateProfileField,
  updateMultipleProfileFields,
  updatePreferenceField,
  addInterest,
  removeInterest,
  addStudyGoal,
  removeStudyGoal,
  updateNotificationSetting,
  updatePrivacySetting,
  updateAppearanceSetting,
  updateAccountSetting,
  setSelectedCategory,
  loadMoreActivities,
  appendActivities,
  updateGDPRConsent,
  setSuccessMessage,
  clearMessages,
  clearError,
  resetProfileState,
} = profileSlice.actions;

// Selectors
export const selectProfile = (state) => state.profile.profile;
export const selectStats = (state) => state.profile.stats;
export const selectAchievements = (state) => state.profile.achievements;
export const selectFilteredAchievements = (state) => {
  const { achievements, selectedCategory } = state.profile;
  return achievements.filter((achievement) => achievement.category === selectedCategory);
};
export const selectActivities = (state) => state.profile.activities;
export const selectPreferences = (state) => state.profile.preferences;
export const selectSettings = (state) => state.profile.settings;
export const selectGDPR = (state) => state.profile.gdpr;
export const selectLoading = (state) => state.profile.loading;
export const selectError = (state) => state.profile.error;
export const selectSuccessMessage = (state) => state.profile.successMessage;

export default profileSlice.reducer;
