import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  IconButton,
  Slide
} from '@mui/material';
import {
  SystemUpdateAlt as UpdateIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { skipWaiting, clearUpdateNotification, isUpdateAvailable } from '../utils/pwaRegistration';

/**
 * PWA Update Banner - Notifies user when new version is available
 */
const PWAUpdateBanner = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Check if update was previously detected
    if (isUpdateAvailable()) {
      setShowUpdate(true);
    }

    // Listen for new updates
    const handleUpdate = (event) => {
      setRegistration(event.detail.registration);
      setShowUpdate(true);
    };

    window.addEventListener('swUpdate', handleUpdate);

    return () => {
      window.removeEventListener('swUpdate', handleUpdate);
    };
  }, []);

  const handleUpdate = () => {
    if (registration) {
      skipWaiting(registration);
      clearUpdateNotification();
      
      // Reload page to activate new service worker
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Don't clear notification so it persists across sessions
  };

  const handleClose = () => {
    setShowUpdate(false);
    clearUpdateNotification();
  };

  return (
    <Snackbar
      open={showUpdate}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={Slide}
      sx={{ bottom: { xs: 80, md: 24 } }}
    >
      <Alert
        severity="info"
        variant="filled"
        icon={<UpdateIcon />}
        sx={{
          width: '100%',
          maxWidth: 500,
          alignItems: 'center',
          '& .MuiAlert-message': {
            flex: 1
          }
        }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={handleUpdate}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,1)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Update Now
            </Button>
            <IconButton
              size="small"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Box>
          <Typography variant="body2" fontWeight={600}>
            New Version Available
          </Typography>
          <Typography variant="caption">
            A new version of the app is ready. Update now for the latest features and improvements.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

/**
 * Install Prompt Banner - Prompts user to install PWA
 */
export const InstallPromptBanner = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('install-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA installed successfully');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted install prompt');
    } else {
      console.log('User dismissed install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (dismissed) return null;

  return (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      TransitionComponent={Slide}
      sx={{ bottom: { xs: 80, md: 24 } }}
    >
      <Alert
        severity="success"
        variant="filled"
        sx={{
          width: '100%',
          maxWidth: 500,
          alignItems: 'center',
          '& .MuiAlert-message': {
            flex: 1
          }
        }}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              onClick={handleInstall}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,1)',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Install
            </Button>
            <IconButton
              size="small"
              color="inherit"
              onClick={handleDismiss}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Install Learn Your Way
          </Typography>
          <Typography variant="caption">
            Install the app for faster access, offline support, and a better experience.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default PWAUpdateBanner;
