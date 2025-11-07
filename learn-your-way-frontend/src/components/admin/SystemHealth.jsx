import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Badge,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Error as UnhealthyIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Notifications as AlertIcon,
  NotificationsOff as AlertOffIcon,
  RestartAlt as RestartIcon,
  Speed as LatencyIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import {
  fetchAgentStatuses,
  fetchAPILatencyMetrics,
  fetchErrorLogs,
  fetchResourceUsage,
  fetchSystemAlerts,
  acknowledgeAlert,
  configureAlerts,
  restartAgent,
  clearSystemError
} from '../../store/slices/adminSlice';

import {
  useAdminWebSocket,
  useAgentStatus,
  useSystemAlerts,
  useErrorLogs
} from '../../hooks/useAdminWebSocket';

import { LatencyChart } from './charts/AdminCharts';

const SystemHealth = () => {
  const dispatch = useDispatch();
  const {
    agentStatuses,
    latencyMetrics,
    errorLogs,
    resourceUsage,
    alerts,
    alertConfig,
    loading,
    error
  } = useSelector(state => state.admin.system);

  // WebSocket for real-time updates
  const { connected, subscribe, unsubscribe } = useAdminWebSocket({
    autoConnect: true,
    subscribeToMetrics: ['agent_status', 'system_health', 'error_logs']
  });

  // Real-time hooks
  useAgentStatus(null, (update) => {
    console.log('Agent status update:', update);
  });

  useSystemAlerts({ severity: ['critical', 'warning'] }, (alert) => {
    console.log('New system alert:', alert);
  });

  useErrorLogs({ level: 'error' }, (log) => {
    console.log('New error log:', log);
  });

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertThresholds, setAlertThresholds] = useState({
    latencyThreshold: 1000,
    errorRateThreshold: 5,
    cpuThreshold: 80,
    memoryThreshold: 85
  });
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);
  const [restartAgentName, setRestartAgentName] = useState('');
  const [errorLogPage, setErrorLogPage] = useState(0);
  const [errorLogRowsPerPage, setErrorLogRowsPerPage] = useState(10);
  const [errorLogFilters, setErrorLogFilters] = useState({
    level: 'all',
    agent: 'all'
  });

  useEffect(() => {
    loadSystemHealth();
    const interval = setInterval(loadSystemHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemHealth = () => {
    dispatch(fetchAgentStatuses());
    dispatch(fetchAPILatencyMetrics({ timeRange: '1h' }));
    dispatch(fetchErrorLogs({ 
      page: errorLogPage + 1, 
      limit: errorLogRowsPerPage,
      level: errorLogFilters.level !== 'all' ? errorLogFilters.level : undefined,
      agent: errorLogFilters.agent !== 'all' ? errorLogFilters.agent : undefined
    }));
    dispatch(fetchResourceUsage());
    dispatch(fetchSystemAlerts({ unacknowledged: true }));
  };

  const handleRefresh = () => {
    loadSystemHealth();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRestartAgentClick = (agentName) => {
    setRestartAgentName(agentName);
    setRestartDialogOpen(true);
  };

  const handleRestartAgentConfirm = async () => {
    await dispatch(restartAgent(restartAgentName));
    setRestartDialogOpen(false);
    setRestartAgentName('');
    setTimeout(() => dispatch(fetchAgentStatuses()), 5000);
  };

  const handleAcknowledgeAlert = async (alertId) => {
    await dispatch(acknowledgeAlert({
      alertId,
      data: { acknowledgedAt: new Date().toISOString() }
    }));
    dispatch(fetchSystemAlerts({ unacknowledged: true }));
  };

  const handleConfigureAlertsClick = () => {
    setAlertThresholds({
      latencyThreshold: alertConfig?.latencyThreshold || 1000,
      errorRateThreshold: alertConfig?.errorRateThreshold || 5,
      cpuThreshold: alertConfig?.cpuThreshold || 80,
      memoryThreshold: alertConfig?.memoryThreshold || 85
    });
    setAlertDialogOpen(true);
  };

  const handleConfigureAlertsSave = async () => {
    await dispatch(configureAlerts(alertThresholds));
    setAlertDialogOpen(false);
  };

  const handleErrorLogPageChange = (event, newPage) => {
    setErrorLogPage(newPage);
  };

  const handleErrorLogRowsPerPageChange = (event) => {
    setErrorLogRowsPerPage(parseInt(event.target.value, 10));
    setErrorLogPage(0);
  };

  const getStatusColor = (healthy) => {
    return healthy ? 'success' : 'error';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'error',
      warning: 'warning',
      info: 'info'
    };
    return colors[severity] || 'default';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      critical: <ErrorIcon />,
      warning: <WarningIcon />,
      info: <InfoIcon />
    };
    return icons[severity] || <InfoIcon />;
  };

  const getLatencyColor = (latency) => {
    if (latency < 200) return 'success';
    if (latency < 500) return 'warning';
    return 'error';
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calculate summary metrics
  const totalAgents = agentStatuses?.agents?.length || 0;
  const healthyAgents = agentStatuses?.summary?.healthy || 0;
  const unhealthyAgents = agentStatuses?.summary?.unhealthy || 0;
  const avgLatency = agentStatuses?.summary?.avgLatency || 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            System Health Monitor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor all 20 microservices, API latency, errors, and resource usage
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip 
            icon={connected ? <HealthyIcon /> : <UnhealthyIcon />}
            label={connected ? 'Real-time Connected' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={handleConfigureAlertsClick}
          >
            Configure Alerts
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => dispatch(clearSystemError())}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: healthyAgents === totalAgents ? 'success.50' : 'error.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Agent Health
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {healthyAgents}/{totalAgents}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {unhealthyAgents} unhealthy
                  </Typography>
                </Box>
                <HealthyIcon sx={{ fontSize: 48, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg Latency
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {avgLatency.toFixed(0)}ms
                  </Typography>
                  <Chip 
                    label={avgLatency < 500 ? 'Good' : 'High'} 
                    size="small"
                    color={getLatencyColor(avgLatency)}
                  />
                </Box>
                <LatencyIcon sx={{ fontSize: 48, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Alerts
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {alerts?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alerts?.filter(a => a.severity === 'critical').length || 0} critical
                  </Typography>
                </Box>
                <Badge badgeContent={alerts?.length || 0} color="error">
                  <AlertIcon sx={{ fontSize: 48, color: 'warning.main' }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    CPU Usage
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {resourceUsage?.cpu?.toFixed(1) || 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={resourceUsage?.cpu || 0} 
                    sx={{ mt: 1 }}
                    color={resourceUsage?.cpu > 80 ? 'error' : 'primary'}
                  />
                </Box>
                <MemoryIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Agent Status" />
          <Tab label="API Latency" />
          <Tab label="Error Logs" />
          <Tab label="Alerts" />
          <Tab label="Resources" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {loading && activeTab === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Agent Status Tab */}
          {activeTab === 0 && (
            <Grid container spacing={2}>
              {agentStatuses?.agents?.map((agent) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={agent.name}>
                  <Card 
                    sx={{ 
                      borderLeft: 4, 
                      borderColor: agent.healthy ? 'success.main' : 'error.main',
                      height: '100%'
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" fontSize="1rem" fontWeight={600}>
                          {agent.name}
                        </Typography>
                        <Chip 
                          icon={agent.healthy ? <HealthyIcon /> : <UnhealthyIcon />}
                          label={agent.status}
                          size="small"
                          color={getStatusColor(agent.healthy)}
                        />
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Latency
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {agent.latency}ms
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Uptime
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatUptime(agent.uptime)}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Version
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {agent.version}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Last check: {new Date(agent.lastCheck).toLocaleTimeString()}
                        </Typography>
                        {!agent.healthy && (
                          <Tooltip title="Restart Agent">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleRestartAgentClick(agent.name)}
                            >
                              <RestartIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>

                      {agent.error && (
                        <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                          <Typography variant="caption">
                            {agent.error}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* API Latency Tab */}
          {activeTab === 1 && (
            <Box>
              <LatencyChart
                data={latencyMetrics?.data || []}
                title="API Latency Metrics (Last Hour)"
                height={400}
                onRefresh={handleRefresh}
              />
            </Box>
          )}

          {/* Error Logs Tab */}
          {activeTab === 2 && (
            <Box>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Level</InputLabel>
                      <Select
                        value={errorLogFilters.level}
                        onChange={(e) => setErrorLogFilters(prev => ({ ...prev, level: e.target.value }))}
                        label="Level"
                      >
                        <MenuItem value="all">All Levels</MenuItem>
                        <MenuItem value="error">Error</MenuItem>
                        <MenuItem value="warning">Warning</MenuItem>
                        <MenuItem value="info">Info</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Agent</InputLabel>
                      <Select
                        value={errorLogFilters.agent}
                        onChange={(e) => setErrorLogFilters(prev => ({ ...prev, agent: e.target.value }))}
                        label="Agent"
                      >
                        <MenuItem value="all">All Agents</MenuItem>
                        {agentStatuses?.agents?.map(agent => (
                          <MenuItem key={agent.name} value={agent.name}>{agent.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={12} md={4}>
                    <Button 
                      variant="outlined" 
                      fullWidth
                      onClick={handleRefresh}
                    >
                      Apply Filters
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Level</TableCell>
                        <TableCell>Agent</TableCell>
                        <TableCell>Message</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(errorLogs?.logs || []).map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(log.timestamp).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={log.level} 
                              size="small"
                              color={getSeverityColor(log.level)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {log.agent}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.message}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {log.stackTrace && (
                              <Tooltip title={log.stackTrace}>
                                <Chip label="View Stack" size="small" variant="outlined" />
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={errorLogs?.pagination?.total || 0}
                  page={errorLogPage}
                  onPageChange={handleErrorLogPageChange}
                  rowsPerPage={errorLogRowsPerPage}
                  onRowsPerPageChange={handleErrorLogRowsPerPageChange}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </Paper>
            </Box>
          )}

          {/* Alerts Tab */}
          {activeTab === 3 && (
            <Paper>
              {alerts && alerts.length > 0 ? (
                <List>
                  {alerts.map((alert) => (
                    <React.Fragment key={alert.id}>
                      <ListItem
                        sx={{ py: 2 }}
                        secondaryAction={
                          !alert.acknowledged && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AlertOffIcon />}
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )
                        }
                      >
                        <Box sx={{ display: 'flex', gap: 2, width: '100%', alignItems: 'flex-start' }}>
                          <Box sx={{ mt: 0.5 }}>
                            {getSeverityIcon(alert.severity)}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {alert.title}
                              </Typography>
                              <Chip 
                                label={alert.severity} 
                                size="small"
                                color={getSeverityColor(alert.severity)}
                              />
                              {alert.acknowledged && (
                                <Chip label="Acknowledged" size="small" variant="outlined" />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {alert.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(alert.timestamp).toLocaleString()}
                              {alert.agent && ` • Agent: ${alert.agent}`}
                            </Typography>
                          </Box>
                        </Box>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <AlertOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No active alerts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All systems are running normally
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {/* Resources Tab */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      CPU Usage
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={resourceUsage?.cpu || 0}
                          sx={{ height: 10, borderRadius: 1 }}
                          color={resourceUsage?.cpu > 80 ? 'error' : 'primary'}
                        />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {resourceUsage?.cpu?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Threshold: {alertThresholds.cpuThreshold}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Memory Usage
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={resourceUsage?.memory || 0}
                          sx={{ height: 10, borderRadius: 1 }}
                          color={resourceUsage?.memory > 85 ? 'error' : 'success'}
                        />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {resourceUsage?.memory?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Threshold: {alertThresholds.memoryThreshold}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Disk Usage
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={resourceUsage?.disk || 0}
                          sx={{ height: 10, borderRadius: 1 }}
                          color={resourceUsage?.disk > 85 ? 'warning' : 'info'}
                        />
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {resourceUsage?.disk?.toFixed(1) || 0}%
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {resourceUsage?.diskUsed?.toFixed(1) || 0} GB / {resourceUsage?.diskTotal?.toFixed(1) || 0} GB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Network I/O
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Inbound
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {resourceUsage?.networkIn?.toFixed(2) || 0} MB/s
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Outbound
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {resourceUsage?.networkOut?.toFixed(2) || 0} MB/s
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Configure Alerts Dialog */}
      <Dialog open={alertDialogOpen} onClose={() => setAlertDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Alert Thresholds</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="number"
              label="Latency Threshold (ms)"
              value={alertThresholds.latencyThreshold}
              onChange={(e) => setAlertThresholds(prev => ({ ...prev, latencyThreshold: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Error Rate Threshold (%)"
              value={alertThresholds.errorRateThreshold}
              onChange={(e) => setAlertThresholds(prev => ({ ...prev, errorRateThreshold: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="CPU Threshold (%)"
              value={alertThresholds.cpuThreshold}
              onChange={(e) => setAlertThresholds(prev => ({ ...prev, cpuThreshold: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="Memory Threshold (%)"
              value={alertThresholds.memoryThreshold}
              onChange={(e) => setAlertThresholds(prev => ({ ...prev, memoryThreshold: parseInt(e.target.value) }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfigureAlertsSave} variant="contained">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restart Agent Dialog */}
      <Dialog open={restartDialogOpen} onClose={() => setRestartDialogOpen(false)}>
        <DialogTitle>Restart Agent</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restart the <strong>{restartAgentName}</strong> agent? 
            This may cause temporary service disruption.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestartDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRestartAgentConfirm} 
            variant="contained"
            color="warning"
            startIcon={<RestartIcon />}
          >
            Restart Agent
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemHealth;
