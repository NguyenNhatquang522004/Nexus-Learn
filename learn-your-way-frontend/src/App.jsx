import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { verifyToken } from './store/slices/authSlice';
import ToastContainer from './components/shared/Toast';
import LoadingSpinner from './components/shared/LoadingSpinner';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import Upload from './pages/Upload';
import StudyRoom from './pages/StudyRoom';

import LoginForm from './components/auth/LoginForm';
import SignUpForm from './components/auth/SignUpForm';

import { ROUTES } from './utils/constants';
import { authService } from './services/auth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  
  return children;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(verifyToken());
    }
  }, [token, isAuthenticated, dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      authService.setupTokenRefreshTimer();
    }
  }, [isAuthenticated]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <div className="min-h-screen bg-neutral-50">
          <ToastContainer />
          <Toaster position="top-right" />
          
          <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />
            
            <Route
              path={ROUTES.LOGIN}
              element={
                <PublicRoute>
                  <div className="min-h-screen flex items-center justify-center p-4">
                    <LoginForm />
                  </div>
                </PublicRoute>
              }
            />
            
            <Route
              path={ROUTES.SIGNUP}
              element={
                <PublicRoute>
                  <div className="min-h-screen flex items-center justify-center p-4">
                    <SignUpForm />
                  </div>
                </PublicRoute>
              }
            />
            
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.LEARN}
              element={
                <ProtectedRoute>
                  <Learn />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.QUIZ}
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.PROFILE}
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.UPLOAD}
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            
            <Route
              path={ROUTES.STUDY_ROOM}
              element={
                <ProtectedRoute>
                  <StudyRoom />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
