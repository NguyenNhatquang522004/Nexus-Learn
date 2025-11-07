import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Stack,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  Whatshot as FireIcon
} from '@mui/icons-material';
import {
  fetchLeaderboard,
  setLeaderboardFilter
} from '../../store/slices/collaborationSlice';

const MEDAL_COLORS = {
  1: '#FFD700', // Gold
  2: '#C0C0C0', // Silver
  3: '#CD7F32'  // Bronze
};

const MEDAL_ICONS = {
  1: '🥇',
  2: '🥈',
  3: '🥉'
};

const LeaderboardRow = ({ user, rank, highlighted, showMedal }) => {
  const isTopThree = rank <= 3;
  
  return (
    <Card
      sx={{
        mb: 1,
        transition: 'all 0.3s ease',
        border: highlighted ? 2 : 1,
        borderColor: highlighted ? 'primary.main' : 'divider',
        bgcolor: highlighted ? 'primary.lighter' : 'background.paper',
        '&:hover': {
          transform: 'translateX(4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ py: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Rank */}
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: isTopThree ? MEDAL_COLORS[rank] : 'action.hover',
              fontWeight: 'bold',
              fontSize: isTopThree ? '1.5rem' : '1.2rem',
              color: isTopThree ? 'white' : 'text.primary'
            }}
          >
            {showMedal && isTopThree ? MEDAL_ICONS[rank] : rank}
          </Box>

          {/* Avatar */}
          <Avatar
            src={user.avatar}
            sx={{
              width: 48,
              height: 48,
              border: isTopThree ? 2 : 0,
              borderColor: MEDAL_COLORS[rank]
            }}
          >
            {user.name?.[0]?.toUpperCase()}
          </Avatar>

          {/* User Info */}
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" fontWeight="bold">
                {user.name}
              </Typography>
              {highlighted && (
                <Chip label="You" size="small" color="primary" />
              )}
              {user.streak && user.streak >= 3 && (
                <Chip
                  icon={<FireIcon />}
                  label={`${user.streak} day streak`}
                  size="small"
                  color="error"
                />
              )}
            </Stack>
            
            {user.level && (
              <Typography variant="caption" color="text.secondary">
                Level {user.level}
              </Typography>
            )}
          </Box>

          {/* Score */}
          <Box textAlign="right">
            <Typography variant="h6" fontWeight="bold" color="primary">
              {user.score.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              points
            </Typography>
            
            {user.change && (
              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                <TrendingIcon
                  sx={{
                    fontSize: 16,
                    color: user.change > 0 ? 'success.main' : 'error.main'
                  }}
                />
                <Typography
                  variant="caption"
                  color={user.change > 0 ? 'success.main' : 'error.main'}
                >
                  {user.change > 0 ? '+' : ''}{user.change}
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const MyPositionCard = ({ position, user, totalParticipants }) => {
  if (!position) return null;

  const percentile = Math.round((1 - (position.rank - 1) / totalParticipants) * 100);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        bgcolor: 'primary.main',
        color: 'white',
        mb: 3,
        borderRadius: 2
      }}
    >
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom>
              Your Position
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              You're in the top {percentile}%
            </Typography>
          </Box>
          <Box
            sx={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              border: '3px solid white'
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              #{position.rank}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={3}>
          <Box flex={1}>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Current Score
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {position.score.toLocaleString()}
            </Typography>
          </Box>

          {position.nextRank && (
            <Box flex={1}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Points to next rank
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {(position.nextRank.score - position.score).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Stack>

        {position.nextRank && (
          <Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Progress to #{position.rank - 1}
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {Math.round((position.score / position.nextRank.score) * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(position.score / position.nextRank.score) * 100}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white'
                }
              }}
            />
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

const Leaderboard = () => {
  const dispatch = useDispatch();
  const {
    roomId,
    leaderboard,
    leaderboardFilter,
    myPosition,
    myParticipantId,
    loading
  } = useSelector((state) => state.collaboration);

  useEffect(() => {
    if (roomId) {
      dispatch(fetchLeaderboard({ roomId, filter: leaderboardFilter }));
    }
  }, [dispatch, roomId, leaderboardFilter]);

  const handleFilterChange = (event) => {
    dispatch(setLeaderboardFilter(event.target.value));
  };

  const totalParticipants = leaderboard.length;

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <TrophyIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Leaderboard
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                See how you rank among your peers
              </Typography>
            </Box>
          </Box>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel
              id="filter-label"
              sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}
            >
              Filter
            </InputLabel>
            <Select
              labelId="filter-label"
              value={leaderboardFilter}
              onChange={handleFilterChange}
              label="Filter"
              sx={{
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white'
                },
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* My Position Card */}
      {myPosition && (
        <MyPositionCard
          position={myPosition}
          user={leaderboard.find(u => u.id === myParticipantId)}
          totalParticipants={totalParticipants}
        />
      )}

      {/* Leaderboard List */}
      <Box>
        {loading.leaderboard ? (
          <Box display="flex" justifyContent="center" py={4}>
            <LinearProgress sx={{ width: '50%' }} />
          </Box>
        ) : leaderboard.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <StarIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No rankings yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete activities to see your ranking
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  gap: 2,
                  mb: 4
                }}
              >
                {/* 2nd Place */}
                <Box textAlign="center" sx={{ flex: 1, maxWidth: 150 }}>
                  <Box
                    sx={{
                      height: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      bgcolor: MEDAL_COLORS[2],
                      borderRadius: '8px 8px 0 0',
                      p: 2,
                      position: 'relative'
                    }}
                  >
                    <Avatar
                      src={leaderboard[1]?.avatar}
                      sx={{
                        width: 56,
                        height: 56,
                        border: '3px solid white',
                        position: 'absolute',
                        top: -28
                      }}
                    >
                      {leaderboard[1]?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold" color="white">
                      2
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" noWrap sx={{ mt: 1 }}>
                    {leaderboard[1]?.name}
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {leaderboard[1]?.score.toLocaleString()}
                  </Typography>
                </Box>

                {/* 1st Place */}
                <Box textAlign="center" sx={{ flex: 1, maxWidth: 150 }}>
                  <Box
                    sx={{
                      height: 140,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      bgcolor: MEDAL_COLORS[1],
                      borderRadius: '8px 8px 0 0',
                      p: 2,
                      position: 'relative'
                    }}
                  >
                    <TrophyIcon
                      sx={{
                        position: 'absolute',
                        top: -16,
                        fontSize: 32,
                        color: MEDAL_COLORS[1]
                      }}
                    />
                    <Avatar
                      src={leaderboard[0]?.avatar}
                      sx={{
                        width: 64,
                        height: 64,
                        border: '4px solid white',
                        position: 'absolute',
                        top: -32
                      }}
                    >
                      {leaderboard[0]?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="h3" fontWeight="bold" color="white">
                      1
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ mt: 1 }}>
                    {leaderboard[0]?.name}
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {leaderboard[0]?.score.toLocaleString()}
                  </Typography>
                </Box>

                {/* 3rd Place */}
                <Box textAlign="center" sx={{ flex: 1, maxWidth: 150 }}>
                  <Box
                    sx={{
                      height: 80,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      bgcolor: MEDAL_COLORS[3],
                      borderRadius: '8px 8px 0 0',
                      p: 2,
                      position: 'relative'
                    }}
                  >
                    <Avatar
                      src={leaderboard[2]?.avatar}
                      sx={{
                        width: 48,
                        height: 48,
                        border: '3px solid white',
                        position: 'absolute',
                        top: -24
                      }}
                    >
                      {leaderboard[2]?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="h5" fontWeight="bold" color="white">
                      3
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" noWrap sx={{ mt: 1 }}>
                    {leaderboard[2]?.name}
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {leaderboard[2]?.score.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Rest of Leaderboard */}
            <Box>
              {leaderboard.map((user, index) => (
                <LeaderboardRow
                  key={user.id}
                  user={user}
                  rank={index + 1}
                  highlighted={user.id === myParticipantId}
                  showMedal={index < 3}
                />
              ))}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Leaderboard;
