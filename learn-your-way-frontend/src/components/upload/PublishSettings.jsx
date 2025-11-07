import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updatePublishSetting, publishContent } from '../../store/slices/uploadSlice';
import {
  Public,
  School,
  Group,
  Lock,
  Schedule,
  Notifications,
  PlaylistAdd
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  TextField,
  Autocomplete,
  FormGroup,
  Alert
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Mock data - In real app, fetch from API
const MOCK_CLASSES = [
  { id: '1', name: 'Biology 101', studentCount: 28 },
  { id: '2', name: 'Chemistry Advanced', studentCount: 22 },
  { id: '3', name: 'Physics Fundamentals', studentCount: 30 },
  { id: '4', name: 'Mathematics 11th Grade', studentCount: 25 }
];

const MOCK_STUDENTS = [
  { id: '1', name: 'Alice Johnson', class: '1' },
  { id: '2', name: 'Bob Smith', class: '1' },
  { id: '3', name: 'Charlie Brown', class: '1' },
  { id: '4', name: 'Diana Prince', class: '2' },
  { id: '5', name: 'Ethan Hunt', class: '2' },
  { id: '6', name: 'Fiona Apple', class: '3' },
  { id: '7', name: 'George Martin', class: '3' },
  { id: '8', name: 'Hannah Montana', class: '4' }
];

const VISIBILITY_OPTIONS = [
  {
    value: 'private',
    label: 'Private',
    description: 'Only you can access this content',
    icon: <Lock />
  },
  {
    value: 'class',
    label: 'Class',
    description: 'Share with selected classes',
    icon: <Group />
  },
  {
    value: 'school',
    label: 'School',
    description: 'Available to your entire school',
    icon: <School />
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can access this content',
    icon: <Public />
  }
];

const PublishSettings = () => {
  const dispatch = useDispatch();
  const { publishSettings, loading, selectedContent, metadata } = useSelector((state) => state.upload);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(null);

  const contentId = selectedContent?.id || 'temp_id';

  // Initialize from Redux state
  useEffect(() => {
    if (publishSettings.accessControl?.classes) {
      const classes = MOCK_CLASSES.filter(c =>
        publishSettings.accessControl.classes.includes(c.id)
      );
      setSelectedClasses(classes);
    }
    if (publishSettings.accessControl?.students) {
      const students = MOCK_STUDENTS.filter(s =>
        publishSettings.accessControl.students.includes(s.id)
      );
      setSelectedStudents(students);
    }
    if (publishSettings.scheduledPublish) {
      setScheduledDate(new Date(publishSettings.scheduledPublish));
    }
  }, [publishSettings]);

  // Handle visibility change
  const handleVisibilityChange = (event) => {
    const visibility = event.target.value;
    dispatch(updatePublishSetting({ field: 'visibility', value: visibility }));
    
    // Reset access control if not class visibility
    if (visibility !== 'class') {
      setSelectedClasses([]);
      setSelectedStudents([]);
      dispatch(updatePublishSetting({ field: 'accessControl', value: { classes: [], students: [] } }));
    }
  };

  // Handle class selection
  const handleClassChange = (event, newValue) => {
    setSelectedClasses(newValue);
    dispatch(updatePublishSetting({
      field: 'accessControl.classes',
      value: newValue.map(c => c.id)
    }));
    
    // Filter students based on selected classes
    const classIds = newValue.map(c => c.id);
    const filteredStudents = selectedStudents.filter(s => classIds.includes(s.class));
    setSelectedStudents(filteredStudents);
    dispatch(updatePublishSetting({
      field: 'accessControl.students',
      value: filteredStudents.map(s => s.id)
    }));
  };

  // Handle student selection
  const handleStudentChange = (event, newValue) => {
    setSelectedStudents(newValue);
    dispatch(updatePublishSetting({
      field: 'accessControl.students',
      value: newValue.map(s => s.id)
    }));
  };

  // Handle schedule change
  const handleScheduleChange = (newValue) => {
    setScheduledDate(newValue);
    dispatch(updatePublishSetting({
      field: 'scheduledPublish',
      value: newValue ? newValue.toISOString() : null
    }));
  };

  // Handle notification settings
  const handleNotificationChange = (field, checked) => {
    dispatch(updatePublishSetting({
      field: `notifications.${field}`,
      value: checked
    }));
  };

  // Handle publish
  const handlePublish = () => {
    dispatch(publishContent({
      contentId,
      settings: publishSettings
    }));
  };

  // Get available students for selected classes
  const getAvailableStudents = () => {
    const classIds = selectedClasses.map(c => c.id);
    return MOCK_STUDENTS.filter(s => classIds.includes(s.class));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Publish Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure how and when your content will be shared
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Visibility Settings */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Visibility
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={publishSettings.visibility}
                onChange={handleVisibilityChange}
              >
                {VISIBILITY_OPTIONS.map((option) => (
                  <Card
                    key={option.value}
                    variant="outlined"
                    sx={{
                      mb: 2,
                      cursor: 'pointer',
                      border: publishSettings.visibility === option.value
                        ? '2px solid #1976d2'
                        : '1px solid rgba(0, 0, 0, 0.12)',
                      '&:hover': {
                        borderColor: '#1976d2'
                      }
                    }}
                    onClick={() => handleVisibilityChange({ target: { value: option.value } })}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          value={option.value}
                          control={<Radio />}
                          label=""
                          sx={{ m: 0, mr: 2 }}
                        />
                        <Box sx={{ color: 'primary.main', mr: 2 }}>
                          {option.icon}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {option.label}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </FormControl>
          </Paper>

          {/* Access Control (shown only for class visibility) */}
          {publishSettings.visibility === 'class' && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Access Control
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Classes
                </Typography>
                <Autocomplete
                  multiple
                  options={MOCK_CLASSES}
                  getOptionLabel={(option) => `${option.name} (${option.studentCount} students)`}
                  value={selectedClasses}
                  onChange={handleClassChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select classes to share with"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.name}
                        {...getTagProps({ index })}
                        key={option.id}
                      />
                    ))
                  }
                />
              </Box>

              {selectedClasses.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Select Specific Students (Optional)
                  </Typography>
                  <Autocomplete
                    multiple
                    options={getAvailableStudents()}
                    getOptionLabel={(option) => option.name}
                    groupBy={(option) => {
                      const studentClass = MOCK_CLASSES.find(c => c.id === option.class);
                      return studentClass?.name || 'Unknown';
                    }}
                    value={selectedStudents}
                    onChange={handleStudentChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Leave empty to share with all class students"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          size="small"
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {selectedStudents.length === 0
                      ? 'Content will be shared with all students in selected classes'
                      : `Content will be shared with ${selectedStudents.length} selected student(s)`}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {/* Schedule Publishing */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Schedule Publishing
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Publish Date & Time"
                value={scheduledDate}
                onChange={handleScheduleChange}
                minDateTime={new Date()}
                renderInput={(params) => <TextField {...params} fullWidth />}
                slotProps={{
                  textField: {
                    helperText: scheduledDate
                      ? 'Content will be published automatically at this time'
                      : 'Leave empty to publish immediately',
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>

            {scheduledDate && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Scheduled for {scheduledDate.toLocaleString()}
              </Alert>
            )}
          </Paper>

          {/* Notification Settings */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={publishSettings.notifications?.notifyStudents || false}
                    onChange={(e) => handleNotificationChange('notifyStudents', e.target.checked)}
                    icon={<Notifications />}
                    checkedIcon={<Notifications color="primary" />}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2">
                      Notify Students
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Send email and push notifications to students
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={publishSettings.notifications?.addToStudyPlan || false}
                    onChange={(e) => handleNotificationChange('addToStudyPlan', e.target.checked)}
                    icon={<PlaylistAdd />}
                    checkedIcon={<PlaylistAdd color="primary" />}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2">
                      Add to Study Plan
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automatically add content to students' study plans
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Paper>
        </Grid>

        {/* Preview/Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Publish Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Content Title
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {metadata.title || 'Untitled Content'}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Visibility
              </Typography>
              <Chip
                label={publishSettings.visibility}
                color="primary"
                icon={VISIBILITY_OPTIONS.find(o => o.value === publishSettings.visibility)?.icon}
              />
            </Box>

            {publishSettings.visibility === 'class' && selectedClasses.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Classes ({selectedClasses.length})
                </Typography>
                {selectedClasses.map((cls) => (
                  <Chip
                    key={cls.id}
                    label={cls.name}
                    size="small"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            )}

            {selectedStudents.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Students ({selectedStudents.length})
                </Typography>
                <Typography variant="caption">
                  {selectedStudents.map(s => s.name).join(', ')}
                </Typography>
              </Box>
            )}

            {scheduledDate && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Scheduled For
                </Typography>
                <Typography variant="body2">
                  {scheduledDate.toLocaleString()}
                </Typography>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Notifications
              </Typography>
              <Box>
                {publishSettings.notifications?.notifyStudents && (
                  <Chip label="Notify Students" size="small" color="success" sx={{ m: 0.5 }} />
                )}
                {publishSettings.notifications?.addToStudyPlan && (
                  <Chip label="Add to Study Plan" size="small" color="success" sx={{ m: 0.5 }} />
                )}
                {!publishSettings.notifications?.notifyStudents && !publishSettings.notifications?.addToStudyPlan && (
                  <Typography variant="caption" color="text.secondary">
                    No notifications enabled
                  </Typography>
                )}
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handlePublish}
              disabled={loading.publish || !metadata.title}
              sx={{ mt: 2 }}
            >
              {loading.publish ? 'Publishing...' : scheduledDate ? 'Schedule Publish' : 'Publish Now'}
            </Button>

            {!metadata.title && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please add a title before publishing
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PublishSettings;
