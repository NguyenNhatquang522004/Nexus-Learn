import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
  Typography,
  Alert,
  InputAdornment,
  Chip,
  Stack
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import {
  Add as AddIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Topic as TopicIcon
} from '@mui/icons-material';
import { createRoom } from '../../store/slices/collaborationSlice';

const TOPICS = [
  'Mathematics',
  'Science',
  'History',
  'Literature',
  'Language Arts',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Geography',
  'Economics',
  'Philosophy',
  'Art & Design',
  'Music',
  'General Study'
];

const PARTICIPANT_MARKS = [
  { value: 2, label: '2' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 20, label: '20' },
  { value: 25, label: '25' },
  { value: 30, label: '30+' }
];

const CreateRoom = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.collaboration);
  const currentUser = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    privacy: 'public',
    maxParticipants: 10,
    scheduledTime: null,
    description: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Room name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Room name must be less than 50 characters';
    }

    if (!formData.topic) {
      newErrors.topic = 'Please select a topic';
    }

    if (formData.scheduledTime) {
      const now = new Date();
      if (formData.scheduledTime < now) {
        newErrors.scheduledTime = 'Scheduled time must be in the future';
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRoom = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const roomData = {
        ...formData,
        hostId: currentUser.id,
        hostName: currentUser.name || currentUser.username,
        scheduledTime: formData.scheduledTime ? formData.scheduledTime.toISOString() : null
      };

      const result = await dispatch(createRoom(roomData)).unwrap();
      
      // Navigate to room lobby
      navigate(`/study-room/${result.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      topic: '',
      privacy: 'public',
      maxParticipants: 10,
      scheduledTime: null,
      description: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <AddIcon />
        Create Study Room
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => {}}>
              {error}
            </Alert>
          )}

          {/* Room Name */}
          <TextField
            label="Room Name"
            placeholder="e.g., Calculus Study Group"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={Boolean(errors.name)}
            helperText={errors.name || `${formData.name.length}/50 characters`}
            fullWidth
            required
            inputProps={{ maxLength: 50 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <GroupIcon color="action" />
                </InputAdornment>
              )
            }}
          />

          {/* Topic Selector */}
          <FormControl fullWidth required error={Boolean(errors.topic)}>
            <InputLabel id="topic-label">Topic</InputLabel>
            <Select
              labelId="topic-label"
              value={formData.topic}
              label="Topic"
              onChange={(e) => handleInputChange('topic', e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <TopicIcon color="action" />
                </InputAdornment>
              }
            >
              {TOPICS.map((topic) => (
                <MenuItem key={topic} value={topic}>
                  {topic}
                </MenuItem>
              ))}
            </Select>
            {errors.topic && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                {errors.topic}
              </Typography>
            )}
          </FormControl>

          {/* Description */}
          <TextField
            label="Description (Optional)"
            placeholder="What will you study in this room?"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            error={Boolean(errors.description)}
            helperText={errors.description || `${formData.description.length}/500 characters`}
            fullWidth
            multiline
            rows={3}
            inputProps={{ maxLength: 500 }}
          />

          {/* Privacy Toggle */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Privacy
            </Typography>
            <ToggleButtonGroup
              value={formData.privacy}
              exclusive
              onChange={(e, value) => value && handleInputChange('privacy', value)}
              fullWidth
              color="primary"
            >
              <ToggleButton value="public" sx={{ py: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <PublicIcon />
                  <Box textAlign="left">
                    <Typography variant="body2" fontWeight="bold">
                      Public
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Anyone can join
                    </Typography>
                  </Box>
                </Box>
              </ToggleButton>
              <ToggleButton value="private" sx={{ py: 1.5 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <LockIcon />
                  <Box textAlign="left">
                    <Typography variant="body2" fontWeight="bold">
                      Private
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Invite only
                    </Typography>
                  </Box>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Max Participants */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Max Participants: {formData.maxParticipants}
            </Typography>
            <Slider
              value={formData.maxParticipants}
              onChange={(e, value) => handleInputChange('maxParticipants', value)}
              min={2}
              max={30}
              marks={PARTICIPANT_MARKS}
              step={1}
              valueLabelDisplay="auto"
              color="primary"
            />
            <Typography variant="caption" color="text.secondary">
              Recommended: 5-10 participants for best collaboration
            </Typography>
          </Box>

          {/* Schedule Time */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Schedule Time (Optional)
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                value={formData.scheduledTime}
                onChange={(value) => handleInputChange('scheduledTime', value)}
                minDateTime={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    placeholder: 'Start immediately',
                    error: Boolean(errors.scheduledTime),
                    helperText: errors.scheduledTime || 'Leave empty to start immediately',
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <ScheduleIcon color="action" />
                        </InputAdornment>
                      )
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* Room Summary */}
          {formData.name && formData.topic && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.lighter',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.main'
              }}
            >
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Room Summary
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formData.name}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Topic:
                  </Typography>
                  <Chip label={formData.topic} size="small" color="primary" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Privacy:
                  </Typography>
                  <Chip
                    label={formData.privacy === 'public' ? 'Public' : 'Private'}
                    size="small"
                    color={formData.privacy === 'public' ? 'success' : 'default'}
                    icon={formData.privacy === 'public' ? <PublicIcon /> : <LockIcon />}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Max Participants:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formData.maxParticipants}
                  </Typography>
                </Box>
                {formData.scheduledTime && (
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Starts:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formData.scheduledTime.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={loading.createRoom}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreateRoom}
          disabled={loading.createRoom || !formData.name || !formData.topic}
          startIcon={<AddIcon />}
        >
          {loading.createRoom ? 'Creating...' : 'Create Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRoom;
