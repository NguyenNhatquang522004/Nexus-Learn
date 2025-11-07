import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Paper, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import {
  MoreVert as MoreIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

/**
 * Progress Chart - Shows student progress over time
 */
export const ProgressChart = ({ data, title, height = 300, onRefresh, onExport }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format) => {
    handleMenuClose();
    onExport?.(format);
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Box>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          )}
          {onExport && (
            <>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => handleExport('png')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as PNG
                </MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as CSV
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#667eea"
            fillOpacity={1}
            fill="url(#progressGradient)"
            strokeWidth={2}
            name="Completed"
          />
          <Area
            type="monotone"
            dataKey="inProgress"
            stroke="#f59e0b"
            fillOpacity={0.3}
            fill="#f59e0b"
            strokeWidth={2}
            name="In Progress"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

/**
 * Engagement Chart - Shows user engagement metrics
 */
export const EngagementChart = ({ data, title, height = 300, onRefresh, onExport }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format) => {
    handleMenuClose();
    onExport?.(format);
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Box>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          )}
          {onExport && (
            <>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => handleExport('png')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as PNG
                </MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as CSV
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="activeUsers"
            stroke="#667eea"
            strokeWidth={3}
            dot={{ fill: '#667eea', r: 4 }}
            activeDot={{ r: 6 }}
            name="Active Users"
          />
          <Line
            type="monotone"
            dataKey="sessionDuration"
            stroke="#4ade80"
            strokeWidth={3}
            dot={{ fill: '#4ade80', r: 4 }}
            activeDot={{ r: 6 }}
            name="Avg Session (min)"
          />
          <Line
            type="monotone"
            dataKey="completionRate"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
            name="Completion Rate (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

/**
 * Performance Chart - Shows content performance metrics
 */
export const PerformanceChart = ({ data, title, height = 300, onRefresh, onExport }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format) => {
    handleMenuClose();
    onExport?.(format);
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Box>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          )}
          {onExport && (
            <>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => handleExport('png')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as PNG
                </MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as CSV
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="name" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="views" 
            fill="#667eea" 
            radius={[8, 8, 0, 0]}
            name="Views"
          />
          <Bar 
            dataKey="completions" 
            fill="#4ade80" 
            radius={[8, 8, 0, 0]}
            name="Completions"
          />
          <Bar 
            dataKey="rating" 
            fill="#f59e0b" 
            radius={[8, 8, 0, 0]}
            name="Avg Rating"
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

/**
 * Latency Chart - Shows API latency metrics
 */
export const LatencyChart = ({ data, title, height = 300, onRefresh, onExport }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format) => {
    handleMenuClose();
    onExport?.(format);
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Box>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          )}
          {onExport && (
            <>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => handleExport('png')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as PNG
                </MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as CSV
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="timestamp" 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '12px' }}
            label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="p95"
            stroke="#ef4444"
            fillOpacity={0.2}
            fill="#ef4444"
            strokeWidth={2}
            name="P95"
          />
          <Area
            type="monotone"
            dataKey="p50"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#latencyGradient)"
            strokeWidth={2}
            name="P50 (Median)"
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ fill: '#4ade80', r: 3 }}
            name="Average"
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

/**
 * Distribution Chart - Shows distribution of values (e.g., completion rates by topic)
 */
export const DistributionChart = ({ data, title, height = 300, onRefresh, onExport }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4ade80', '#f59e0b', '#ef4444', '#3b82f6'];

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = (format) => {
    handleMenuClose();
    onExport?.(format);
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Box>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          )}
          {onExport && (
            <>
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => handleExport('png')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as PNG
                </MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>
                  <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                  Export as CSV
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};

/**
 * Metric Card - Shows a single metric with trend
 */
export const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'increase', 
  icon,
  color = 'primary'
}) => {
  const colorMap = {
    primary: '#667eea',
    success: '#4ade80',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  };

  const trendColor = changeType === 'increase' ? '#4ade80' : '#ef4444';

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color={colorMap[color]}>
            {value}
          </Typography>
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: trendColor,
                  fontWeight: 600
                }}
              >
                {changeType === 'increase' ? '↑' : '↓'} {Math.abs(change)}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                vs last period
              </Typography>
            </Box>
          )}
        </Box>
        {icon && (
          <Box 
            sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: 2,
              bgcolor: `${colorMap[color]}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colorMap[color]
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default {
  ProgressChart,
  EngagementChart,
  PerformanceChart,
  LatencyChart,
  DistributionChart,
  MetricCard
};
