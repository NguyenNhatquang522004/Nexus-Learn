import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
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
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import {
  fetchStudentProgress,
  fetchEngagementMetrics,
  fetchContentPerformance,
  fetchABTestResults,
  exportAnalytics,
  clearAnalyticsError
} from '../../store/slices/adminSlice';

import {
  ProgressChart,
  EngagementChart,
  PerformanceChart,
  MetricCard
} from './charts/AdminCharts';

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const { 
    studentProgress, 
    engagementMetrics, 
    contentPerformance, 
    abTestResults,
    loading, 
    error 
  } = useSelector(state => state.admin.analytics);

  // Filters
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);

  // A/B Test Results Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Export Dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportDateRange, setExportDateRange] = useState({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, gradeFilter, subjectFilter]);

  const loadAnalytics = () => {
    const filters = {
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      grade: gradeFilter !== 'all' ? gradeFilter : undefined,
      subject: subjectFilter !== 'all' ? subjectFilter : undefined
    };

    dispatch(fetchStudentProgress(filters));
    dispatch(fetchEngagementMetrics(filters));
    dispatch(fetchContentPerformance(filters));
    dispatch(fetchABTestResults());
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  const handleExportConfirm = async () => {
    await dispatch(exportAnalytics({
      format: exportFormat,
      startDate: exportDateRange.startDate.toISOString(),
      endDate: exportDateRange.endDate.toISOString(),
      grade: gradeFilter !== 'all' ? gradeFilter : undefined,
      subject: subjectFilter !== 'all' ? subjectFilter : undefined
    }));
    setExportDialogOpen(false);
  };

  const handleChartExport = (chartName) => (format) => {
    console.log(`Exporting ${chartName} as ${format}`);
    // In production, implement chart export using html2canvas or similar
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Transform data for charts
  const progressChartData = studentProgress?.progressOverTime || [];
  const engagementChartData = engagementMetrics?.metrics || [];
  const performanceChartData = contentPerformance?.topContent || [];

  // Calculate summary metrics
  const totalStudents = studentProgress?.summary?.totalStudents || 0;
  const averageProgress = studentProgress?.summary?.averageProgress || 0;
  const completionRate = studentProgress?.summary?.completionRate || 0;
  const activeUsersToday = engagementMetrics?.summary?.activeUsersToday || 0;
  const avgSessionDuration = engagementMetrics?.summary?.avgSessionDuration || 0;
  const dailyActiveUsers = engagementMetrics?.summary?.dailyActiveUsers || 0;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor student progress, engagement, and content performance
          </Typography>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={dateRange.startDate}
                onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={dateRange.endDate}
                onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  label="Grade"
                >
                  <MenuItem value="all">All Grades</MenuItem>
                  <MenuItem value="9">Grade 9</MenuItem>
                  <MenuItem value="10">Grade 10</MenuItem>
                  <MenuItem value="11">Grade 11</MenuItem>
                  <MenuItem value="12">Grade 12</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  label="Subject"
                >
                  <MenuItem value="all">All Subjects</MenuItem>
                  <MenuItem value="math">Mathematics</MenuItem>
                  <MenuItem value="science">Science</MenuItem>
                  <MenuItem value="english">English</MenuItem>
                  <MenuItem value="history">History</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportClick}
                fullWidth
                sx={{ height: 56 }}
              >
                Export Data
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => dispatch(clearAnalyticsError())}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Overview" />
            <Tab label="Student Progress" />
            <Tab label="Engagement" />
            <Tab label="Content Performance" />
            <Tab label="A/B Testing" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 0 && (
              <Box>
                {/* Metric Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Total Students"
                      value={totalStudents.toLocaleString()}
                      change={5.2}
                      changeType="increase"
                      icon={<PeopleIcon />}
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Avg Progress"
                      value={`${averageProgress.toFixed(1)}%`}
                      change={3.8}
                      changeType="increase"
                      icon={<TrendingUpIcon />}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Completion Rate"
                      value={`${completionRate.toFixed(1)}%`}
                      change={-1.2}
                      changeType="decrease"
                      icon={<AssessmentIcon />}
                      color="warning"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                      title="Active Users Today"
                      value={activeUsersToday.toLocaleString()}
                      change={8.5}
                      changeType="increase"
                      icon={<SpeedIcon />}
                      color="info"
                    />
                  </Grid>
                </Grid>

                {/* Charts Grid */}
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={6}>
                    <ProgressChart
                      data={progressChartData}
                      title="Student Progress Over Time"
                      height={300}
                      onRefresh={loadAnalytics}
                      onExport={handleChartExport('progress')}
                    />
                  </Grid>
                  <Grid item xs={12} lg={6}>
                    <EngagementChart
                      data={engagementChartData}
                      title="Engagement Metrics"
                      height={300}
                      onRefresh={loadAnalytics}
                      onExport={handleChartExport('engagement')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <PerformanceChart
                      data={performanceChartData}
                      title="Top Content Performance"
                      height={300}
                      onRefresh={loadAnalytics}
                      onExport={handleChartExport('performance')}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Student Progress Tab */}
            {activeTab === 1 && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <ProgressChart
                      data={progressChartData}
                      title="Progress Trends"
                      height={400}
                      onRefresh={loadAnalytics}
                      onExport={handleChartExport('progress-detailed')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Progress by Topic
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Topic</TableCell>
                              <TableCell align="right">Students Started</TableCell>
                              <TableCell align="right">Students Completed</TableCell>
                              <TableCell align="right">Avg Progress</TableCell>
                              <TableCell align="right">Completion Rate</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(studentProgress?.topicBreakdown || []).map((topic) => (
                              <TableRow key={topic.topicId}>
                                <TableCell>{topic.name}</TableCell>
                                <TableCell align="right">{topic.studentsStarted}</TableCell>
                                <TableCell align="right">{topic.studentsCompleted}</TableCell>
                                <TableCell align="right">{topic.avgProgress}%</TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={`${topic.completionRate}%`}
                                    color={topic.completionRate >= 80 ? 'success' : topic.completionRate >= 60 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Engagement Tab */}
            {activeTab === 2 && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <MetricCard
                      title="Daily Active Users"
                      value={dailyActiveUsers.toLocaleString()}
                      change={6.3}
                      changeType="increase"
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <MetricCard
                      title="Avg Session Duration"
                      value={`${avgSessionDuration} min`}
                      change={2.1}
                      changeType="increase"
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <MetricCard
                      title="Engagement Rate"
                      value={`${(engagementMetrics?.summary?.engagementRate || 0).toFixed(1)}%`}
                      change={4.5}
                      changeType="increase"
                      color="info"
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <EngagementChart
                      data={engagementChartData}
                      title="Detailed Engagement Metrics"
                      height={400}
                      onRefresh={loadAnalytics}
                      onExport={handleChartExport('engagement-detailed')}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Content Performance Tab */}
            {activeTab === 3 && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <PerformanceChart
                      data={performanceChartData}
                      title="Content Performance Comparison"
                      height={400}
                      onRefresh={loadAnalytics}
                      onExport={handleChartExport('performance-detailed')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Detailed Content Analytics
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Content Title</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell align="right">Views</TableCell>
                              <TableCell align="right">Completions</TableCell>
                              <TableCell align="right">Avg Rating</TableCell>
                              <TableCell align="right">Engagement</TableCell>
                              <TableCell align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(contentPerformance?.items || []).map((item) => (
                              <TableRow key={item.contentId}>
                                <TableCell>{item.title}</TableCell>
                                <TableCell>
                                  <Chip label={item.type} size="small" />
                                </TableCell>
                                <TableCell align="right">{item.views.toLocaleString()}</TableCell>
                                <TableCell align="right">{item.completions.toLocaleString()}</TableCell>
                                <TableCell align="right">
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    ⭐ {item.avgRating.toFixed(1)}
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={`${item.engagementScore}%`}
                                    color={item.engagementScore >= 80 ? 'success' : item.engagementScore >= 60 ? 'warning' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="View Details">
                                    <IconButton size="small">
                                      <ViewIcon />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* A/B Testing Tab */}
            {activeTab === 4 && (
              <Box>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">
                      Active A/B Tests
                    </Typography>
                    <Button variant="outlined" startIcon={<FilterIcon />}>
                      Filter Tests
                    </Button>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Test Name</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Control Group</TableCell>
                          <TableCell align="right">Variant Group</TableCell>
                          <TableCell align="right">Improvement</TableCell>
                          <TableCell align="right">Confidence</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(abTestResults?.tests || [])
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((test) => (
                            <TableRow key={test.testId}>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                  {test.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {test.description}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={test.status}
                                  color={test.status === 'active' ? 'success' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                {test.controlMetric}%
                                <Typography variant="caption" display="block" color="text.secondary">
                                  ({test.controlSampleSize} users)
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                {test.variantMetric}%
                                <Typography variant="caption" display="block" color="text.secondary">
                                  ({test.variantSampleSize} users)
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  color={test.improvement > 0 ? 'success.main' : 'error.main'}
                                  fontWeight={600}
                                >
                                  {test.improvement > 0 ? '+' : ''}{test.improvement}%
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${test.confidence}%`}
                                  color={test.confidence >= 95 ? 'success' : test.confidence >= 80 ? 'warning' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="View Details">
                                  <IconButton size="small">
                                    <ViewIcon />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component="div"
                    count={abTestResults?.tests?.length || 0}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </Paper>
              </Box>
            )}
          </>
        )}

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Export Analytics Data</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  label="Export Format"
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                  <MenuItem value="pdf">PDF Report</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </Select>
              </FormControl>

              <DatePicker
                label="Start Date"
                value={exportDateRange.startDate}
                onChange={(date) => setExportDateRange(prev => ({ ...prev, startDate: date }))}
                renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
              />

              <DatePicker
                label="End Date"
                value={exportDateRange.endDate}
                onChange={(date) => setExportDateRange(prev => ({ ...prev, endDate: date }))}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExportConfirm} 
              variant="contained"
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AnalyticsDashboard;
