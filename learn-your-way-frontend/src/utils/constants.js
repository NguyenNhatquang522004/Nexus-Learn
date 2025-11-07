export const LEARNING_STYLES = {
  VISUAL: 'visual',
  AUDITORY: 'auditory',
  KINESTHETIC: 'kinesthetic',
  READING_WRITING: 'reading-writing'
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

export const SUBJECTS = [
  { value: 'astronomy', label: 'Astronomy', icon: '🌌' },
  { value: 'biology', label: 'Biology', icon: '🧬' },
  { value: 'chemistry', label: 'Chemistry', icon: '🧪' },
  { value: 'computer-science', label: 'Computer Science', icon: '💻' },
  { value: 'ela', label: 'ELA', icon: '📚' },
  { value: 'economics', label: 'Economics', icon: '📊' },
  { value: 'health', label: 'Health', icon: '🏥' },
  { value: 'history', label: 'History', icon: '📜' },
  { value: 'philosophy', label: 'Philosophy', icon: '🤔' },
  { value: 'psychology', label: 'Psychology', icon: '🧠' },
  { value: 'sociology', label: 'Sociology', icon: '👥' }
];

export const GRADE_LEVELS = [
  { value: 'elementary', label: 'Elementary (K-5)' },
  { value: 'middle', label: 'Middle School (6-8)' },
  { value: 'high', label: 'High School (9-12)' },
  { value: 'college', label: 'College' },
  { value: 'graduate', label: 'Graduate School' },
  { value: 'professional', label: 'Professional' }
];

export const LEARNING_GOALS = [
  { value: 'exam-prep', label: 'Exam Preparation' },
  { value: 'skill-building', label: 'Skill Building' },
  { value: 'career-development', label: 'Career Development' },
  { value: 'personal-interest', label: 'Personal Interest' },
  { value: 'academic-support', label: 'Academic Support' },
  { value: 'test-prep', label: 'Test Preparation' },
  { value: 'certification', label: 'Certification' }
];

export const QUIZ_QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
  ESSAY: 'essay',
  MATCHING: 'matching',
  FILL_IN_BLANK: 'fill-in-blank'
};

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  ADMIN: 'admin'
};

export const CONTENT_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain'
};

export const MAX_FILE_SIZE = parseInt(
  import.meta.env.VITE_MAX_FILE_SIZE_MB || '50',
  10
) * 1024 * 1024;

export const ALLOWED_FILE_TYPES = import.meta.env.VITE_ALLOWED_FILE_TYPES
  ? import.meta.env.VITE_ALLOWED_FILE_TYPES.split(',')
  : ['.pdf', '.doc', '.docx', '.txt'];

export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000
};

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500
};

export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROFILE_SETUP: '/profile/setup',
  LEARNING_STYLE_QUIZ: '/quiz/learning-style',
  LEARN: '/learn',
  QUIZ: '/quiz',
  UPLOAD: '/upload',
  STUDY_ROOM: '/study-room',
  SETTINGS: '/settings',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email'
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  PREFERENCES: 'preferences',
  PROFILE: 'profile',
  LEARNING_STYLE: 'learning_style',
  THEME: 'theme',
  LANGUAGE: 'language'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please log in again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access forbidden.',
  TIMEOUT: 'Request timeout. Please try again.'
};

export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  SIGNUP: 'Account created successfully!',
  LOGOUT: 'Successfully logged out!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PREFERENCES_UPDATED: 'Preferences updated successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  QUIZ_SUBMITTED: 'Quiz submitted successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!'
};
