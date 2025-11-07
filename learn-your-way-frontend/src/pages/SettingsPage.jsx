import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Divider,
  Alert,
  AlertTitle,
  Snackbar,
  CircularProgress,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Lock as LockIcon,
  Palette as PaletteIcon,
  AccountCircle as AccountCircleIcon,
  Security as SecurityIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  SettingsBrightness as SettingsBrightnessIcon,
  VerifiedUser as VerifiedUserIcon,
  FileDownload as FileDownloadIcon,
  Policy as PolicyIcon,
  Gavel as GavelIcon,
  DeleteForever as DeleteForeverIcon,
  AddLink as AddLinkIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { debounce } from 'lodash';
import ChangePasswordDialog from '../../components/profile/ChangePasswordDialog';
import ExportDataDialog from '../../components/profile/ExportDataDialog';
import DeleteAccountDialog from '../../components/profile/DeleteAccountDialog';
import {
  fetchProfile,
  updateSettings,
  updateNotificationSetting,
  updatePrivacySetting,
  updateAppearanceSetting,
  updateAccountSetting,
  setActiveSection,
  setShowChangePasswordDialog,
  setShowExportDataDialog,
  setShowDeleteAccountDialog,
  setShowAgeVerificationDialog,
  setShowConsentDialog,
  clearMessages,
  selectProfile,
  selectSettings,
  selectGDPR,
  selectLoading,
  selectError,
  selectSuccessMessage,
} from '../../store/slices/profileSlice';

// Settings sections configuration
const SETTINGS_SECTIONS = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <NotificationsIcon />,
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    icon: <LockIcon />,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <PaletteIcon />,
  },
  {
    id: 'account',
    label: 'Account',
    icon: <AccountCircleIcon />,
  },
  {
    id: 'gdpr',
    label: 'Data & Privacy',
    icon: <SecurityIcon />,
  },
];

// Setting Section Component
const SettingSection = ({ title, icon, children }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Box display="flex" alignItems="center" gap={1} mb={3}>
      {icon}
      <Typography variant="h5" fontWeight="bold">
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

const SettingsPage = () => {
  const dispatch = useDispatch();

  // Redux state
  const profile = useSelector(selectProfile);
  const settings = useSelector(selectSettings);
  const gdpr = useSelector(selectGDPR);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const successMessage = useSelector(selectSuccessMessage);
  const activeSection = useSelector((state) => state.profile.activeSection);

  const userId = useSelector((state) => state.auth?.user?.id);

  // Local state for settings changes tracking
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (userId) {
      dispatch(fetchProfile(userId));
    }
  }, [dispatch, userId]);

  // Debounced save function
  const debouncedSave = React.useCallback(
    debounce((userId, settings) => {
      dispatch(updateSettings({ userId, settings }));
      setSettingsChanged(false);
    }, 1500),
    [dispatch]
  );

  // Auto-save when settings change
  useEffect(() => {
    if (settingsChanged && userId) {
      debouncedSave(userId, settings);
    }
  }, [settings, settingsChanged, userId, debouncedSave]);

  // Handle notification toggle
  const handleToggle = (category, setting, value) => {
    if (category === 'notifications') {
      dispatch(updateNotificationSetting({ setting, value }));
    } else if (category === 'privacy') {
      dispatch(updatePrivacySetting({ setting, value }));
    } else if (category === 'appearance') {
      dispatch(updateAppearanceSetting({ setting, value }));
    } else if (category === 'account') {
      dispatch(updateAccountSetting({ setting, value }));
    }
    setSettingsChanged(true);
  };

  // Handle radio change
  const handleRadio = (category, setting, value) => {
    if (category === 'privacy') {
      dispatch(updatePrivacySetting({ setting, value }));
    }
    setSettingsChanged(true);
  };

  // Handle appearance change
  const handleAppearance = (setting, value) => {
    dispatch(updateAppearanceSetting({ setting, value }));
    setSettingsChanged(true);
  };

  // Handle account setting
  const handleAccount = (setting, value) => {
    dispatch(updateAccountSetting({ setting, value }));
    setSettingsChanged(true);
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    dispatch(clearMessages());
  };

  // Get provider icon
  const getProviderIcon = (provider) => {
    // Placeholder - would use actual provider icons
    return <AccountCircleIcon />;
  };

  // Handle disconnect account
  const handleDisconnect = (provider) => {
    // Implementation for disconnecting accounts
    console.log('Disconnect:', provider);
  };

  // Handle connect account
  const handleConnectAccount = () => {
    // Implementation for connecting new accounts
    console.log('Connect new account');
  };

  if (loading.profile && !profile.id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Manage your account settings and preferences
      </Typography>

      <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Sidebar Navigation */}
        <Paper
          elevation={2}
          sx={{
            width: { xs: '100%', md: 250 },
            position: { md: 'sticky' },
            top: 80,
            height: 'fit-content',
          }}
        >
          <List>
            {SETTINGS_SECTIONS.map((section) => (
              <ListItemButton
                key={section.id}
                selected={activeSection === section.id}
                onClick={() => dispatch(setActiveSection(section.id))}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.lighter',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <ListItemIcon sx={{ color: activeSection === section.id ? 'primary.main' : 'inherit' }}>
                  {section.icon}
                </ListItemIcon>
                <ListItemText primary={section.label} />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        {/* Main Content */}
        <Box flex={1}>
          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <SettingSection title="Notifications" icon={<NotificationsIcon />}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose what notifications you want to receive
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.email}
                      onChange={(e) => handleToggle('notifications', 'email', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Email notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive important updates via email
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.reviewReminders}
                      onChange={(e) => handleToggle('notifications', 'reviewReminders', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Review reminders</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Get reminded to review concepts you've learned
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.achievementAlerts}
                      onChange={(e) => handleToggle('notifications', 'achievementAlerts', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Achievement alerts</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Be notified when you unlock new achievements
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.studyRoomInvites}
                      onChange={(e) => handleToggle('notifications', 'studyRoomInvites', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Study room invites</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Get notified when someone invites you to a study room
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.weeklyProgress}
                      onChange={(e) => handleToggle('notifications', 'weeklyProgress', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Weekly progress reports</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive a summary of your weekly learning progress
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.newContent}
                      onChange={(e) => handleToggle('notifications', 'newContent', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">New content notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Be alerted when new learning content is available
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </SettingSection>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <SettingSection title="Privacy & Security" icon={<LockIcon />}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Control your privacy and data sharing preferences
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom fontWeight={600} sx={{ mt: 2 }}>
                Profile Visibility
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.showProfile}
                      onChange={(e) => handleToggle('privacy', 'showProfile', e.target.checked)}
                    />
                  }
                  label="Show profile to peers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.showOnLeaderboard}
                      onChange={(e) => handleToggle('privacy', 'showOnLeaderboard', e.target.checked)}
                    />
                  }
                  label="Show on leaderboard"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.allowStudyRoomInvites}
                      onChange={(e) => handleToggle('privacy', 'allowStudyRoomInvites', e.target.checked)}
                    />
                  }
                  label="Allow study room invites"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.showActivity}
                      onChange={(e) => handleToggle('privacy', 'showActivity', e.target.checked)}
                    />
                  }
                  label="Show recent activity"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.privacy.publicProfile}
                      onChange={(e) => handleToggle('privacy', 'publicProfile', e.target.checked)}
                    />
                  }
                  label="Public profile (visible to everyone)"
                />
              </FormGroup>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Data Sharing
              </Typography>
              <RadioGroup
                value={settings.privacy.dataSharing}
                onChange={(e) => handleRadio('privacy', 'dataSharing', e.target.value)}
              >
                <FormControlLabel
                  value="none"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">None</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Don't share any data for research or improvement
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="anonymous"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">Anonymous</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Share anonymized data for research and platform improvement
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="full"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2">Full</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Help improve the platform with full data sharing
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Age Verification (COPPA Compliance)
              </Typography>
              {profile.ageVerified ? (
                <Alert severity="success">
                  Age verified on{' '}
                  {profile.updatedAt
                    ? new Date(profile.updatedAt).toLocaleDateString()
                    : 'N/A'}
                </Alert>
              ) : (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Age verification is required for full platform access
                  </Alert>
                  <Button
                    variant="outlined"
                    startIcon={<VerifiedUserIcon />}
                    onClick={() => dispatch(setShowAgeVerificationDialog(true))}
                  >
                    Verify Age
                  </Button>
                </Box>
              )}
            </SettingSection>
          )}

          {/* Appearance Section */}
          {activeSection === 'appearance' && (
            <SettingSection title="Appearance" icon={<PaletteIcon />}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Customize how the platform looks to you
              </Typography>

              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Theme
              </Typography>
              <ToggleButtonGroup
                value={settings.appearance.theme}
                exclusive
                onChange={(e, value) => value && handleAppearance('theme', value)}
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value="light">
                  <LightModeIcon sx={{ mr: 1 }} />
                  Light
                </ToggleButton>
                <ToggleButton value="dark">
                  <DarkModeIcon sx={{ mr: 1 }} />
                  Dark
                </ToggleButton>
                <ToggleButton value="auto">
                  <SettingsBrightnessIcon sx={{ mr: 1 }} />
                  Auto
                </ToggleButton>
              </ToggleButtonGroup>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Language
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <Select
                  value={settings.appearance.language}
                  onChange={(e) => handleAppearance('language', e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                  <MenuItem value="ja">日本語</MenuItem>
                  <MenuItem value="vi">Tiếng Việt</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Font Size
              </Typography>
              <ToggleButtonGroup
                value={settings.appearance.fontSize}
                exclusive
                onChange={(e, value) => value && handleAppearance('fontSize', value)}
                fullWidth
                sx={{ mb: 3 }}
              >
                <ToggleButton value="small">Small</ToggleButton>
                <ToggleButton value="medium">Medium</ToggleButton>
                <ToggleButton value="large">Large</ToggleButton>
              </ToggleButtonGroup>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Accessibility
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.reducedMotion}
                      onChange={(e) => handleAppearance('reducedMotion', e.target.checked)}
                    />
                  }
                  label="Reduce motion (accessibility)"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.appearance.highContrast}
                      onChange={(e) => handleAppearance('highContrast', e.target.checked)}
                    />
                  }
                  label="High contrast mode"
                />
              </FormGroup>
            </SettingSection>
          )}

          {/* Account Section */}
          {activeSection === 'account' && (
            <SettingSection title="Account" icon={<AccountCircleIcon />}>
              <Typography variant="body2" color="text.secondary" paragraph>
                Manage your account security and connected services
              </Typography>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Change Password"
                    secondary="Update your password regularly for security"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      onClick={() => dispatch(setShowChangePasswordDialog(true))}
                    >
                      Change
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary={
                      settings.account.twoFactorEnabled ? 'Enabled' : 'Disabled'
                    }
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.account.twoFactorEnabled}
                      onChange={(e) =>
                        handleAccount('twoFactorEnabled', e.target.checked)
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemText
                    primary="Session Timeout"
                    secondary="Auto logout after inactivity"
                  />
                  <ListItemSecondaryAction>
                    <Select
                      value={settings.account.sessionTimeout}
                      onChange={(e) => handleAccount('sessionTimeout', e.target.value)}
                      size="small"
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value={15}>15 minutes</MenuItem>
                      <MenuItem value={30}>30 minutes</MenuItem>
                      <MenuItem value={60}>1 hour</MenuItem>
                      <MenuItem value={120}>2 hours</MenuItem>
                      <MenuItem value={240}>4 hours</MenuItem>
                    </Select>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Connected Accounts
              </Typography>
              {settings.account.connectedAccounts.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No connected accounts
                </Alert>
              ) : (
                <List>
                  {settings.account.connectedAccounts.map((account) => (
                    <React.Fragment key={account.provider}>
                      <ListItem>
                        <ListItemIcon>{getProviderIcon(account.provider)}</ListItemIcon>
                        <ListItemText
                          primary={account.provider}
                          secondary={`Connected on ${new Date(
                            account.connectedAt
                          ).toLocaleDateString()}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => handleDisconnect(account.provider)}>
                            <LinkOffIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
              <Button
                variant="outlined"
                startIcon={<AddLinkIcon />}
                onClick={handleConnectAccount}
                sx={{ mt: 2 }}
              >
                Connect Account
              </Button>
            </SettingSection>
          )}

          {/* GDPR Section */}
          {activeSection === 'gdpr' && (
            <SettingSection title="Data & Privacy" icon={<SecurityIcon />}>
              <Alert severity="info" sx={{ mb: 3 }}>
                We respect your privacy and comply with GDPR, COPPA, and other data
                protection regulations.
              </Alert>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <FileDownloadIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Export Your Data"
                    secondary={
                      gdpr.lastExportDate
                        ? `Last exported: ${new Date(
                            gdpr.lastExportDate
                          ).toLocaleDateString()}`
                        : 'Download all your data in JSON or PDF format'
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="outlined"
                      onClick={() => dispatch(setShowExportDataDialog(true))}
                      disabled={gdpr.exportInProgress}
                    >
                      {gdpr.exportInProgress ? 'Exporting...' : 'Export'}
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <PolicyIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Privacy Policy"
                    secondary="View our privacy policy and terms of service"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="text"
                      onClick={() => window.open('/privacy-policy', '_blank')}
                    >
                      View
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>

                <Divider />

                <ListItem>
                  <ListItemIcon>
                    <GavelIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Manage Consent"
                    secondary="Review and update your data processing consent"
                  />
                  <ListItemSecondaryAction>
                    <Button
                      variant="text"
                      onClick={() => dispatch(setShowConsentDialog(true))}
                    >
                      Manage
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              </List>

              <Divider sx={{ my: 3 }} />

              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Delete Account</AlertTitle>
                This action is permanent and cannot be undone. All your data will be
                permanently deleted after a 30-day grace period.
              </Alert>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={() => dispatch(setShowDeleteAccountDialog(true))}
              >
                Delete My Account
              </Button>
            </SettingSection>
          )}
        </Box>
      </Box>

      {/* Dialogs */}
      <ChangePasswordDialog />
      <ExportDataDialog />
      <DeleteAccountDialog />

      {/* Success/Error Snackbar */}
      <Snackbar
        open={Boolean(successMessage || error)}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={successMessage ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {successMessage || error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SettingsPage;
