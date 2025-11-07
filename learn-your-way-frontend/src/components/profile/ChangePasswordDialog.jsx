import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  Typography,
  LinearProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  changePassword,
  setShowChangePasswordDialog,
  selectLoading,
  selectError,
} from '../../store/slices/profileSlice';

const ChangePasswordDialog = () => {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.profile.showChangePasswordDialog);
  const loading = useSelector(selectLoading).password;
  const error = useSelector(selectError);

  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password requirements
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Password strength (0-100)
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Form validation
  const [errors, setErrors] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [isValid, setIsValid] = useState(false);

  // Validate password requirements
  useEffect(() => {
    if (newPassword) {
      const reqs = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
      };
      setRequirements(reqs);

      // Calculate strength
      const metCount = Object.values(reqs).filter(Boolean).length;
      setPasswordStrength(metCount * 20);

      // Check if all requirements met
      const allMet = Object.values(reqs).every(Boolean);
      const passwordsMatch = newPassword === confirmPassword;
      setIsValid(allMet && passwordsMatch && currentPassword.length > 0);

      // Set errors
      if (newPassword.length > 0 && !allMet) {
        setErrors((prev) => ({
          ...prev,
          new: 'Password does not meet all requirements',
        }));
      } else {
        setErrors((prev) => ({ ...prev, new: '' }));
      }
    } else {
      setRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
      setPasswordStrength(0);
    }
  }, [newPassword, confirmPassword, currentPassword]);

  // Validate confirm password
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirm: 'Passwords do not match',
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirm: '' }));
    }
  }, [confirmPassword, newPassword]);

  // Get strength color
  const getStrengthColor = (strength) => {
    if (strength < 40) return 'error';
    if (strength < 60) return 'warning';
    if (strength < 80) return 'info';
    return 'success';
  };

  // Get strength label
  const getStrengthLabel = (strength) => {
    if (strength < 40) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  // Handle change password
  const handleChangePassword = async () => {
    try {
      await dispatch(
        changePassword({
          currentPassword,
          newPassword,
        })
      ).unwrap();
      handleClose();
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  // Handle close
  const handleClose = () => {
    dispatch(setShowChangePasswordDialog(false));
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setErrors({ current: '', new: '', confirm: '' });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Current Password */}
          <TextField
            label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            error={Boolean(errors.current)}
            helperText={errors.current}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowCurrent(!showCurrent)}
                    edge="end"
                  >
                    {showCurrent ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* New Password */}
          <TextField
            label="New Password"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            error={Boolean(errors.new)}
            helperText={errors.new}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNew(!showNew)} edge="end">
                    {showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Indicator */}
          {newPassword && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={passwordStrength}
                color={getStrengthColor(passwordStrength)}
                sx={{ height: 8, borderRadius: 1, mb: 0.5 }}
              />
              <Typography variant="caption" color="text.secondary">
                Password strength: {getStrengthLabel(passwordStrength)}
              </Typography>
            </Box>
          )}

          {/* Password Requirements */}
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Password must contain:
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                {requirements.length ? (
                  <CheckIcon color="success" fontSize="small" />
                ) : (
                  <CloseIcon color="error" fontSize="small" />
                )}
                <Typography variant="caption">At least 8 characters</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {requirements.uppercase ? (
                  <CheckIcon color="success" fontSize="small" />
                ) : (
                  <CloseIcon color="error" fontSize="small" />
                )}
                <Typography variant="caption">One uppercase letter</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {requirements.lowercase ? (
                  <CheckIcon color="success" fontSize="small" />
                ) : (
                  <CloseIcon color="error" fontSize="small" />
                )}
                <Typography variant="caption">One lowercase letter</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {requirements.number ? (
                  <CheckIcon color="success" fontSize="small" />
                ) : (
                  <CloseIcon color="error" fontSize="small" />
                )}
                <Typography variant="caption">One number</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {requirements.special ? (
                  <CheckIcon color="success" fontSize="small" />
                ) : (
                  <CloseIcon color="error" fontSize="small" />
                )}
                <Typography variant="caption">
                  One special character (!@#$%^&*...)
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Confirm Password */}
          <TextField
            label="Confirm New Password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={Boolean(errors.confirm)}
            helperText={errors.confirm}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm(!showConfirm)}
                    edge="end"
                  >
                    {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleChangePassword}
          disabled={!isValid || loading}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordDialog;
