import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/auth';
import { storageService } from '../../services/storage';

const initialState = {
  user: null,
  token: storageService.getToken(),
  refreshToken: storageService.getRefreshToken(),
  isAuthenticated: !!storageService.getToken(),
  isLoading: false,
  error: null,
  tokenExpiry: null
};

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.signUp(userData);
      storageService.setToken(response.token);
      storageService.setRefreshToken(response.refreshToken);
      storageService.setUser(response.user);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Sign up failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      storageService.setToken(response.token);
      storageService.setRefreshToken(response.refreshToken);
      storageService.setUser(response.user);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (googleToken, { rejectWithValue }) => {
    try {
      const response = await authService.loginWithGoogle(googleToken);
      storageService.setToken(response.token);
      storageService.setRefreshToken(response.refreshToken);
      storageService.setUser(response.user);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Google login failed');
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      if (!token) {
        throw new Error('No token found');
      }
      const response = await authService.verifyToken(token);
      return response;
    } catch (error) {
      storageService.clearAuth();
      return rejectWithValue(error.response?.data?.message || 'Token verification failed');
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshAccessToken',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { refreshToken } = getState().auth;
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }
      const response = await authService.refreshToken(refreshToken);
      storageService.setToken(response.token);
      return response;
    } catch (error) {
      storageService.clearAuth();
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      storageService.clearAuth();
      return null;
    } catch (error) {
      storageService.clearAuth();
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.tokenExpiry = action.payload.expiry;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.tokenExpiry = null;
      state.error = null;
      storageService.clearAuth();
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.tokenExpiry = action.payload.expiry;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.tokenExpiry = action.payload.expiry;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.tokenExpiry = action.payload.expiry;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiry = null;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.tokenExpiry = action.payload.expiry;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiry = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.tokenExpiry = null;
        state.error = null;
      });
  }
});

export const { setToken, clearAuth, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
