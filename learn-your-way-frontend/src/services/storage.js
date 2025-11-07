const STORAGE_PREFIX = import.meta.env.VITE_LOCAL_STORAGE_PREFIX || 'learn_your_way_';
const SESSION_PREFIX = import.meta.env.VITE_SESSION_STORAGE_PREFIX || 'lyw_session_';

const KEYS = {
  TOKEN: `${STORAGE_PREFIX}token`,
  REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,
  USER: `${STORAGE_PREFIX}user`,
  PREFERENCES: `${STORAGE_PREFIX}preferences`,
  PROFILE: `${STORAGE_PREFIX}profile`,
  LEARNING_STYLE: `${STORAGE_PREFIX}learning_style`,
  THEME: `${STORAGE_PREFIX}theme`,
  LANGUAGE: `${STORAGE_PREFIX}language`
};

class StorageService {
  setItem(key, value, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      const prefixedKey = useSession ? `${SESSION_PREFIX}${key}` : `${STORAGE_PREFIX}${key}`;
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      storage.setItem(prefixedKey, serializedValue);
      return true;
    } catch (error) {
      console.error('Error setting item in storage:', error);
      return false;
    }
  }

  getItem(key, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      const prefixedKey = useSession ? `${SESSION_PREFIX}${key}` : `${STORAGE_PREFIX}${key}`;
      const item = storage.getItem(prefixedKey);
      
      if (!item) return null;

      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  removeItem(key, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      const prefixedKey = useSession ? `${SESSION_PREFIX}${key}` : `${STORAGE_PREFIX}${key}`;
      storage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error('Error removing item from storage:', error);
      return false;
    }
  }

  clear(useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      const prefix = useSession ? SESSION_PREFIX : STORAGE_PREFIX;
      const keys = Object.keys(storage);

      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          storage.removeItem(key);
        }
      });

      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  setToken(token) {
    return this.setItem('token', token);
  }

  getToken() {
    return this.getItem('token');
  }

  removeToken() {
    return this.removeItem('token');
  }

  setRefreshToken(refreshToken) {
    return this.setItem('refresh_token', refreshToken);
  }

  getRefreshToken() {
    return this.getItem('refresh_token');
  }

  removeRefreshToken() {
    return this.removeItem('refresh_token');
  }

  setUser(user) {
    return this.setItem('user', user);
  }

  getUser() {
    return this.getItem('user');
  }

  removeUser() {
    return this.removeItem('user');
  }

  setPreferences(preferences) {
    return this.setItem('preferences', preferences);
  }

  getPreferences() {
    return this.getItem('preferences');
  }

  removePreferences() {
    return this.removeItem('preferences');
  }

  setProfile(profile) {
    return this.setItem('profile', profile);
  }

  getProfile() {
    return this.getItem('profile');
  }

  removeProfile() {
    return this.removeItem('profile');
  }

  setLearningStyle(learningStyle) {
    return this.setItem('learning_style', learningStyle);
  }

  getLearningStyle() {
    return this.getItem('learning_style');
  }

  removeLearningStyle() {
    return this.removeItem('learning_style');
  }

  setTheme(theme) {
    return this.setItem('theme', theme);
  }

  getTheme() {
    return this.getItem('theme') || 'light';
  }

  removeTheme() {
    return this.removeItem('theme');
  }

  setLanguage(language) {
    return this.setItem('language', language);
  }

  getLanguage() {
    return this.getItem('language') || 'en';
  }

  removeLanguage() {
    return this.removeItem('language');
  }

  clearAuth() {
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
    return true;
  }

  clearAllData() {
    this.clear(false);
    this.clear(true);
    return true;
  }

  getStorageSize() {
    let totalSize = 0;
    
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(STORAGE_PREFIX)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      
      return {
        bytes: totalSize,
        kilobytes: (totalSize / 1024).toFixed(2),
        megabytes: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return { bytes: 0, kilobytes: '0', megabytes: '0' };
    }
  }

  isStorageAvailable(type = 'localStorage') {
    try {
      const storage = window[type];
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  exportData() {
    const data = {};
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          const value = this.getItem(key.replace(STORAGE_PREFIX, ''));
          data[key.replace(STORAGE_PREFIX, '')] = value;
        }
      });
      
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  importData(data) {
    try {
      Object.keys(data).forEach(key => {
        this.setItem(key, data[key]);
      });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  getCacheItem(key, maxAge = 3600000) {
    const cached = this.getItem(`cache_${key}`);
    
    if (!cached) return null;

    const { data, timestamp } = cached;
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      this.removeItem(`cache_${key}`);
      return null;
    }

    return data;
  }

  setCacheItem(key, data, useSession = false) {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    return this.setItem(`cache_${key}`, cacheData, useSession);
  }

  clearCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${STORAGE_PREFIX}cache_`)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
