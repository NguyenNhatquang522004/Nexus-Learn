import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  PlayArrow as StartIcon,
  ExitToApp as LeaveIcon,
  Share as ShareIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Topic as TopicIcon
} from '@mui/icons-material';
import {
  fetchRoomDetails,
  leaveRoom,
  updateReadyStatus,
  startRoomSession
} from '../../store/slices/collaborationSlice';

const AVATAR_COLORS = [
  '#1976d2', '#d32f2f', '#388e3c', '#f57c00',
  '#7b1fa2', '#0097a7', '#c62828', '#5d4037'
];

const ParticipantCard = ({ participant, isHost, isMe }) => {
  const getAvatarColor = (id) => {
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  };

  return (
    <Card
      sx={{
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6
        },
        border: isMe ? 2 : 1,
        borderColor: isMe ? 'primary.main' : 'divider'
      }}
    >
      <CardContent>
        <Stack spacing={1} alignItems="center">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              participant.isReady ? (
                <CheckIcon sx={{ fontSize: 20, color: 'success.main' }} />
              ) : null
            }
          >
            <Avatar
              src={participant.avatar}
              sx={{
                width: 64,
                height: 64,
                bgcolor: getAvatarColor(participant.id),
                fontSize: 28,
                fontWeight: 'bold'
              }}
            >
              {participant.name?.[0]?.toUpperCase() || <PersonIcon />}
            </Avatar>
          </Badge>

          <Box textAlign="center">
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {participant.name}
              {isMe && ' (You)'}
            </Typography>
            {isHost && (
              <Chip
                label="Host"
                size="small"
                color="primary"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>

          <Chip
            label={participant.isReady ? 'Ready' : 'Not Ready'}
            size="small"
            color={participant.isReady ? 'success' : 'default'}
            icon={participant.isReady ? <CheckIcon /> : <CancelIcon />}
          />

          {participant.status && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {participant.status}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const RoomLobby = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const {
    roomName,
    roomTopic,
    roomPrivacy,
    hostId,
    maxParticipants,
    scheduledTime,
    participants,
    participantCount,
    myParticipantId,
    readyParticipants,
    allReady,
    roomStatus,
    loading,
    error
  } = useSelector((state) => state.collaboration);

  const currentUser = useSelector((state) => state.auth.user);
  const [copied, setCopied] = useState(false);
  const [isMyReady, setIsMyReady] = useState(false);

  const isHost = hostId === currentUser?.id;
  const canStart = isHost && allReady && participantCount >= 2;
  const roomUrl = `${window.location.origin}/study-room/${roomId}`;

  useEffect(() => {
    if (roomId) {
      dispatch(fetchRoomDetails(roomId));
    }
  }, [dispatch, roomId]);

  useEffect(() => {
    if (roomStatus === 'active') {
      navigate(`/study-room/${roomId}/active`);
    }
  }, [roomStatus, roomId, navigate]);

  useEffect(() => {
    setIsMyReady(readyParticipants.includes(myParticipantId));
  }, [readyParticipants, myParticipantId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomName} Study Room`,
          text: `Join our study room on ${roomTopic}!`,
          url: roomUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleToggleReady = async () => {
    try {
      await dispatch(updateReadyStatus({
        roomId,
        isReady: !isMyReady
      })).unwrap();
    } catch (error) {
      console.error('Failed to update ready status:', error);
    }
  };

  const handleStartSession = async () => {
    if (!canStart) return;

    try {
      await dispatch(startRoomSession(roomId)).unwrap();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await dispatch(leaveRoom(roomId)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  if (loading.fetchRoom) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={() => navigate('/dashboard')}>
            Go Back
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {roomName}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Chip
                  icon={<TopicIcon />}
                  label={roomTopic}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip
                  icon={roomPrivacy === 'public' ? <PublicIcon /> : <LockIcon />}
                  label={roomPrivacy === 'public' ? 'Public' : 'Private'}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip
                  label={`${participantCount}/${maxParticipants} Participants`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Stack>
            </Box>
            <Tooltip title="Leave Room">
              <IconButton
                onClick={handleLeaveRoom}
                sx={{
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <LeaveIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {scheduledTime && (
            <Box display="flex" alignItems="center" gap={1}>
              <ScheduleIcon />
              <Typography variant="body2">
                Scheduled for: {new Date(scheduledTime).toLocaleString()}
              </Typography>
            </Box>
          )}

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />

          {/* Share Link */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Invite Link
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                value={roomUrl}
                size="small"
                fullWidth
                InputProps={{
                  readOnly: true,
                  sx: { bgcolor: 'rgba(255,255,255,0.9)', color: 'text.primary' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleCopyLink} size="small">
                        {copied ? <CheckIcon color="success" /> : <CopyIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                variant="contained"
                onClick={handleShare}
                startIcon={<ShareIcon />}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Share
              </Button>
            </Box>
            {copied && (
              <Typography variant="caption" color="success.light" sx={{ mt: 0.5 }}>
                ✓ Link copied to clipboard!
              </Typography>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Ready Status Alert */}
      {participantCount >= 2 && !allReady && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Waiting for all participants to be ready... ({readyParticipants.length}/{participantCount} ready)
        </Alert>
      )}

      {participantCount < 2 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Waiting for at least one more participant to join...
        </Alert>
      )}

      {/* Participants Grid */}
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Participants ({participantCount}/{maxParticipants})
        </Typography>
        <Grid container spacing={2}>
          {participants.map((participant) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={participant.id}>
              <ParticipantCard
                participant={participant}
                isHost={participant.id === hostId}
                isMe={participant.id === myParticipantId}
              />
            </Grid>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, maxParticipants - participantCount) }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={`empty-${index}`}>
              <Card
                sx={{
                  height: '100%',
                  border: '2px dashed',
                  borderColor: 'divider',
                  bgcolor: 'action.hover'
                }}
              >
                <CardContent>
                  <Stack spacing={1} alignItems="center" justifyContent="center" minHeight={160}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'action.disabled' }}>
                      <PersonIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      Waiting for participant...
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Ready Check Actions */}
      <Paper elevation={3} sx={{ p: 3, position: 'sticky', bottom: 16, zIndex: 1000 }}>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Ready to Start?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isHost
                  ? 'As the host, you can start when everyone is ready'
                  : 'Mark yourself as ready when you\'re prepared to begin'}
              </Typography>
            </Box>

            <Box display="flex" gap={2}>
              <Button
                variant={isMyReady ? 'outlined' : 'contained'}
                color={isMyReady ? 'error' : 'success'}
                size="large"
                onClick={handleToggleReady}
                startIcon={isMyReady ? <CancelIcon /> : <CheckIcon />}
                disabled={loading.updateReady}
              >
                {isMyReady ? 'Not Ready' : 'I\'m Ready'}
              </Button>

              {isHost && (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleStartSession}
                  startIcon={<StartIcon />}
                  disabled={!canStart || loading.startSession}
                  sx={{
                    minWidth: 150,
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}
                >
                  {loading.startSession ? 'Starting...' : 'Start Session'}
                </Button>
              )}
            </Box>
          </Box>

          {/* Ready Progress */}
          {participantCount >= 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Ready participants
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {readyParticipants.length}/{participantCount}
                </Typography>
              </Box>
              <Box
                sx={{
                  height: 8,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    width: `${(readyParticipants.length / participantCount) * 100}%`,
                    bgcolor: allReady ? 'success.main' : 'primary.main',
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default RoomLobby;
