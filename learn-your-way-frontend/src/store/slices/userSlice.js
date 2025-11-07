import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  id: null,
  email: null,
  name: null,
  age: null,
  grade: null,
  school: null,
  avatarUrl: null,
  createdAt: null,
  isVerified: false,
  isParentalConsentRequired: false,
  hasParentalConsent: false
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action) => {
      return { ...state, ...action.payload };
    },
    updateUserField: (state, action) => {
      const { field, value } = action.payload;
      state[field] = value;
    },
    clearUserData: () => {
      return initialState;
    },
    setParentalConsent: (state, action) => {
      state.hasParentalConsent = action.payload;
    },
    verifyUser: (state) => {
      state.isVerified = true;
    }
  }
});

export const {
  setUserData,
  updateUserField,
  clearUserData,
  setParentalConsent,
  verifyUser
} = userSlice.actions;

export default userSlice.reducer;
