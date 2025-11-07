import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import profileReducer from './slices/profileSlice';
import preferencesReducer from './slices/preferencesSlice';
import learningStyleReducer from './slices/learningStyleSlice';
import uiReducer from './slices/uiSlice';
import dashboardReducer from './slices/dashboardSlice';
import contentReducer from './slices/contentSlice';
import quizReducer from './slices/quizSlice';
import mindMapReducer from './slices/mindMapSlice';
import uploadReducer from './slices/uploadSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    profile: profileReducer,
    preferences: preferencesReducer,
    learningStyle: learningStyleReducer,
    ui: uiReducer,
    dashboard: dashboardReducer,
    content: contentReducer,
    quiz: quizReducer,
    mindMap: mindMapReducer,
    upload: uploadReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setToken'],
        ignoredPaths: ['auth.tokenExpiry']
      }
    }),
  devTools: import.meta.env.VITE_APP_ENV !== 'production'
});

export default store;
