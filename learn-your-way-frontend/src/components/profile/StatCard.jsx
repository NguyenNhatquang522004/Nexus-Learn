import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Avatar,
  Typography,
  Chip,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';

/**
 * StatCard Component
 * Displays a statistic with icon, label, value, and optional trend indicator
 * 
 * @param {Object} props
 * @param {ReactNode} props.icon - Icon element to display
 * @param {string} props.label - Label text for the statistic
 * @param {string|number} props.value - The statistic value to display
 * @param {string} props.color - Color theme (primary|success|info|error|warning)
 * @param {Object} props.trend - Optional trend object with direction and value
 * @param {string} props.trend.direction - Trend direction ('up' or 'down')
 * @param {string} props.trend.value - Trend value to display (e.g., '+5%')
 */
const StatCard = ({ icon, label, value, color = 'primary', trend }) => {
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Icon Avatar */}
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 56,
              height: 56,
              flexShrink: 0,
            }}
          >
            {icon}
          </Avatar>

          {/* Content */}
          <Box flex={1} sx={{ minWidth: 0 }}>
            {/* Label */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: 'block',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {label}
            </Typography>

            {/* Value */}
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                mb: trend ? 0.5 : 0,
                color: `${color}.main`,
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>

            {/* Trend Indicator */}
            {trend && (
              <Chip
                size="small"
                icon={
                  trend.direction === 'up' ? (
                    <TrendingUpIcon fontSize="small" />
                  ) : (
                    <TrendingDownIcon fontSize="small" />
                  )
                }
                label={trend.value}
                color={trend.direction === 'up' ? 'success' : 'error'}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
