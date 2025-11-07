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
  DialogContentText,
  Checkbox,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Divider,
  Stack,
  Autocomplete
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Assessment as AnalyticsIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';

import {
  fetchContentQueue,
  approveContentItem,
  rejectContentItem,
  updateContentMetadata,
  fetchContentAnalytics,
  bulkApproveContent,
  bulkRejectContent,
  setContentFilters,
  resetContentFilters,
  setSelectedContent,
  clearContentError,
  selectFilteredContentQueue
} from '../../store/slices/adminSlice';

import { useContentSubmissions } from '../../hooks/useAdminWebSocket';

const ContentManagement = () => {
  const dispatch = useDispatch();
  const {
    queue: { items, pagination },
    selectedContent,
    contentAnalytics,
    filters,
    loading,
    error
  } = useSelector(state => state.admin.content);

  const filteredContent = useSelector(selectFilteredContentQueue);

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectItemId, setRejectItemId] = useState(null);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [metadata, setMetadata] = useState({
    tags: [],
    difficulty: 'medium',
    prerequisites: [],
    estimatedTime: 0,
    learningObjectives: []
  });
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time updates for new content submissions
  useContentSubmissions((submission) => {
    console.log('New content submission:', submission);
    dispatch(fetchContentQueue({ 
      page: pagination.page, 
      limit: pagination.limit,
      status: getStatusFromTab(activeTab)
    }));
  });

  useEffect(() => {
    loadContent();
  }, [activeTab, page, rowsPerPage]);

  const getStatusFromTab = (tabIndex) => {
    const statusMap = ['pending', 'approved', 'rejected', 'all'];
    return statusMap[tabIndex];
  };

  const loadContent = () => {
    const status = getStatusFromTab(activeTab);
    dispatch(fetchContentQueue({
      page: page + 1,
      limit: rowsPerPage,
      status: status !== 'all' ? status : undefined,
      search: searchQuery || undefined
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSelectedItems([]);
  };

  const handleApprove = async (contentId, notes = '') => {
    await dispatch(approveContentItem({ 
      contentId, 
      data: { notes, approvedAt: new Date().toISOString() }
    }));
    loadContent();
  };

  const handleRejectClick = (contentId) => {
    setRejectItemId(contentId);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (rejectItemId && rejectReason.trim()) {
      await dispatch(rejectContentItem({
        contentId: rejectItemId,
        data: { reason: rejectReason, rejectedAt: new Date().toISOString() }
      }));
      setRejectDialogOpen(false);
      setRejectReason('');
      setRejectItemId(null);
      loadContent();
    }
  };

  const handleBulkApprove = async () => {
    await dispatch(bulkApproveContent({ 
      contentIds: selectedItems,
      data: { notes: 'Bulk approval', approvedAt: new Date().toISOString() }
    }));
    setSelectedItems([]);
    loadContent();
  };

  const handleBulkReject = async () => {
    await dispatch(bulkRejectContent({
      contentIds: selectedItems,
      data: { reason: 'Bulk rejection', rejectedAt: new Date().toISOString() }
    }));
    setSelectedItems([]);
    loadContent();
  };

  const handleEditMetadataClick = (content) => {
    dispatch(setSelectedContent(content));
    setMetadata({
      tags: content.tags || [],
      difficulty: content.difficulty || 'medium',
      prerequisites: content.prerequisites || [],
      estimatedTime: content.estimatedTime || 0,
      learningObjectives: content.learningObjectives || []
    });
    setMetadataDialogOpen(true);
  };

  const handleMetadataSave = async () => {
    if (selectedContent) {
      await dispatch(updateContentMetadata({
        contentId: selectedContent.id,
        metadata
      }));
      setMetadataDialogOpen(false);
      loadContent();
    }
  };

  const handleViewAnalytics = async (contentId) => {
    dispatch(setSelectedContent(items.find(item => item.id === contentId)));
    await dispatch(fetchContentAnalytics(contentId));
    setAnalyticsDialogOpen(true);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(filteredContent.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    loadContent();
  };

  const handleFilterChange = (filterName, value) => {
    dispatch(setContentFilters({ [filterName]: value }));
  };

  const handleResetFilters = () => {
    dispatch(resetContentFilters());
    setSearchQuery('');
    loadContent();
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'success',
      medium: 'info',
      hard: 'warning',
      expert: 'error'
    };
    return colors[difficulty] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Content Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review, approve, and manage learning content
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => dispatch(clearContentError())}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by title, author, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                label="Sort By"
              >
                <MenuItem value="submittedAt">Submission Date</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="author">Author</MenuItem>
                <MenuItem value="type">Content Type</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Order</InputLabel>
              <Select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                label="Order"
              >
                <MenuItem value="desc">Newest First</MenuItem>
                <MenuItem value="asc">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FilterIcon />}
              onClick={handleSearch}
              sx={{ height: 56 }}
            >
              Apply
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="text"
              fullWidth
              onClick={handleResetFilters}
              sx={{ height: 56 }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" fontWeight={600}>
              {selectedItems.length} item(s) selected
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={handleBulkApprove}
              >
                Approve Selected
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={handleBulkReject}
              >
                Reject Selected
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Pending (${items.filter(i => i.status === 'pending').length})`} />
          <Tab label={`Approved (${items.filter(i => i.status === 'approved').length})`} />
          <Tab label={`Rejected (${items.filter(i => i.status === 'rejected').length})`} />
          <Tab label="All Content" />
        </Tabs>
      </Paper>

      {/* Content Table */}
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
                      indeterminate={selectedItems.length > 0 && selectedItems.length < filteredContent.length}
                      checked={filteredContent.length > 0 && selectedItems.length === filteredContent.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Content</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Difficulty</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredContent.map((content) => (
                  <TableRow 
                    key={content.id}
                    hover
                    selected={selectedItems.includes(content.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedItems.includes(content.id)}
                        onChange={() => handleSelectItem(content.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {content.thumbnail && (
                          <Box
                            component="img"
                            src={content.thumbnail}
                            sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }}
                          />
                        )}
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {content.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {content.description?.substring(0, 80)}...
                          </Typography>
                          {content.tags && content.tags.length > 0 && (
                            <Box sx={{ mt: 0.5 }}>
                              {content.tags.slice(0, 3).map(tag => (
                                <Chip 
                                  key={tag} 
                                  label={tag} 
                                  size="small" 
                                  sx={{ mr: 0.5, height: 20, fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{content.author}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {content.authorEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={content.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={content.difficulty || 'N/A'} 
                        size="small"
                        color={getDifficultyColor(content.difficulty)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={content.status} 
                        size="small"
                        color={getStatusColor(content.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(content.submittedAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(content.submittedAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {content.status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => handleApprove(content.id)}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleRejectClick(content.id)}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="Edit Metadata">
                          <IconButton 
                            size="small"
                            onClick={() => handleEditMetadataClick(content)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Analytics">
                          <IconButton 
                            size="small"
                            onClick={() => handleViewAnalytics(content.id)}
                          >
                            <AnalyticsIcon />
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Content</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this content. This will be sent to the author.
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Content does not meet quality standards..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleRejectConfirm} 
            variant="contained"
            color="error"
            disabled={!rejectReason.trim()}
          >
            Reject Content
          </Button>
        </DialogActions>
      </Dialog>

      {/* Metadata Edit Dialog */}
      <Dialog open={metadataDialogOpen} onClose={() => setMetadataDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Content Metadata</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={metadata.tags}
              onChange={(e, newValue) => setMetadata(prev => ({ ...prev, tags: newValue }))}
              renderInput={(params) => (
                <TextField {...params} label="Tags" placeholder="Add tags..." />
              )}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                value={metadata.difficulty}
                onChange={(e) => setMetadata(prev => ({ ...prev, difficulty: e.target.value }))}
                label="Difficulty Level"
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={metadata.prerequisites}
              onChange={(e, newValue) => setMetadata(prev => ({ ...prev, prerequisites: newValue }))}
              renderInput={(params) => (
                <TextField {...params} label="Prerequisites" placeholder="Add prerequisites..." />
              )}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Estimated Time (minutes)"
              value={metadata.estimatedTime}
              onChange={(e) => setMetadata(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 0 }))}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={metadata.learningObjectives}
              onChange={(e, newValue) => setMetadata(prev => ({ ...prev, learningObjectives: newValue }))}
              renderInput={(params) => (
                <TextField {...params} label="Learning Objectives" placeholder="Add learning objectives..." />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleMetadataSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={analyticsDialogOpen} onClose={() => setAnalyticsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Content Analytics: {selectedContent?.title}</DialogTitle>
        <DialogContent>
          {contentAnalytics ? (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Views</Typography>
                      <Typography variant="h5">{contentAnalytics.views?.toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Completions</Typography>
                      <Typography variant="h5">{contentAnalytics.completions?.toLocaleString()}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Avg Rating</Typography>
                      <Typography variant="h5">⭐ {contentAnalytics.avgRating?.toFixed(1)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">Engagement</Typography>
                      <Typography variant="h5">{contentAnalytics.engagementScore}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentManagement;
