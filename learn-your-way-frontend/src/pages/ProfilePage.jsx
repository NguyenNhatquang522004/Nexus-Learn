import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Avatar,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Grid,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Snackbar,
  Badge,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineDot,
  TimelineContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Quiz as QuizIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import StatCard from '../../components/profile/StatCard';
import AchievementBadge from '../../components/profile/AchievementBadge';
import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  fetchStats,
  fetchAchievements,
  fetchActivity,
  setEditMode,
  updateProfileField,
  clearMessages,
  loadMoreActivities,
  selectProfile,
  selectStats,
  selectAchievements,
  selectActivities,
  selectLoading,
  selectError,
  selectSuccessMessage,
} from '../../store/slices/profileSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const profile = useSelector(selectProfile);
  const stats = useSelector(selectStats);
  const achievements = useSelector(selectAchievements);
  const activities = useSelector(selectActivities);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const successMessage = useSelector(selectSuccessMessage);
  const { editMode, activityPage, activityHasMore, unlockedCount, totalAchievements, achievementProgress } = useSelector((state) => state.profile);

  // Local state for editing
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    grade: '',
    school: '',
    bio: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Get userId from auth state (assuming it's stored in auth slice)
  const userId = useSelector((state) => state.auth?.user?.id);

  // Fetch data on mount
  useEffect(() => {
    if (userId) {
      dispatch(fetchProfile(userId));
      dispatch(fetchStats(userId));
      dispatch(fetchAchievements(userId));
      dispatch(fetchActivity({ userId, limit: 10 }));
    }
  }, [dispatch, userId]);

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setEditedProfile({
        name: profile.name || '',
        grade: profile.grade || '',
        school: profile.school || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  // Handle avatar file selection
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile field changes
  const handleFieldChange = (field, value) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save
  const handleSave = async () => {
    try {
      // Upload avatar if changed
      if (avatarFile) {
        await dispatch(uploadAvatar({ userId, file: avatarFile })).unwrap();
      }

      // Update profile
      await dispatch(updateProfile({ userId, profileData: editedProfile })).unwrap();
      
      // Reset edit state
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    dispatch(setEditMode(false));
    setEditedProfile({
      name: profile.name || '',
      grade: profile.grade || '',
      school: profile.school || '',
      bio: profile.bio || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Handle load more activities
  const handleLoadMore = () => {
    dispatch(loadMoreActivities());
    dispatch(fetchActivity({ userId, limit: 10 }));
  };

  // Handle close snackbar
  const handleCloseSnackbar = () => {
    dispatch(clearMessages());
  };

  // Format time helper
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  // Get activity color helper
  const getActivityColor = (type) => {
    const colors = {
      quiz: 'primary',
      content: 'info',
      achievement: 'success',
      study_room: 'secondary',
      learning: 'warning',
    };
    return colors[type] || 'grey';
  };

  // Grades list
  const grades = [
    '6th Grade',
    '7th Grade',
    '8th Grade',
    '9th Grade',
    '10th Grade',
    '11th Grade',
    '12th Grade',
    'College',
    'Other',
  ];

  if (loading.profile && !profile.id) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Profile Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" gap={3} flexWrap="wrap">
          {/* Avatar Section */}
          <Box sx={{ textAlign: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                editMode ? (
                  <IconButton
                    component="label"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </IconButton>
                ) : null
              }
            >
              <Avatar
                src={avatarPreview || profile.avatar || '/default-avatar.png'}
                sx={{
                  width: 120,
                  height: 120,
                  border: '4px solid',
                  borderColor: 'primary.main',
                  boxShadow: 3,
                }}
              />
            </Badge>
          </Box>

          {/* User Info Section */}
          <Box flex={1} sx={{ minWidth: 250 }}>
            {editMode ? (
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Full Name"
                  value={editedProfile.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  fullWidth
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Grade Level</InputLabel>
                  <Select
                    value={editedProfile.grade}
                    onChange={(e) => handleFieldChange('grade', e.target.value)}
                    label="Grade Level"
                  >
                    {grades.map((grade) => (
                      <MenuItem key={grade} value={grade}>
                        {grade}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="School"
                  value={editedProfile.school}
                  onChange={(e) => handleFieldChange('school', e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Bio"
                  value={editedProfile.bio}
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </Box>
            ) : (
              <>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {profile.name || 'Anonymous User'}
                </Typography>
                <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                  {profile.grade && (
                    <Chip label={profile.grade} color="primary" size="small" />
                  )}
                  {profile.ageVerified && (
                    <Chip
                      label="Age Verified"
                      color="success"
                      size="small"
                      icon={<CheckCircleIcon />}
                    />
                  )}
                </Box>
                {profile.school && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    📚 {profile.school}
                  </Typography>
                )}
                {profile.bio && (
                  <Typography variant="body1" sx={{ mt: 1 }}>
                    {profile.bio}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </>
            )}
          </Box>

          {/* Action Buttons */}
          <Box display="flex" flexDirection="column" gap={1}>
            {editMode ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading.profile || loading.avatar}
                >
                  {loading.profile || loading.avatar ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading.profile || loading.avatar}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <IconButton
                color="primary"
                onClick={() => dispatch(setEditMode(true))}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <EditIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Stats Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Statistics
        </Typography>
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
      </Box>

      {/* Achievements Section */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight="bold">
            Achievements
          </Typography>
          <Button
            variant="outlined"
            endIcon={<TrophyIcon />}
            onClick={() => navigate('/achievements')}
          >
            View All
          </Button>
        </Box>

        <LinearProgress
          variant="determinate"
          value={achievementProgress}
          sx={{
            height: 8,
            borderRadius: 4,
            mb: 1,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
            },
          }}
        />

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {unlockedCount} / {totalAchievements} unlocked ({achievementProgress}%)
        </Typography>

        {loading.achievements ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : achievements.length > 0 ? (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {achievements.slice(0, 6).map((achievement) => (
              <Grid item xs={4} sm={3} md={2} key={achievement.id}>
                <AchievementBadge
                  achievement={achievement}
                  size="medium"
                  onClick={() => navigate(`/achievements/${achievement.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No achievements yet. Start learning to unlock your first achievement!
          </Alert>
        )}
      </Paper>

      {/* Activity Timeline */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Recent Activity
        </Typography>

        {loading.activity && activityPage === 1 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : activities.length > 0 ? (
          <>
            <Timeline sx={{ mt: 2 }}>
              {activities.map((activity, index) => (
                <TimelineItem key={activity.id}>
                  <TimelineSeparator>
                    <TimelineDot color={getActivityColor(activity.type)} />
                    {index < activities.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {activity.description || activity.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </Typography>
                      {activity.metadata && (
                        <Box sx={{ mt: 0.5 }}>
                          {activity.metadata.score && (
                            <Chip
                              label={`Score: ${activity.metadata.score}%`}
                              size="small"
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {activity.metadata.points && (
                            <Chip
                              label={`+${activity.metadata.points} points`}
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>

            {activityHasMore && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={loading.activity}
                >
                  {loading.activity ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Alert severity="info">
            No recent activity. Start learning to see your activity here!
          </Alert>
        )}
      </Paper>

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

export default ProfilePage;
