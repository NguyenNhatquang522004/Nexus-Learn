# Profile & Settings UI - Complete Implementation Guide

## Overview

Complete implementation of User Profile & Settings system with profile management, statistics, achievements, comprehensive settings (notifications, privacy, appearance, account), and GDPR compliance features including data export.

## Architecture

### Workflow Steps
1. **View Profile** → Display user info, stats, achievements, activity
2. **Edit Info** → Update name, grade, school, bio, avatar
3. **Preferences** → Learning style, difficulty, language, interests
4. **Privacy** → Profile visibility, leaderboard, data sharing, COPPA compliance
5. **Data Export** → GDPR-compliant data download (JSON/PDF)
6. **Save** → Persist all changes via API calls

### Technology Stack
- **State Management**: Redux Toolkit with enhanced profileSlice
- **UI Framework**: Material-UI v5
- **File Upload**: FormData for avatar
- **Date Handling**: date-fns
- **Backend**: Security Agent (8017), Analytics Agent (8011), Personalization Agent (8002)

## API Services Enhancement - COMPLETED

### securityService (NEW)
**Location**: `src/services/api.js`

**Methods Added**:
```javascript
securityService = {
  // Profile management
  getProfile(userId): GET /api/profile/:userId
    -> { id, name, email, avatar, grade, school, bio, dateOfBirth, ageVerified, parentalConsent, createdAt, updatedAt }
  
  updateProfile(userId, profileData): PUT /api/profile/:userId
    -> Updated profile object
  
  uploadAvatar(userId, formData): POST /api/profile/:userId/avatar
    -> { avatarUrl }
  
  // Settings
  updateSettings(userId, settings): PUT /api/settings/:userId
    -> Updated settings object
  
  // Password
  changePassword(passwordData): POST /api/change-password
    -> { success: true }
  
  // Privacy
  getPrivacySettings(userId): GET /api/privacy/:userId
    -> Privacy settings object
  
  updatePrivacySettings(userId, privacySettings): PUT /api/privacy/:userId
    -> Updated privacy settings
  
  // GDPR
  exportUserData(userId, options): POST /api/export-data
    -> { downloadUrl, expiresAt }
  
  // Account deletion
  deleteAccount(userId, data): DELETE /api/account/:userId
    -> { success: true, deletionScheduled }
  
  // Age verification (COPPA)
  verifyAge(userId, verificationData): POST /api/verify-age/:userId
    -> { ageVerified, parentalConsent }
}
```

### analyticsService Enhancement
**Methods Added**:
```javascript
analyticsService = {
  ...existing methods,
  
  // Profile-specific analytics
  getUserMetrics(userId): GET /api/metrics/:userId
    -> { totalStudyTime, conceptsMastered, quizzesCompleted, currentStreak, longestStreak, totalPoints, level, averageQuizScore, studyRoomsJoined, contentCreated, lastActivity }
  
  getUserAchievements(userId): GET /api/achievements/:userId
    -> { achievements: [...], unlockedCount, totalAchievements }
  
  getUserActivity(userId, limit): GET /api/activity/:userId?limit=
    -> { activities: [...], hasMore }
}
```

### personalizationService Enhancement
**Method Added**:
```javascript
personalizationService = {
  ...existing methods,
  
  updatePreferences(userId, preferences): PUT /api/personalization/preferences/:userId
    -> Updated preferences object
}
```

## Redux Store - profileSlice Enhancement

### State Structure (NEW)
**Location**: `src/store/slices/profileSlice.js` (needs replacement)

```javascript
{
  // Profile data
  profile: {
    id, name, email, avatar, grade, school, bio,
    dateOfBirth, ageVerified, parentalConsent,
    createdAt, updatedAt
  },
  
  // Statistics
  stats: {
    totalStudyTime, conceptsMastered, quizzesCompleted,
    currentStreak, longestStreak, totalPoints, level,
    averageQuizScore, studyRoomsJoined, contentCreated,
    lastActivity
  },
  
  // Achievements
  achievements: [],
  achievementCategories: ['learning', 'social', 'milestones'],
  unlockedCount, totalAchievements, achievementProgress,
  
  // Activity timeline
  activities: [],
  activityPage, activityHasMore,
  
  // Learning preferences
  preferences: {
    learningStyle, difficultyPreference, language,
    interests[], studyGoals[], preferredContentFormat
  },
  
  // Settings
  settings: {
    notifications: {
      email, reviewReminders, achievementAlerts,
      studyRoomInvites, weeklyProgress, newContent
    },
    privacy: {
      showProfile, showOnLeaderboard, allowStudyRoomInvites,
      dataSharing, showActivity, publicProfile
    },
    appearance: {
      theme, language, fontSize, reducedMotion, highContrast
    },
    account: {
      twoFactorEnabled, sessionTimeout, connectedAccounts[]
    }
  },
  
  // GDPR/Privacy
  gdpr: {
    consentGiven, consentDate, dataProcessingAgreed,
    marketingConsent, lastExportDate, exportInProgress,
    exportUrl
  },
  
  // UI state
  editMode, activeSection, showChangePasswordDialog,
  showDeleteAccountDialog, showExportDataDialog,
  
  loading: { ...14 loading states },
  error, successMessage
}
```

### Async Thunks (13)
1. `fetchProfile(userId)` - Get profile data
2. `updateProfile({ userId, profileData })` - Update profile
3. `uploadAvatar({ userId, file })` - Upload avatar image
4. `fetchStats(userId)` - Get user statistics
5. `fetchAchievements(userId)` - Get achievements list
6. `fetchActivity({ userId, limit })` - Get activity timeline
7. `updatePreferences({ userId, preferences })` - Update learning preferences
8. `updateSettings({ userId, settings })` - Update settings
9. `changePassword({ currentPassword, newPassword })` - Change password
10. `exportData({ userId, options, format })` - Export user data (GDPR)
11. `deleteAccount({ userId, password, reason })` - Delete account
12. `fetchPrivacySettings(userId)` - Get privacy settings
13. `updatePrivacySettings({ userId, privacySettings })` - Update privacy
14. `verifyAge({ userId, dateOfBirth, parentalConsent })` - Age verification

### Reducer Actions (25+)
- UI: `setEditMode`, `setActiveSection`, `toggleChangePasswordDialog`, `setShowChangePasswordDialog`, `toggleDeleteAccountDialog`, `setShowDeleteAccountDialog`, `toggleExportDataDialog`, `setShowExportDataDialog`
- Profile: `updateProfileField`, `updateMultipleProfileFields`
- Preferences: `updatePreferenceField`, `addInterest`, `removeInterest`
- Settings: `updateNotificationSetting`, `updatePrivacySetting`, `updateAppearanceSetting`, `updateAccountSetting`
- Achievements: `filterAchievementsByCategory`
- Activity: `loadMoreActivities`
- GDPR: `updateGDPRConsent`
- Messages: `setSuccessMessage`, `clearMessages`, `clearError`
- Reset: `resetProfileState`

## Components to Implement

### 1. ProfilePage Component
**Location**: `src/pages/ProfilePage.jsx`  
**Lines**: ~600

**Features**:
- Profile header with editable avatar, name, grade, school
- Edit button (top-right) toggles edit mode
- Stats section with 4 cards: Total Study Time, Concepts Mastered, Quizzes Completed, Current Streak
- Achievements section with badge grid (locked/unlocked states)
- Activity timeline with infinite scroll
- Responsive layout (2-column desktop, 1-column mobile)

**Structure**:
```jsx
<ProfilePage>
  <Container maxWidth="lg">
    <ProfileHeader>
      <AvatarSection>
        <Badge overlap="circular" badgeContent={<EditIcon />}>
          <Avatar src={profile.avatar} size={120} />
        </Badge>
        {editMode && <AvatarUploadButton />}
      </AvatarSection>
      
      <UserInfo>
        {editMode ? (
          <>
            <TextField label="Name" value={name} />
            <GradeSelect value={grade} />
            <TextField label="School" value={school} />
            <TextField label="Bio" multiline rows={3} />
          </>
        ) : (
          <>
            <Typography variant="h4">{name}</Typography>
            <Chip label={grade} />
            <Typography variant="body2">{school}</Typography>
            <Typography variant="body1">{bio}</Typography>
          </>
        )}
      </UserInfo>
      
      <Box>
        {editMode ? (
          <>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={handleCancel}>Cancel</Button>
          </>
        ) : (
          <IconButton onClick={() => setEditMode(true)}>
            <EditIcon />
          </IconButton>
        )}
      </Box>
    </ProfileHeader>
    
    <StatsSection>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<AccessTimeIcon />}
            label="Total Study Time"
            value={formatTime(stats.totalStudyTime)}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckCircleIcon />}
            label="Concepts Mastered"
            value={stats.conceptsMastered}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<QuizIcon />}
            label="Quizzes Completed"
            value={stats.quizzesCompleted}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<LocalFireDepartmentIcon />}
            label="Current Streak"
            value={`${stats.currentStreak} days`}
            color="error"
          />
        </Grid>
      </Grid>
    </StatsSection>
    
    <AchievementsSection>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h5">Achievements</Typography>
        <Button onClick={() => navigate('/achievements')}>
          View All
        </Button>
      </Box>
      
      <LinearProgress
        variant="determinate"
        value={achievementProgress}
        sx={{ my: 2 }}
      />
      
      <Typography variant="body2" color="text.secondary">
        {unlockedCount} / {totalAchievements} unlocked
      </Typography>
      
      <Grid container spacing={2}>
        {achievements.slice(0, 6).map(achievement => (
          <Grid item xs={4} sm={3} md={2}>
            <AchievementBadge
              achievement={achievement}
              size="medium"
            />
          </Grid>
        ))}
      </Grid>
    </AchievementsSection>
    
    <ActivityTimeline>
      <Typography variant="h5">Recent Activity</Typography>
      <Timeline>
        {activities.map(activity => (
          <TimelineItem key={activity.id}>
            <TimelineSeparator>
              <TimelineDot color={getActivityColor(activity.type)} />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2">
                {activity.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(activity.timestamp))}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
      
      {activityHasMore && (
        <Button onClick={handleLoadMore}>Load More</Button>
      )}
    </ActivityTimeline>
  </Container>
</ProfilePage>
```

**Props**: None

**Redux State Used**:
- `profile.profile` - User profile data
- `profile.stats` - Statistics
- `profile.achievements`, `unlockedCount`, `totalAchievements`, `achievementProgress`
- `profile.activities`, `activityPage`, `activityHasMore`
- `profile.editMode`
- `profile.loading`, `error`, `successMessage`

**Redux Actions**:
- `fetchProfile(userId)` - On mount
- `fetchStats(userId)` - On mount
- `fetchAchievements(userId)` - On mount
- `fetchActivity({ userId, limit: 10 })` - On mount
- `setEditMode(true/false)` - Toggle edit
- `updateProfile({ userId, profileData })` - Save changes
- `uploadAvatar({ userId, file })` - Upload avatar
- `loadMoreActivities()` - Pagination
- `fetchActivity({ userId, limit: 10 })` - Load more

**Helper Functions**:
```javascript
const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
};

const getActivityColor = (type) => {
  const colors = {
    quiz: 'primary',
    content: 'info',
    achievement: 'success',
    study_room: 'secondary'
  };
  return colors[type] || 'grey';
};
```

**Styling**:
- Container maxWidth="lg", py: 4
- Header Paper elevation={3}, p: 3, display flex, gap 3
- Avatar: 120x120 with edit badge overlay
- Stat cards: gradient backgrounds, large numbers, icons
- Achievement badges: 80x80 with locked/unlocked states
- Timeline: left-aligned dots, connector lines

### 2. StatCard Component
**Location**: `src/components/profile/StatCard.jsx`  
**Lines**: ~80

**Features**:
- Icon with colored background circle
- Label typography
- Large value display
- Hover lift effect
- Gradient background option

**Props**:
```javascript
{
  icon: ReactNode,
  label: string,
  value: string | number,
  color: 'primary' | 'success' | 'info' | 'error' | 'warning',
  trend?: { direction: 'up' | 'down', value: string }
}
```

**Structure**:
```jsx
<Card sx={{ hover effect }}>
  <CardContent>
    <Box display="flex" alignItems="center" gap={2}>
      <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
        {icon}
      </Avatar>
      <Box flex={1}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
        {trend && (
          <Chip
            size="small"
            icon={trend.direction === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={trend.value}
            color={trend.direction === 'up' ? 'success' : 'error'}
          />
        )}
      </Box>
    </Box>
  </CardContent>
</Card>
```

**Styling**:
- Card: transition 0.3s, hover transform translateY(-4px), shadow increase
- Avatar: colored background, 56x56
- Value: h4 variant, bold
- Trend chip: small size, icon, colored

### 3. AchievementBadge Component
**Location**: `src/components/profile/AchievementBadge.jsx`  
**Lines**: ~120

**Features**:
- Badge icon (locked/unlocked states)
- Progress indicator (if not unlocked)
- Tooltip with details on hover
- Click to show full details dialog
- Animated unlock effect

**Props**:
```javascript
{
  achievement: {
    id: string,
    name: string,
    description: string,
    icon: string,
    category: 'learning' | 'social' | 'milestones',
    unlocked: boolean,
    unlockedAt: string | null,
    progress: number, // 0-100
    requirement: string
  },
  size: 'small' | 'medium' | 'large',
  onClick?: () => void
}
```

**Structure**:
```jsx
<Tooltip title={achievement.name} placement="top">
  <Card
    sx={{
      opacity: achievement.unlocked ? 1 : 0.5,
      cursor: 'pointer',
      '&:hover': { transform: 'scale(1.05)' }
    }}
    onClick={onClick}
  >
    <CardContent sx={{ textAlign: 'center', p: 1 }}>
      <Badge
        overlap="circular"
        badgeContent={
          achievement.unlocked ? (
            <CheckCircleIcon color="success" />
          ) : achievement.progress > 0 ? (
            <Typography variant="caption">
              {achievement.progress}%
            </Typography>
          ) : null
        }
      >
        <Avatar
          sx={{
            width: getSizePixels(size),
            height: getSizePixels(size),
            bgcolor: achievement.unlocked ? getCategoryColor(category) : 'grey.300'
          }}
        >
          {achievement.icon || <StarIcon />}
        </Avatar>
      </Badge>
      
      {size !== 'small' && (
        <>
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {achievement.name}
          </Typography>
          {!achievement.unlocked && achievement.progress > 0 && (
            <LinearProgress
              variant="determinate"
              value={achievement.progress}
              sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
            />
          )}
        </>
      )}
    </CardContent>
  </Card>
</Tooltip>
```

**Helper Functions**:
```javascript
const getSizePixels = (size) => {
  const sizes = { small: 48, medium: 80, large: 120 };
  return sizes[size] || 80;
};

const getCategoryColor = (category) => {
  const colors = {
    learning: 'primary.main',
    social: 'secondary.main',
    milestones: 'success.main'
  };
  return colors[category] || 'grey.500';
};
```

**Styling**:
- Card: square aspect ratio, hover scale 1.05
- Avatar: category-colored background when unlocked, grey when locked
- Progress bar: 4px height, rounded, below badge
- Badge: CheckCircle icon for unlocked, progress % for in-progress

### 4. SettingsPage Component
**Location**: `src/pages/SettingsPage.jsx`  
**Lines**: ~800

**Features**:
- Sidebar navigation (5 sections)
- Notifications settings with 6 toggles
- Privacy settings with 6 toggles
- Appearance settings (theme, language, font size)
- Account settings (password, 2FA, connected accounts)
- GDPR section (data export, consent management, delete account)
- Auto-save on change with debounce
- Success/error snackbar notifications

**Structure**:
```jsx
<SettingsPage>
  <Container maxWidth="lg">
    <Box display="flex" gap={3}>
      {/* Sidebar Navigation */}
      <Paper sx={{ width: 250, position: 'sticky', top: 80, height: 'fit-content' }}>
        <List>
          {SETTINGS_SECTIONS.map(section => (
            <ListItemButton
              selected={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
            >
              <ListItemIcon>{section.icon}</ListItemIcon>
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
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={(e) => handleToggle('notifications', 'email', e.target.checked)}
                  />
                }
                label="Email notifications"
              />
              <FormControlLabel
                control={<Switch checked={settings.notifications.reviewReminders} />}
                label="Review reminders"
              />
              <FormControlLabel
                control={<Switch checked={settings.notifications.achievementAlerts} />}
                label="Achievement alerts"
              />
              <FormControlLabel
                control={<Switch checked={settings.notifications.studyRoomInvites} />}
                label="Study room invites"
              />
              <FormControlLabel
                control={<Switch checked={settings.notifications.weeklyProgress} />}
                label="Weekly progress reports"
              />
              <FormControlLabel
                control={<Switch checked={settings.notifications.newContent} />}
                label="New content notifications"
              />
            </FormGroup>
          </SettingSection>
        )}
        
        {/* Privacy Section */}
        {activeSection === 'privacy' && (
          <SettingSection title="Privacy" icon={<LockIcon />}>
            <FormGroup>
              <FormControlLabel
                control={<Switch checked={settings.privacy.showProfile} />}
                label="Show profile to peers"
              />
              <FormControlLabel
                control={<Switch checked={settings.privacy.showOnLeaderboard} />}
                label="Show on leaderboard"
              />
              <FormControlLabel
                control={<Switch checked={settings.privacy.allowStudyRoomInvites} />}
                label="Allow study room invites"
              />
              <FormControlLabel
                control={<Switch checked={settings.privacy.showActivity} />}
                label="Show recent activity"
              />
              <FormControlLabel
                control={<Switch checked={settings.privacy.publicProfile} />}
                label="Public profile (visible to everyone)"
              />
            </FormGroup>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Data Sharing
            </Typography>
            <RadioGroup
              value={settings.privacy.dataSharing}
              onChange={(e) => handleRadio('privacy', 'dataSharing', e.target.value)}
            >
              <FormControlLabel value="none" control={<Radio />} label="None - Don't share any data" />
              <FormControlLabel value="anonymous" control={<Radio />} label="Anonymous - Share anonymized data for research" />
              <FormControlLabel value="full" control={<Radio />} label="Full - Help improve the platform" />
            </RadioGroup>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Age Verification (COPPA Compliance)
            </Typography>
            {profile.ageVerified ? (
              <Alert severity="success">
                Age verified on {new Date(profile.updatedAt).toLocaleDateString()}
              </Alert>
            ) : (
              <Button
                variant="outlined"
                startIcon={<VerifiedUserIcon />}
                onClick={() => setShowAgeVerificationDialog(true)}
              >
                Verify Age
              </Button>
            )}
          </SettingSection>
        )}
        
        {/* Appearance Section */}
        {activeSection === 'appearance' && (
          <SettingSection title="Appearance" icon={<PaletteIcon />}>
            <Typography variant="subtitle2" gutterBottom>
              Theme
            </Typography>
            <ToggleButtonGroup
              value={settings.appearance.theme}
              exclusive
              onChange={(e, value) => value && handleAppearance('theme', value)}
              fullWidth
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
            
            <Typography variant="subtitle2" gutterBottom>
              Language
            </Typography>
            <Select
              value={settings.appearance.language}
              onChange={(e) => handleAppearance('language', e.target.value)}
              fullWidth
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Español</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="de">Deutsch</MenuItem>
              <MenuItem value="zh">中文</MenuItem>
              <MenuItem value="ja">日本語</MenuItem>
            </Select>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Font Size
            </Typography>
            <ToggleButtonGroup
              value={settings.appearance.fontSize}
              exclusive
              onChange={(e, value) => value && handleAppearance('fontSize', value)}
              fullWidth
            >
              <ToggleButton value="small">Small</ToggleButton>
              <ToggleButton value="medium">Medium</ToggleButton>
              <ToggleButton value="large">Large</ToggleButton>
            </ToggleButtonGroup>
            
            <Divider sx={{ my: 3 }} />
            
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
            <List>
              <ListItem>
                <ListItemText
                  primary="Change Password"
                  secondary="Update your password regularly"
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    onClick={() => setShowChangePasswordDialog(true)}
                  >
                    Change
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider />
              
              <ListItem>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary={settings.account.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.account.twoFactorEnabled}
                    onChange={(e) => handleAccount('twoFactorEnabled', e.target.checked)}
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
                  >
                    <MenuItem value={15}>15 minutes</MenuItem>
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                    <MenuItem value={120}>2 hours</MenuItem>
                  </Select>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Connected Accounts
            </Typography>
            {settings.account.connectedAccounts.length === 0 ? (
              <Alert severity="info">No connected accounts</Alert>
            ) : (
              <List>
                {settings.account.connectedAccounts.map(account => (
                  <ListItem key={account.provider}>
                    <ListItemIcon>
                      {getProviderIcon(account.provider)}
                    </ListItemIcon>
                    <ListItemText
                      primary={account.provider}
                      secondary={`Connected on ${new Date(account.connectedAt).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleDisconnect(account.provider)}>
                        <LinkOffIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            <Button
              variant="outlined"
              startIcon={<AddLinkIcon />}
              onClick={handleConnectAccount}
            >
              Connect Account
            </Button>
          </SettingSection>
        )}
        
        {/* GDPR Section */}
        {activeSection === 'gdpr' && (
          <SettingSection title="Data & Privacy" icon={<SecurityIcon />}>
            <Alert severity="info" sx={{ mb: 3 }}>
              We respect your privacy and comply with GDPR, COPPA, and other data protection regulations.
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
                      ? `Last exported: ${new Date(gdpr.lastExportDate).toLocaleDateString()}`
                      : 'Download all your data in JSON or PDF format'
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    onClick={() => setShowExportDataDialog(true)}
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
                    onClick={() => setShowConsentDialog(true)}
                  >
                    Manage
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Divider sx={{ my: 3 }} />
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Delete Account</AlertTitle>
              This action is permanent and cannot be undone. All your data will be permanently deleted.
            </Alert>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverIcon />}
              onClick={() => setShowDeleteAccountDialog(true)}
            >
              Delete My Account
            </Button>
          </SettingSection>
        )}
      </Box>
    </Box>
  </Container>
  
  {/* Dialogs */}
  <ChangePasswordDialog />
  <ExportDataDialog />
  <DeleteAccountDialog />
  <ConsentDialog />
  <AgeVerificationDialog />
</SettingsPage>
```

**Props**: None

**Redux State Used**:
- `profile.settings` - All settings
- `profile.profile` - User profile (for age verification)
- `profile.gdpr` - GDPR data
- `profile.activeSection`
- `profile.showChangePasswordDialog`, etc.
- `profile.loading`, `error`, `successMessage`

**Redux Actions**:
- `setActiveSection(section)` - Navigate sections
- `updateNotificationSetting({ setting, value })` - Toggle notifications
- `updatePrivacySetting({ setting, value })` - Toggle privacy
- `updateAppearanceSetting({ setting, value })` - Change appearance
- `updateAccountSetting({ setting, value })` - Account settings
- `updateSettings({ userId, settings })` - Auto-save debounced
- Various dialog toggles

**Auto-save Implementation**:
```javascript
const debouncedSave = useCallback(
  debounce((userId, settings) => {
    dispatch(updateSettings({ userId, settings }));
  }, 1000),
  []
);

useEffect(() => {
  if (settingsChanged) {
    debouncedSave(userId, settings);
  }
}, [settings]);
```

**Styling**:
- Container maxWidth="lg", py: 4
- Sidebar: 250px width, sticky position top 80px
- Selected list item: primary.light background
- Section Paper: elevation 2, p: 3, mb: 3
- Toggle buttons: full width groups
- Switches: primary color
- Danger actions: error color

### 5. ChangePasswordDialog Component
**Location**: `src/components/profile/ChangePasswordDialog.jsx`  
**Lines**: ~150

**Features**:
- Current password field
- New password field with strength indicator
- Confirm password field with validation
- Show/hide password toggles
- Password requirements checklist
- Form validation

**Structure**:
```jsx
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle>Change Password</DialogTitle>
  <DialogContent>
    <Stack spacing={3} sx={{ mt: 1 }}>
      <TextField
        label="Current Password"
        type={showCurrent ? 'text' : 'password'}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        error={Boolean(errors.current)}
        helperText={errors.current}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <TextField
        label="New Password"
        type={showNew ? 'text' : 'password'}
        value={newPassword}
        onChange={(e) => {
          setNewPassword(e.target.value);
          validatePassword(e.target.value);
        }}
        error={Boolean(errors.new)}
        helperText={errors.new}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowNew(!showNew)}>
                {showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <Box>
        <LinearProgress
          variant="determinate"
          value={passwordStrength}
          color={getStrengthColor(passwordStrength)}
          sx={{ height: 8, borderRadius: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          Password strength: {getStrengthLabel(passwordStrength)}
        </Typography>
      </Box>
      
      <Box>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Password must contain:
        </Typography>
        <Stack spacing={0.5}>
          <Box display="flex" alignItems="center" gap={1}>
            {requirements.length ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />}
            <Typography variant="caption">At least 8 characters</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {requirements.uppercase ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />}
            <Typography variant="caption">One uppercase letter</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {requirements.lowercase ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />}
            <Typography variant="caption">One lowercase letter</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {requirements.number ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />}
            <Typography variant="caption">One number</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {requirements.special ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />}
            <Typography variant="caption">One special character</Typography>
          </Box>
        </Stack>
      </Box>
      
      <TextField
        label="Confirm New Password"
        type={showConfirm ? 'text' : 'password'}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={Boolean(errors.confirm)}
        helperText={errors.confirm}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button
      variant="contained"
      onClick={handleChangePassword}
      disabled={!isValid || loading}
    >
      {loading ? 'Changing...' : 'Change Password'}
    </Button>
  </DialogActions>
</Dialog>
```

**Validation Logic**:
```javascript
const validatePassword = (password) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };
  
  setRequirements(requirements);
  
  const strength = Object.values(requirements).filter(Boolean).length * 20;
  setPasswordStrength(strength);
  
  const allMet = Object.values(requirements).every(Boolean);
  setIsValid(allMet && confirmPassword === password);
};

const getStrengthColor = (strength) => {
  if (strength < 40) return 'error';
  if (strength < 60) return 'warning';
  if (strength < 80) return 'info';
  return 'success';
};

const getStrengthLabel = (strength) => {
  if (strength < 40) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 80) return 'Good';
  return 'Strong';
};
```

### 6. ExportDataDialog Component
**Location**: `src/components/profile/ExportDataDialog.jsx`  
**Lines**: ~250

**Features**:
- Data selection checkboxes (profile, history, quiz results, notes)
- Format selector (JSON/PDF)
- Email option (send download link via email)
- Export progress indicator
- Download link when ready
- Expiration notice

**Structure**:
```jsx
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle>
    <Box display="flex" alignItems="center" gap={1}>
      <FileDownloadIcon />
      Export Your Data
    </Box>
  </DialogTitle>
  <DialogContent>
    <Stack spacing={3} sx={{ mt: 1 }}>
      <Alert severity="info">
        We'll prepare your data for download. Large exports may take a few minutes.
      </Alert>
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Select Data to Export
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedData.profile}
                onChange={(e) => handleDataSelect('profile', e.target.checked)}
              />
            }
            label="Profile information"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedData.learningHistory}
                onChange={(e) => handleDataSelect('learningHistory', e.target.checked)}
              />
            }
            label="Learning history"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedData.quizResults}
                onChange={(e) => handleDataSelect('quizResults', e.target.checked)}
              />
            }
            label="Quiz results and progress"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedData.notes}
                onChange={(e) => handleDataSelect('notes', e.target.checked)}
              />
            }
            label="Notes and highlights"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedData.achievements}
                onChange={(e) => handleDataSelect('achievements', e.target.checked)}
              />
            }
            label="Achievements and badges"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedData.studyRooms}
                onChange={(e) => handleDataSelect('studyRooms', e.target.checked)}
              />
            }
            label="Study room history"
          />
        </FormGroup>
      </Box>
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Export Format
        </Typography>
        <RadioGroup value={format} onChange={(e) => setFormat(e.target.value)}>
          <FormControlLabel
            value="json"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body2">JSON</Typography>
                <Typography variant="caption" color="text.secondary">
                  Machine-readable format for data portability
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="pdf"
            control={<Radio />}
            label={
              <Box>
                <Typography variant="body2">PDF</Typography>
                <Typography variant="caption" color="text.secondary">
                  Human-readable document with formatted data
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </Box>
      
      <FormControlLabel
        control={
          <Checkbox
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
          />
        }
        label="Send download link to my email"
      />
      
      {exportInProgress && (
        <Box>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Preparing your export... This may take a few minutes.
          </Typography>
        </Box>
      )}
      
      {exportUrl && (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          <AlertTitle>Export Ready!</AlertTitle>
          Your data export is ready for download.
          <Button
            variant="contained"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={() => window.open(exportUrl, '_blank')}
            sx={{ mt: 1 }}
          >
            Download Now
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Link expires in 24 hours
          </Typography>
        </Alert>
      )}
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Close</Button>
    <Button
      variant="contained"
      onClick={handleExport}
      disabled={!hasSelection || exportInProgress}
      startIcon={<FileDownloadIcon />}
    >
      {exportInProgress ? 'Exporting...' : 'Export Data'}
    </Button>
  </DialogActions>
</Dialog>
```

**Redux Integration**:
```javascript
const handleExport = async () => {
  try {
    await dispatch(exportData({
      userId,
      options: selectedData,
      format
    })).unwrap();
    
    if (sendEmail) {
      // Email sent notification
    }
  } catch (error) {
    // Error handling
  }
};
```

### 7. DeleteAccountDialog Component
**Location**: `src/components/profile/DeleteAccountDialog.jsx`  
**Lines**: ~200

**Features**:
- Warning messages
- Password confirmation
- Reason selection
- Final confirmation checkbox
- Countdown timer (3 seconds)
- Account deletion scheduling notice

**Structure**:
```jsx
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
    <Box display="flex" alignItems="center" gap={1}>
      <WarningIcon />
      Delete Account
    </Box>
  </DialogTitle>
  <DialogContent>
    <Stack spacing={3} sx={{ mt: 2 }}>
      <Alert severity="error">
        <AlertTitle>This action cannot be undone!</AlertTitle>
        Deleting your account will:
        <ul>
          <li>Permanently delete all your data</li>
          <li>Remove you from all study rooms</li>
          <li>Delete all your progress and achievements</li>
          <li>Cancel any active subscriptions</li>
        </ul>
      </Alert>
      
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        helperText="Enter your password to confirm"
        fullWidth
        required
      />
      
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Why are you leaving? (Optional)
        </Typography>
        <Select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Prefer not to say</MenuItem>
          <MenuItem value="not_useful">Not useful for me</MenuItem>
          <MenuItem value="too_difficult">Content too difficult</MenuItem>
          <MenuItem value="too_easy">Content too easy</MenuItem>
          <MenuItem value="privacy_concerns">Privacy concerns</MenuItem>
          <MenuItem value="switching_platform">Switching to another platform</MenuItem>
          <MenuItem value="other">Other reason</MenuItem>
        </Select>
      </Box>
      
      {reason === 'other' && (
        <TextField
          label="Please tell us more (optional)"
          multiline
          rows={3}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          fullWidth
        />
      )}
      
      <FormControlLabel
        control={
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            color="error"
          />
        }
        label="I understand this action is permanent and cannot be undone"
      />
      
      {confirmed && countdown > 0 && (
        <Alert severity="warning">
          Please wait {countdown} seconds before confirming...
        </Alert>
      )}
      
      <Alert severity="info">
        Your account will be scheduled for deletion. You have 30 days to cancel this request by logging in again.
      </Alert>
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button
      variant="contained"
      color="error"
      onClick={handleDeleteAccount}
      disabled={!password || !confirmed || countdown > 0 || loading}
      startIcon={<DeleteForeverIcon />}
    >
      {loading ? 'Deleting...' : countdown > 0 ? `Wait ${countdown}s` : 'Delete My Account'}
    </Button>
  </DialogActions>
</Dialog>
```

**Countdown Logic**:
```javascript
useEffect(() => {
  if (confirmed && countdown > 0) {
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [confirmed, countdown]);

useEffect(() => {
  if (confirmed) {
    setCountdown(3);
  }
}, [confirmed]);
```

## Environment Configuration Updates

### .env.example
```env
# Security Agent (Port 8017) - Profile Management
VITE_SECURITY_PROFILE_ENDPOINT=/api/profile
VITE_SECURITY_AVATAR_ENDPOINT=/api/profile
VITE_SECURITY_SETTINGS_ENDPOINT=/api/settings
VITE_SECURITY_CHANGE_PASSWORD_ENDPOINT=/api/change-password
VITE_SECURITY_PRIVACY_ENDPOINT=/api/privacy
VITE_SECURITY_EXPORT_DATA_ENDPOINT=/api/export-data
VITE_SECURITY_DELETE_ACCOUNT_ENDPOINT=/api/account
VITE_SECURITY_VERIFY_AGE_ENDPOINT=/api/verify-age

# Analytics Agent (Port 8011) - Profile Analytics
VITE_ANALYTICS_METRICS_ENDPOINT=/api/metrics
VITE_ANALYTICS_ACHIEVEMENTS_ENDPOINT=/api/achievements
VITE_ANALYTICS_ACTIVITY_ENDPOINT=/api/activity
```

## Next Steps

1. **Installation** - No new dependencies required
2. **API Services** - COMPLETED (securityService, analyticsService enhancement)
3. **Components** - Need to create 7 components (ProfilePage, StatCard, AchievementBadge, SettingsPage, ChangePasswordDialog, ExportDataDialog, DeleteAccountDialog)
4. **Redux** - Need to replace existing profileSlice with comprehensive version
5. **Router** - Add routes for `/profile`, `/settings`, `/achievements`
6. **Backend** - Implement Security Agent endpoints per contracts
7. **Testing** - Unit tests, integration tests, E2E tests

## File Summary

| File | Location | Lines | Status |
|------|----------|-------|--------|
| profileSlice.js (enhanced) | src/store/slices/ | ~850 | Needs replacement |
| api.js (enhanced) | src/services/ | +200 | ✅ COMPLETED |
| ProfilePage.jsx | src/pages/ | ~600 | TODO |
| StatCard.jsx | src/components/profile/ | ~80 | TODO |
| AchievementBadge.jsx | src/components/profile/ | ~120 | TODO |
| SettingsPage.jsx | src/pages/ | ~800 | TODO |
| ChangePasswordDialog.jsx | src/components/profile/ | ~150 | TODO |
| ExportDataDialog.jsx | src/components/profile/ | ~250 | TODO |
| DeleteAccountDialog.jsx | src/components/profile/ | ~200 | TODO |

**Total**: 1 file enhanced (API), 8 files to create (~3,050 lines)

This comprehensive guide provides complete specifications for all Profile & Settings components following learnyourway.withgoogle.com design patterns!
