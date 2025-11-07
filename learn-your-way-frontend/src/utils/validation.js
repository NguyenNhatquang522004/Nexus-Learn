export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
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
    },
    messages: {
      minLength: `Password must be at least ${minLength} characters`,
      hasUpperCase: 'Password must contain at least one uppercase letter',
      hasLowerCase: 'Password must contain at least one lowercase letter',
      hasNumbers: 'Password must contain at least one number',
      hasSpecialChar: 'Password must contain at least one special character'
    }
  };
};

export const validateAge = (age) => {
  const parsedAge = parseInt(age, 10);
  return !isNaN(parsedAge) && parsedAge >= 5 && parsedAge <= 120;
};

export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

export const validateMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
  return value && value.length <= maxLength;
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

export const checkCOPPACompliance = (age) => {
  const minimumAge = parseInt(import.meta.env.VITE_MINIMUM_AGE || '13', 10);
  const parsedAge = parseInt(age, 10);
  const requiresParentalConsent = parsedAge < minimumAge;

  return {
    isCompliant: parsedAge >= minimumAge,
    requiresParentalConsent,
    minimumAge,
    age: parsedAge
  };
};
