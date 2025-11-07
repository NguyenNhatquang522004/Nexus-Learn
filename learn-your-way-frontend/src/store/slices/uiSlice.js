import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  modalOpen: false,
  modalContent: null,
  toasts: [],
  loading: {
    global: false,
    auth: false,
    profile: false,
    content: false
  },
  errors: [],
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action) => {
      state.modalOpen = true;
      state.modalContent = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalContent = null;
    },
    addToast: (state, action) => {
      const toast = {
        id: Date.now() + Math.random(),
        message: action.payload.message,
        type: action.payload.type || 'info',
        duration: action.payload.duration || 3000,
        timestamp: Date.now()
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    setAuthLoading: (state, action) => {
      state.loading.auth = action.payload;
    },
    setProfileLoading: (state, action) => {
      state.loading.profile = action.payload;
    },
    setContentLoading: (state, action) => {
      state.loading.content = action.payload;
    },
    addError: (state, action) => {
      const error = {
        id: Date.now() + Math.random(),
        message: action.payload.message,
        code: action.payload.code,
        timestamp: Date.now()
      };
      state.errors.push(error);
    },
    removeError: (state, action) => {
      state.errors = state.errors.filter((error) => error.id !== action.payload);
    },
    clearErrors: (state) => {
      state.errors = [];
    },
    openConfirmDialog: (state, action) => {
      state.confirmDialog = {
        isOpen: true,
        title: action.payload.title,
        message: action.payload.message,
        onConfirm: action.payload.onConfirm,
        onCancel: action.payload.onCancel
      };
    },
    closeConfirmDialog: (state) => {
      state.confirmDialog = {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null
      };
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  addToast,
  removeToast,
  clearToasts,
  setGlobalLoading,
  setAuthLoading,
  setProfileLoading,
  setContentLoading,
  addError,
  removeError,
  clearErrors,
  openConfirmDialog,
  closeConfirmDialog
} = uiSlice.actions;

export default uiSlice.reducer;
