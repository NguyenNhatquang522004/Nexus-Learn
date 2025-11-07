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
  Checkbox,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Badge
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Assignment as AssignIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  Warning as WarningIcon,
  TrendingUp as ProgressIcon
} from '@mui/icons-material';

import {
  fetchStudentRoster,
  fetchStudentProgressReport,
  fetchInterventionTriggers,
  exportStudents,
  sendBulkEmailToStudents,
  assignContent,
  updateStudentStatus,
  setUserFilters,
  resetUserFilters,
  setSelectedStudent,
  clearUsersError,
  selectFilteredStudentRoster
} from '../../store/slices/adminSlice';

import { useUserActivity } from '../../hooks/useAdminWebSocket';
import { ProgressChart } from './charts/AdminCharts';

const UserManagement = () => {
  const dispatch = useDispatch();
  const {
    roster: { students, pagination },
    selectedStudent,
    progressReport,
    interventionTriggers,
    filters,
    loading,
    error
  } = useSelector(state => state.admin.users);

  const filteredStudents = useSelector(selectFilteredStudentRoster);

  // Local state
  const [selectedItems, setSelectedItems] = useState([]);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', body: '' });
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    contentId: '',
    dueDate: '',
    priority: 'normal'
  });
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('active');
  const [statusChangeStudentId, setStatusChangeStudentId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time user activity updates
  useUserActivity((activity) => {
    console.log('User activity update:', activity);
    // Optionally refresh roster when activity detected
  });

  useEffect(() => {
    loadStudents();
    loadInterventionTriggers();
  }, [page, rowsPerPage]);

  const loadStudents = () => {
    dispatch(fetchStudentRoster({
      page: page + 1,
      limit: rowsPerPage,
      search: searchQuery || undefined,
      status: filters.status !== 'all' ? filters.status : undefined
    }));
  };

  const loadInterventionTriggers = () => {
    dispatch(fetchInterventionTriggers({
      threshold: 'medium',
      limit: 20
    }));
  };

  const handleSearch = () => {
    setPage(0);
    loadStudents();
  };

  const handleFilterChange = (filterName, value) => {
    dispatch(setUserFilters({ [filterName]: value }));
    setPage(0);
    setTimeout(loadStudents, 100);
  };

  const handleResetFilters = () => {
    dispatch(resetUserFilters());
    setSearchQuery('');
    setPage(0);
    setTimeout(loadStudents, 100);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(filteredStudents.map(student => student.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (studentId) => {
    setSelectedItems(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleViewProgress = async (studentId) => {
    dispatch(setSelectedStudent(filteredStudents.find(s => s.id === studentId)));
    await dispatch(fetchStudentProgressReport({ 
      studentId,
      params: {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      }
    }));
    setProgressDialogOpen(true);
  };

  const handleSendEmailClick = () => {
    setEmailDialogOpen(true);
  };

  const handleSendEmailConfirm = async () => {
    await dispatch(sendBulkEmailToStudents({
      studentIds: selectedItems,
      emailData: {
        ...emailData,
        sentAt: new Date().toISOString()
      }
    }));
    setEmailDialogOpen(false);
    setEmailData({ subject: '', body: '' });
    setSelectedItems([]);
  };

  const handleAssignContentClick = () => {
    setAssignDialogOpen(true);
  };

  const handleAssignContentConfirm = async () => {
    await dispatch(assignContent({
      studentIds: selectedItems,
      assignment: {
        ...assignmentData,
        assignedAt: new Date().toISOString()
      }
    }));
    setAssignDialogOpen(false);
    setAssignmentData({ contentId: '', dueDate: '', priority: 'normal' });
    setSelectedItems([]);
  };

  const handleExportStudents = async () => {
    await dispatch(exportStudents({
      studentIds: selectedItems.length > 0 ? selectedItems : undefined,
      options: {
        format: 'csv',
        includeProgress: true,
        includeActivity: true
      }
    }));
  };

  const handleStatusChangeClick = (studentId, currentStatus) => {
    setStatusChangeStudentId(studentId);
    setNewStatus(currentStatus === 'active' ? 'suspended' : 'active');
    setStatusChangeDialogOpen(true);
  };

  const handleStatusChangeConfirm = async () => {
    if (statusChangeStudentId) {
      await dispatch(updateStudentStatus({
        studentId: statusChangeStudentId,
        status: newStatus,
        updatedAt: new Date().toISOString()
      }));
      setStatusChangeDialogOpen(false);
      setStatusChangeStudentId(null);
      loadStudents();
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      suspended: 'error',
      inactive: 'warning'
    };
    return colors[status] || 'default';
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      critical: 'error'
    };
    return colors[level] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage students, track progress, and send interventions
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => dispatch(clearUsersError())}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          {/* Search and Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search by name, email, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="lastActive">Last Active</MenuItem>
                    <MenuItem value="progress">Progress</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleSearch}
                  sx={{ height: 56 }}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="body1" fontWeight={600}>
                  {selectedItems.length} student(s) selected
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<EmailIcon />}
                    onClick={handleSendEmailClick}
                  >
                    Send Email
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AssignIcon />}
                    onClick={handleAssignContentClick}
                  >
                    Assign Content
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportStudents}
                  >
                    Export
                  </Button>
                </Stack>
              </Box>
            </Paper>
          )}

          {/* Student Roster Table */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedItems.length > 0 && selectedItems.length < filteredStudents.length}
                          checked={filteredStudents.length > 0 && selectedItems.length === filteredStudents.length}
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Progress</TableCell>
                      <TableCell>Last Active</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow 
                        key={student.id}
                        hover
                        selected={selectedItems.includes(student.id)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedItems.includes(student.id)}
                            onChange={() => handleSelectItem(student.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={student.avatar} sx={{ width: 40, height: 40 }}>
                              {student.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {student.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {student.email}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                ID: {student.studentId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={student.status} 
                            size="small"
                            color={getStatusColor(student.status)}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            <Box sx={{ width: 100 }}>
                              <Box 
                                sx={{ 
                                  height: 8, 
                                  bgcolor: 'grey.200', 
                                  borderRadius: 1,
                                  overflow: 'hidden'
                                }}
                              >
                                <Box 
                                  sx={{ 
                                    height: '100%', 
                                    bgcolor: 'primary.main',
                                    width: `${student.overallProgress || 0}%`,
                                    transition: 'width 0.3s'
                                  }}
                                />
                              </Box>
                            </Box>
                            <Typography variant="body2" fontWeight={600}>
                              {student.overallProgress || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(student.lastActive).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(student.lastActive).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="View Progress">
                              <IconButton 
                                size="small"
                                onClick={() => handleViewProgress(student.id)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={student.status === 'active' ? 'Suspend' : 'Activate'}>
                              <IconButton 
                                size="small"
                                color={student.status === 'active' ? 'error' : 'success'}
                                onClick={() => handleStatusChangeClick(student.id, student.status)}
                              >
                                {student.status === 'active' ? <BlockIcon /> : <ActivateIcon />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={pagination.total || 0}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </Paper>
          )}
        </Grid>

        {/* Sidebar - Intervention Triggers */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WarningIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                Intervention Alerts
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Students who may need additional support
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {interventionTriggers?.triggers?.length > 0 ? (
              <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                {interventionTriggers.triggers.map((trigger) => (
                  <ListItem 
                    key={trigger.studentId}
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      mb: 1, 
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.9rem' }}>
                            {trigger.studentName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {trigger.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {trigger.studentEmail}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label={trigger.riskLevel} 
                          size="small"
                          color={getRiskLevelColor(trigger.riskLevel)}
                        />
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        {trigger.reason}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {trigger.metrics?.map((metric, idx) => (
                          <Chip 
                            key={idx}
                            label={`${metric.name}: ${metric.value}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>

                      <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleViewProgress(trigger.studentId)}
                          fullWidth
                        >
                          View Details
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => {
                            setSelectedItems([trigger.studentId]);
                            handleSendEmailClick();
                          }}
                          fullWidth
                        >
                          Contact
                        </Button>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No intervention alerts at this time
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Send Email to {selectedItems.length} Student(s)</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Subject"
              value={emailData.subject}
              onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Message Body"
              value={emailData.body}
              onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Enter your message here..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendEmailConfirm} 
            variant="contained"
            disabled={!emailData.subject || !emailData.body}
            startIcon={<EmailIcon />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Content Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Content to {selectedItems.length} Student(s)</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Content ID"
              value={assignmentData.contentId}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, contentId: e.target.value }))}
              sx={{ mb: 2 }}
              placeholder="Enter content ID..."
            />
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              value={assignmentData.dueDate}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={assignmentData.priority}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, priority: e.target.value }))}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignContentConfirm} 
            variant="contained"
            disabled={!assignmentData.contentId || !assignmentData.dueDate}
            startIcon={<AssignIcon />}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Report Dialog */}
      <Dialog open={progressDialogOpen} onClose={() => setProgressDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Progress Report: {selectedStudent?.name}
        </DialogTitle>
        <DialogContent>
          {progressReport ? (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Overall Progress</Typography>
                      <Typography variant="h4" color="primary.main">
                        {progressReport.overallProgress}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Completed</Typography>
                      <Typography variant="h4" color="success.main">
                        {progressReport.completedCourses}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">In Progress</Typography>
                      <Typography variant="h4" color="info.main">
                        {progressReport.inProgressCourses}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Avg Score</Typography>
                      <Typography variant="h4" color="warning.main">
                        {progressReport.avgScore}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box sx={{ mb: 3 }}>
                <ProgressChart
                  data={progressReport.progressTimeline || []}
                  title="Progress Over Time"
                  height={300}
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                Course Progress
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell align="right">Progress</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {progressReport.courseDetails?.map((course) => (
                      <TableRow key={course.courseId}>
                        <TableCell>{course.courseName}</TableCell>
                        <TableCell align="right">{course.progress}%</TableCell>
                        <TableCell align="right">{course.score}%</TableCell>
                        <TableCell>
                          <Chip 
                            label={course.status} 
                            size="small"
                            color={course.status === 'completed' ? 'success' : 'info'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={statusChangeDialogOpen} onClose={() => setStatusChangeDialogOpen(false)}>
        <DialogTitle>
          Confirm Status Change
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {newStatus === 'active' ? 'activate' : 'suspend'} this student's account?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusChangeDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusChangeConfirm} 
            variant="contained"
            color={newStatus === 'active' ? 'success' : 'error'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
