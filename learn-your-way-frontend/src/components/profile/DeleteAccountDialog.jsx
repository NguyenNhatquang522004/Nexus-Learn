import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  Warning as WarningIcon,
  DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import {
  deleteAccount,
  setShowDeleteAccountDialog,
  selectLoading,
} from '../../store/slices/profileSlice';

const DeleteAccountDialog = () => {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.profile.showDeleteAccountDialog);
  const loading = useSelector(selectLoading).delete;
  const userId = useSelector((state) => state.auth?.user?.id);

  // Form state
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Countdown timer when confirmed
  useEffect(() => {
    if (confirmed && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [confirmed, countdown]);

  // Reset countdown when confirmed changes
  useEffect(() => {
    if (confirmed) {
      setCountdown(3);
    }
  }, [confirmed]);

  // Handle delete account
  const handleDeleteAccount = async () => {
    try {
      await dispatch(
        deleteAccount({
          userId,
          password,
          reason: reason === 'other' ? feedback : reason,
        })
      ).unwrap();

      // Redirect to logout or home page after successful deletion
      // This will be handled by the success message in the slice
      handleClose();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  // Handle close
  const handleClose = () => {
    dispatch(setShowDeleteAccountDialog(false));
    // Reset form
    setPassword('');
    setReason('');
    setFeedback('');
    setConfirmed(false);
    setCountdown(3);
  };

  // Check if form is valid
  const isValid = password.length > 0 && confirmed && countdown === 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: 'error.main',
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon />
          Delete Account
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Warning Alert */}
          <Alert severity="error">
            <AlertTitle>This action cannot be undone!</AlertTitle>
            Deleting your account will:
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
              <li>Permanently delete all your data</li>
              <li>Remove you from all study rooms</li>
              <li>Delete all your progress and achievements</li>
              <li>Cancel any active subscriptions</li>
              <li>Remove all your uploaded content</li>
            </ul>
          </Alert>

          {/* Password Confirmation */}
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Enter your password to confirm"
            fullWidth
            required
            error={password.length > 0 && password.length < 6}
          />

          {/* Reason for Leaving */}
          <Box>
            <FormControl fullWidth>
              <InputLabel>Why are you leaving? (Optional)</InputLabel>
              <Select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                label="Why are you leaving? (Optional)"
              >
                <MenuItem value="">Prefer not to say</MenuItem>
                <MenuItem value="not_useful">Not useful for me</MenuItem>
                <MenuItem value="too_difficult">Content too difficult</MenuItem>
                <MenuItem value="too_easy">Content too easy</MenuItem>
                <MenuItem value="privacy_concerns">Privacy concerns</MenuItem>
                <MenuItem value="switching_platform">
                  Switching to another platform
                </MenuItem>
                <MenuItem value="cost">Cost concerns</MenuItem>
                <MenuItem value="technical_issues">Technical issues</MenuItem>
                <MenuItem value="other">Other reason</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Additional Feedback */}
          {reason === 'other' && (
            <TextField
              label="Please tell us more (optional)"
              multiline
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your feedback helps us improve..."
              fullWidth
            />
          )}

          {/* Confirmation Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                color="error"
              />
            }
            label={
              <Typography variant="body2">
                I understand this action is permanent and cannot be undone
              </Typography>
            }
          />

          {/* Countdown Warning */}
          {confirmed && countdown > 0 && (
            <Alert severity="warning">
              Please wait {countdown} second{countdown !== 1 ? 's' : ''} before
              confirming...
            </Alert>
          )}

          {/* Grace Period Info */}
          <Alert severity="info">
            <AlertTitle>30-Day Grace Period</AlertTitle>
            Your account will be scheduled for deletion. You have 30 days to
            cancel this request by logging in again. After 30 days, your account
            and all data will be permanently deleted.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteAccount}
          disabled={!isValid || loading}
          startIcon={<DeleteForeverIcon />}
        >
          {loading
            ? 'Deleting...'
            : countdown > 0 && confirmed
            ? `Wait ${countdown}s`
            : 'Delete My Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAccountDialog;
