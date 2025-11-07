import { securityClient } from './api';
import { storageService } from './storage';
import jwtDecode from 'jwt-decode';

const AUTH_ENDPOINTS = {
  signup: import.meta.env.VITE_AUTH_SIGNUP_ENDPOINT || '/api/auth/signup',
  login: import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/api/auth/login',
  logout: import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT || '/api/auth/logout',
  verify: import.meta.env.VITE_AUTH_VERIFY_ENDPOINT || '/api/auth/verify',
  refresh: import.meta.env.VITE_AUTH_REFRESH_ENDPOINT || '/api/auth/refresh',
  googleAuth: '/api/auth/google',
  resetPassword: '/api/auth/reset-password',
  changePassword: '/api/auth/change-password',
  verifyEmail: '/api/auth/verify-email'
};

class AuthService {
  async signUp(userData) {
    try {
      const response = await securityClient.post(AUTH_ENDPOINTS.signup, {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        age: userData.age,
        grade: userData.grade,
        school: userData.school,
        parentalConsent: userData.parentalConsent,
        termsAccepted: userData.termsAccepted,
        privacyAccepted: userData.privacyAccepted
      });

      if (response.token) {
        this.handleAuthResponse(response);
      }

      return response;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      const response = await securityClient.post(AUTH_ENDPOINTS.login, {
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe || false
      });

      if (response.token) {
        this.handleAuthResponse(response);
      }

      return response;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async loginWithGoogle(googleToken) {
    try {
      const response = await securityClient.post(AUTH_ENDPOINTS.googleAuth, {
        token: googleToken,
        provider: 'google'
      });

      if (response.token) {
        this.handleAuthResponse(response);
      }

      return response;
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  async logout() {
    try {
      const token = storageService.getToken();
      if (token) {
        await securityClient.post(AUTH_ENDPOINTS.logout, {
          token
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async verifyToken(token) {
    try {
      const response = await securityClient.post(AUTH_ENDPOINTS.verify, {
        token
      });

      return response;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const response = await securityClient.post(AUTH_ENDPOINTS.refresh, {
        refreshToken
      });

      if (response.token) {
        storageService.setToken(response.token);
      }

      return response;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      const response = await securityClient.post(AUTH_ENDPOINTS.resetPassword, {
        email
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await securityClient.post(AUTH_ENDPOINTS.changePassword, {
        currentPassword,
        newPassword
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      const response = await securityClient.post(AUTH_ENDPOINTS.verifyEmail, {
        token
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  isAuthenticated() {
    const token = storageService.getToken();
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      this.clearAuthData();
      return false;
    }
  }

  getTokenExpiry() {
    const token = storageService.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000;
    } catch (error) {
      return null;
    }
  }

  getUserFromToken() {
    const token = storageService.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode(token);
      return {
        id: decoded.sub || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role
      };
    } catch (error) {
      return null;
    }
  }

  handleAuthResponse(response) {
    if (response.token) {
      storageService.setToken(response.token);
    }

    if (response.refreshToken) {
      storageService.setRefreshToken(response.refreshToken);
    }

    if (response.user) {
      storageService.setUser(response.user);
    }

    if (response.expiry) {
      storageService.setItem('tokenExpiry', response.expiry.toString());
    }
  }

  handleAuthError(error) {
    if (error.response?.status === 401) {
      this.clearAuthData();
    }
    
    console.error('Auth error:', error.response?.data?.message || error.message);
  }

  clearAuthData() {
    storageService.clearAuth();
  }

  async checkCOPPACompliance(age) {
    const minimumAge = parseInt(import.meta.env.VITE_MINIMUM_AGE || '13', 10);
    const requiresParentalConsent = age < minimumAge;

    return {
      isCompliant: age >= minimumAge,
      requiresParentalConsent,
      minimumAge
    };
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid:
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
      errors: {
        minLength: password.length < minLength,
        hasUpperCase: !hasUpperCase,
        hasLowerCase: !hasLowerCase,
        hasNumbers: !hasNumbers,
        hasSpecialChar: !hasSpecialChar
      }
    };
  }

  async setupTokenRefreshTimer() {
    const token = storageService.getToken();
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const expiryTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      const refreshTime = timeUntilExpiry - 5 * 60 * 1000;

      if (refreshTime > 0) {
        setTimeout(async () => {
          try {
            const refreshToken = storageService.getRefreshToken();
            if (refreshToken) {
              await this.refreshToken(refreshToken);
              this.setupTokenRefreshTimer();
            }
          } catch (error) {
            console.error('Token refresh failed:', error);
            this.clearAuthData();
            window.location.href = '/login';
          }
        }, refreshTime);
      }
    } catch (error) {
      console.error('Error setting up token refresh timer:', error);
    }
  }
}

export const authService = new AuthService();
export default authService;
