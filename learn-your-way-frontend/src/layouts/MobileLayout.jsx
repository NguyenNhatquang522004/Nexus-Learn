import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  useMediaQuery,
  useTheme,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  EmojiEvents as AchievementsIcon,
  Groups as StudyRoomIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';

/**
 * MobileLayout Component
 * Provides mobile-first responsive layout with top bar, sidebar, and bottom navigation
 * 
 * Features:
 * - Responsive breakpoints (mobile, tablet, desktop)
 * - Collapsible sidebar
 * - Bottom navigation for mobile
 * - Top bar with menu and notifications
 * - Touch-optimized interactions
 */
const MobileLayout = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // State
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [bottomNavValue, setBottomNavValue] = useState(0);

  // Redux state
  const user = useSelector((state) => state.auth?.user);
  const notificationCount = useSelector(
    (state) => state.notifications?.unreadCount || 0
  );

  // Update bottom navigation based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') {
      setBottomNavValue(0);
    } else if (path.startsWith('/content')) {
      setBottomNavValue(1);
    } else if (path.startsWith('/quiz')) {
      setBottomNavValue(2);
    } else if (path.startsWith('/profile') || path.startsWith('/settings')) {
      setBottomNavValue(3);
    }
  }, [location.pathname]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle bottom navigation change
  const handleBottomNavChange = (event, newValue) => {
    setBottomNavValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/dashboard');
        break;
      case 1:
        navigate('/content');
        break;
      case 2:
        navigate('/quiz');
        break;
      case 3:
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  // Navigation items for sidebar
  const navigationItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { label: 'Learn', icon: <SchoolIcon />, path: '/content' },
    { label: 'Quizzes', icon: <QuizIcon />, path: '/quiz' },
    { label: 'Study Rooms', icon: <StudyRoomIcon />, path: '/study-rooms' },
    { label: 'Achievements', icon: <AchievementsIcon />, path: '/achievements' },
    { label: 'Upload Content', icon: <UploadIcon />, path: '/upload' },
    { label: 'Profile', icon: <PersonIcon />, path: '/profile' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // Handle logout
  const handleLogout = () => {
    // Dispatch logout action
    dispatch({ type: 'auth/logout' });
    navigate('/login');
  };

  // Drawer content
  const drawerContent = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* User Profile Section */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            src={user?.avatar}
            sx={{ width: 56, height: 56, border: '2px solid white' }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {user?.name || 'Guest User'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {user?.email || 'guest@example.com'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List sx={{ flex: 1, py: 1 }}>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            sx={{
              py: 1.5,
              mx: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: 'primary.lighter',
                color: 'primary.main',
                '& .MuiListItemIcon-root': {
                  color: 'primary.main',
                },
              },
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {/* Logout Button */}
      <ListItemButton
        onClick={handleLogout}
        sx={{
          py: 2,
          color: 'error.main',
          '&:hover': {
            bgcolor: 'error.lighter',
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItemButton>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          {/* Menu Button */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleSidebar}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo/Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/dashboard')}
            >
              Learn Your Way
            </Typography>
          </Box>

          {/* Notification Button */}
          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={toggleSidebar}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            mt: isMobile ? 0 : '64px', // Account for AppBar height
            height: isMobile ? '100%' : 'calc(100% - 64px)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px', // AppBar height
          mb: isMobile ? '56px' : 0, // Bottom nav height
          ml: !isMobile && sidebarOpen ? '280px' : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation (Mobile Only) */}
      {isMobile && (
        <BottomNavigation
          value={bottomNavValue}
          onChange={handleBottomNavChange}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
            height: 56,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              px: 0,
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
          }}
        >
          <BottomNavigationAction
            label="Home"
            icon={<HomeIcon />}
            sx={{ fontSize: '0.75rem' }}
          />
          <BottomNavigationAction
            label="Learn"
            icon={<SchoolIcon />}
            sx={{ fontSize: '0.75rem' }}
          />
          <BottomNavigationAction
            label="Quiz"
            icon={<QuizIcon />}
            sx={{ fontSize: '0.75rem' }}
          />
          <BottomNavigationAction
            label="Profile"
            icon={<PersonIcon />}
            sx={{ fontSize: '0.75rem' }}
          />
        </BottomNavigation>
      )}
    </Box>
  );
};

export default MobileLayout;
