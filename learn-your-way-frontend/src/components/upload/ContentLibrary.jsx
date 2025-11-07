import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchContentLibrary,
  deleteContent,
  duplicateContent,
  updateLibraryFilter,
  setSelectedContent
} from '../../store/slices/uploadSlice';
import {
  Search,
  FilterList,
  Sort,
  Edit,
  Delete,
  FileCopy,
  Share,
  Visibility,
  TrendingUp,
  CheckCircle
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Grid,
  Chip,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Skeleton,
  InputAdornment,
  Tooltip,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Subjects for filter
const SUBJECTS = [
  'All Subjects',
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science'
];

// Status options
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

// Sort options
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'title', label: 'Title' },
  { value: 'views', label: 'Views' }
];

const ITEMS_PER_PAGE = 12;

const ContentLibrary = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, content: null });
  const [shareDialog, setShareDialog] = useState({ open: false, content: null });
  const [anchorEl, setAnchorEl] = useState(null);

  const { contentLibrary, libraryFilters, loading } = useSelector((state) => state.upload);
  const { user } = useSelector((state) => state.auth);

  // Fetch content on mount
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchContentLibrary({
        userId: user.id,
        filters: libraryFilters
      }));
    }
  }, [dispatch, user, libraryFilters]);

  // Handle filter change
  const handleFilterChange = (field, value) => {
    dispatch(updateLibraryFilter({ field, value }));
    setPage(1); // Reset to first page
  };

  // Handle search with debounce
  const handleSearchChange = (event) => {
    const value = event.target.value;
    handleFilterChange('search', value);
  };

  // Handle sort order toggle
  const handleSortOrderToggle = () => {
    const newOrder = libraryFilters.sortOrder === 'desc' ? 'asc' : 'desc';
    handleFilterChange('sortOrder', newOrder);
  };

  // Handle content actions
  const handleEdit = (content) => {
    dispatch(setSelectedContent(content));
    navigate('/upload/edit');
  };

  const handleDuplicate = (content) => {
    dispatch(duplicateContent(content.id));
  };

  const handleDeleteClick = (content) => {
    setDeleteDialog({ open: true, content });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.content) {
      dispatch(deleteContent(deleteDialog.content.id));
    }
    setDeleteDialog({ open: false, content: null });
  };

  const handleShareClick = (content) => {
    setShareDialog({ open: true, content });
  };

  const handleCopyLink = () => {
    if (shareDialog.content) {
      const link = `${window.location.origin}/content/${shareDialog.content.id}`;
      navigator.clipboard.writeText(link);
      // Show success message (could use snackbar)
      alert('Link copied to clipboard!');
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'info';
    }
  };

  // Filter and sort content
  const getFilteredContent = () => {
    let filtered = [...contentLibrary];

    // Apply filters
    if (libraryFilters.search) {
      const search = libraryFilters.search.toLowerCase();
      filtered = filtered.filter(
        (content) =>
          content.metadata?.title?.toLowerCase().includes(search) ||
          content.metadata?.description?.toLowerCase().includes(search)
      );
    }

    if (libraryFilters.subject && libraryFilters.subject !== 'All Subjects') {
      filtered = filtered.filter(
        (content) => content.metadata?.subject === libraryFilters.subject
      );
    }

    if (libraryFilters.status && libraryFilters.status !== 'all') {
      filtered = filtered.filter((content) => content.status === libraryFilters.status);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (libraryFilters.sortBy) {
        case 'title':
          aVal = a.metadata?.title || '';
          bVal = b.metadata?.title || '';
          break;
        case 'views':
          aVal = a.analytics?.views || 0;
          bVal = b.analytics?.views || 0;
          break;
        case 'updatedAt':
          aVal = new Date(a.updatedAt || 0);
          bVal = new Date(b.updatedAt || 0);
          break;
        case 'createdAt':
        default:
          aVal = new Date(a.createdAt || 0);
          bVal = new Date(b.createdAt || 0);
      }

      if (libraryFilters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  };

  // Paginate content
  const getPaginatedContent = () => {
    const filtered = getFilteredContent();
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredContent().length / ITEMS_PER_PAGE);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Content Library
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all your uploaded learning content
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/upload')}
        >
          Upload New Content
        </Button>
      </Box>

      {/* Filter Bar */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search content..."
              value={libraryFilters.search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Subject Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={libraryFilters.subject || 'All Subjects'}
                label="Subject"
                onChange={(e) => handleFilterChange('subject', e.target.value)}
              >
                {SUBJECTS.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={libraryFilters.status || 'all'}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sort By */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={libraryFilters.sortBy || 'createdAt'}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Sort Order */}
          <Grid item xs={12} sm={6} md={2}>
            <Tooltip title={`Sort ${libraryFilters.sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSortOrderToggle}
                startIcon={<Sort />}
              >
                {libraryFilters.sortOrder === 'desc' ? '↓ Desc' : '↑ Asc'}
              </Button>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Results Count */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {getFilteredContent().length} content item{getFilteredContent().length !== 1 ? 's' : ''} found
          </Typography>
        </Box>
      </Paper>

      {/* Content Grid */}
      {loading.library ? (
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : getPaginatedContent().length > 0 ? (
        <>
          <Grid container spacing={3}>
            {getPaginatedContent().map((content) => (
              <Grid item xs={12} sm={6} md={4} key={content.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <CardMedia
                    component="div"
                    sx={{
                      height: 140,
                      backgroundColor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {content.thumbnail ? (
                      <img
                        src={content.thumbnail}
                        alt={content.metadata?.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Typography variant="h3">
                        {content.metadata?.title?.charAt(0) || '📄'}
                      </Typography>
                    )}
                  </CardMedia>

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Title */}
                    <Typography variant="h6" gutterBottom noWrap title={content.metadata?.title}>
                      {content.metadata?.title || 'Untitled Content'}
                    </Typography>

                    {/* Metadata */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {content.metadata?.subject && (
                        <Chip label={content.metadata.subject} size="small" />
                      )}
                      <Chip
                        label={content.status || 'draft'}
                        size="small"
                        color={getStatusColor(content.status)}
                      />
                    </Box>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {content.metadata?.description || 'No description available'}
                    </Typography>

                    {/* Analytics */}
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Tooltip title="Views">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Visibility fontSize="small" color="action" />
                          <Typography variant="caption">
                            {content.analytics?.views || 0}
                          </Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title="Engagement">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUp fontSize="small" color="action" />
                          <Typography variant="caption">
                            {content.analytics?.engagement || 0}%
                          </Typography>
                        </Box>
                      </Tooltip>
                      {content.analytics?.completion && (
                        <Tooltip title="Completion Rate">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CheckCircle fontSize="small" color="action" />
                            <Typography variant="caption">
                              {content.analytics.completion}%
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Date */}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Updated {new Date(content.updatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>

                  {/* Actions */}
                  <CardActions>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(content)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={() => handleDuplicate(content)}>
                        <FileCopy />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share">
                      <IconButton size="small" onClick={() => handleShareClick(content)}>
                        <Share />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(content)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            border: '1px dashed #ccc'
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No content found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {libraryFilters.search || libraryFilters.subject !== 'All Subjects' || libraryFilters.status !== 'all'
              ? 'Try adjusting your filters'
              : 'Upload your first content to get started'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/upload')}>
            Upload Content
          </Button>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, content: null })}>
        <DialogTitle>Delete Content</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.content?.metadata?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, content: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialog.open}
        onClose={() => setShareDialog({ open: false, content: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Content</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Content Link
            </Typography>
            <TextField
              fullWidth
              value={shareDialog.content ? `${window.location.origin}/content/${shareDialog.content.id}` : ''}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button onClick={handleCopyLink}>Copy</Button>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog({ open: false, content: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentLibrary;
