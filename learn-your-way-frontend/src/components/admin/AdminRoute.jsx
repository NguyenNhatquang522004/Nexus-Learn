import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';

/**
 * AdminRoute Component
 * 
 * Protects admin dashboard routes with role-based access control.
 * Only users with ADMIN or EDUCATOR roles can access protected routes.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {Array<string>} props.allowedRoles - Optional array of allowed roles (defaults to ['ADMIN', 'EDUCATOR'])
 */
const AdminRoute = ({ children, allowedRoles = ['ADMIN', 'EDUCATOR'], ...rest }) => {
  const location = useLocation();
  
  // Get authentication state from Redux
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);
  
  // Get user role (assuming it's stored in user object)
  const userRole = user?.role?.toUpperCase();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          Verifying access permissions...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const hasRequiredRole = userRole && allowedRoles.includes(userRole);

  // Redirect to unauthorized page if user doesn't have required role
  if (!hasRequiredRole) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          gap: 3,
          p: 3
        }}
      >
        <BlockIcon sx={{ fontSize: 100, color: 'error.main' }} />
        <Typography variant="h4" fontWeight={700} textAlign="center">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={600}>
          You do not have permission to access this page. Admin Dashboard is restricted to educators and administrators only.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your current role: <strong>{userRole || 'Unknown'}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Required roles: <strong>{allowedRoles.join(', ')}</strong>
        </Typography>
      </Box>
    );
  }

  // User is authenticated and has required role - render protected content
  return <>{children}</>;
};

export default AdminRoute;
