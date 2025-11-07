import React from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Collapse
} from '@mui/material';
import {
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
  Sync as SyncIcon,
  Close as CloseIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';
import { useOnlineStatus, useOfflineSync } from '../hooks/useOffline';

/**
 * OfflineIndicator - Component to show online/offline status
 */
const OfflineIndicator = ({ syncFunction }) => {
  const { isOnline, isOffline, wasOffline, offlineDuration } = useOnlineStatus();
  const { isSyncing, syncQueue, queueLength, syncData } = useOfflineSync(syncFunction);
  const [showReconnect, setShowReconnect] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (wasOffline && isOnline) {
      setShowReconnect(true);
      setDismissed(false);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setShowReconnect(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [wasOffline, isOnline]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowReconnect(false);
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <>
      {/* Offline Banner */}
      <Collapse in={isOffline && !dismissed}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            py: 1,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            boxShadow: 2
          }}
        >
          <CloudOffIcon />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              You're offline
            </Typography>
            <Typography variant="caption">
              Some features may be limited. We'll sync your changes when you're back online.
            </Typography>
            {queueLength > 0 && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {queueLength} change{queueLength !== 1 ? 's' : ''} waiting to sync
              </Typography>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{ color: 'inherit' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Collapse>

      {/* Reconnection Notification */}
      <Snackbar
        open={showReconnect && !dismissed}
        autoHideDuration={5000}
        onClose={() => setShowReconnect(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={handleDismiss}
          severity="success"
          variant="filled"
          icon={<WifiIcon />}
          sx={{ width: '100%', alignItems: 'center' }}
        >
          <Box>
            <Typography variant="body2" fontWeight={600}>
              Back Online
            </Typography>
            <Typography variant="caption">
              You were offline for {formatDuration(offlineDuration)}
            </Typography>
            {isSyncing && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  Syncing {queueLength} change{queueLength !== 1 ? 's' : ''}...
                </Typography>
                <LinearProgress size={20} />
              </Box>
            )}
          </Box>
        </Alert>
      </Snackbar>

      {/* Syncing Indicator */}
      <Snackbar
        open={isSyncing}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          icon={<SyncIcon className="rotate" />}
          sx={{
            width: '100%',
            '& .rotate': {
              animation: 'rotate 2s linear infinite',
              '@keyframes rotate': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }
          }}
        >
          <Box>
            <Typography variant="body2">
              Syncing your changes...
            </Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator;
