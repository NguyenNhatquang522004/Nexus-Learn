import React from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Badge,
  LinearProgress,
  Tooltip,
  Box,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

/**
 * AchievementBadge Component
 * Displays an achievement badge with locked/unlocked states and progress
 * 
 * @param {Object} props
 * @param {Object} props.achievement - Achievement data object
 * @param {string} props.achievement.id - Unique identifier
 * @param {string} props.achievement.name - Achievement name
 * @param {string} props.achievement.description - Achievement description
 * @param {string} props.achievement.icon - Icon emoji or identifier
 * @param {string} props.achievement.category - Category (learning|social|milestones)
 * @param {boolean} props.achievement.unlocked - Whether achievement is unlocked
 * @param {string} props.achievement.unlockedAt - ISO date string when unlocked
 * @param {number} props.achievement.progress - Progress percentage (0-100)
 * @param {string} props.achievement.requirement - Requirement text
 * @param {string} props.size - Badge size (small|medium|large)
 * @param {Function} props.onClick - Click handler function
 */
const AchievementBadge = ({ achievement, size = 'medium', onClick }) => {
  // Helper function to get size in pixels
  const getSizePixels = (size) => {
    const sizes = {
      small: 48,
      medium: 80,
      large: 120,
    };
    return sizes[size] || 80;
  };

  // Helper function to get category color
  const getCategoryColor = (category) => {
    const colors = {
      learning: 'primary.main',
      social: 'secondary.main',
      milestones: 'success.main',
    };
    return colors[category] || 'grey.500';
  };

  const sizePixels = getSizePixels(size);
  const isUnlocked = achievement.unlocked;
  const hasProgress = !isUnlocked && achievement.progress > 0;

  // Tooltip content
  const tooltipTitle = (
    <Box sx={{ textAlign: 'center', p: 0.5 }}>
      <Typography variant="subtitle2" fontWeight="bold">
        {achievement.name}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
        {achievement.description}
      </Typography>
      {!isUnlocked && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
          {achievement.requirement}
        </Typography>
      )}
      {isUnlocked && achievement.unlockedAt && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'success.light' }}>
          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipTitle} placement="top" arrow>
      <Card
        sx={{
          opacity: isUnlocked ? 1 : 0.5,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: onClick ? 'scale(1.05)' : 'none',
            boxShadow: onClick ? 4 : 1,
          },
          position: 'relative',
          overflow: 'visible',
        }}
        onClick={onClick}
      >
        <CardContent
          sx={{
            textAlign: 'center',
            p: size === 'small' ? 1 : 2,
            '&:last-child': {
              pb: size === 'small' ? 1 : 2,
            },
          }}
        >
          {/* Badge with status indicator */}
          <Badge
            overlap="circular"
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            badgeContent={
              isUnlocked ? (
                <CheckCircleIcon
                  sx={{
                    color: 'success.main',
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    fontSize: size === 'small' ? 16 : size === 'medium' ? 20 : 24,
                  }}
                />
              ) : hasProgress ? (
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    width: size === 'small' ? 20 : size === 'medium' ? 24 : 28,
                    height: size === 'small' ? 20 : size === 'medium' ? 24 : 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: size === 'small' ? '0.5rem' : '0.6rem',
                      fontWeight: 'bold',
                      color: 'primary.main',
                    }}
                  >
                    {achievement.progress}%
                  </Typography>
                </Box>
              ) : null
            }
          >
            {/* Avatar with icon */}
            <Avatar
              sx={{
                width: sizePixels,
                height: sizePixels,
                bgcolor: isUnlocked ? getCategoryColor(achievement.category) : 'grey.300',
                fontSize: size === 'small' ? '1.5rem' : size === 'medium' ? '2.5rem' : '3.5rem',
                border: '3px solid',
                borderColor: 'background.paper',
                boxShadow: 2,
              }}
            >
              {isUnlocked ? (
                achievement.icon || <StarIcon sx={{ fontSize: 'inherit' }} />
              ) : (
                <LockIcon sx={{ fontSize: size === 'small' ? '1.2rem' : size === 'medium' ? '2rem' : '3rem' }} />
              )}
            </Avatar>
          </Badge>

          {/* Name and progress (not shown for small size) */}
          {size !== 'small' && (
            <>
              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  display: 'block',
                  fontWeight: isUnlocked ? 600 : 400,
                  color: isUnlocked ? 'text.primary' : 'text.secondary',
                  minHeight: '2.4em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {achievement.name}
              </Typography>

              {/* Progress bar for in-progress achievements */}
              {hasProgress && (
                <LinearProgress
                  variant="determinate"
                  value={achievement.progress}
                  sx={{
                    mt: 1,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getCategoryColor(achievement.category),
                      borderRadius: 2,
                    },
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Tooltip>
  );
};

export default AchievementBadge;
