import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { approveContent, rejectContent } from '../../store/slices/uploadSlice';
import {
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  ThumbUp,
  ThumbDown,
  ReviewsOutlined
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';

// Get grade color based on score
const getGradeColor = (score) => {
  if (score >= 90) return '#4caf50';
  if (score >= 80) return '#8bc34a';
  if (score >= 70) return '#ffc107';
  if (score >= 60) return '#ff9800';
  return '#f44336';
};

// Get grade letter based on score
const getGradeLetter = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

// Get severity icon
const getSeverityIcon = (severity) => {
  switch (severity) {
    case 'critical':
      return <ErrorIcon color="error" />;
    case 'major':
      return <Warning color="warning" />;
    case 'minor':
      return <Info color="info" />;
    default:
      return <Info />;
  }
};

// Get severity color
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'major':
      return 'warning';
    case 'minor':
      return 'info';
    default:
      return 'default';
  }
};

const QualityReview = () => {
  const dispatch = useDispatch();
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requiredChanges, setRequiredChanges] = useState('');

  const { qualityCheck, loading, selectedContent } = useSelector((state) => state.upload);

  const contentId = selectedContent?.id || 'temp_id';

  // Handle approve
  const handleApprove = () => {
    dispatch(approveContent({
      contentId,
      approvalData: {
        approver: null, // Will be set from auth state in the backend
        comments: 'Content approved for publishing',
        timestamp: new Date().toISOString()
      }
    }));
  };

  // Handle reject dialog
  const handleOpenRejectDialog = () => {
    setRejectDialog(true);
  };

  const handleCloseRejectDialog = () => {
    setRejectDialog(false);
    setRejectReason('');
    setRequiredChanges('');
  };

  const handleReject = () => {
    dispatch(rejectContent({
      contentId,
      data: {
        reason: rejectReason,
        requiredChanges: requiredChanges.split('\n').filter(c => c.trim())
      }
    }));
    handleCloseRejectDialog();
  };

  // Render check result
  const renderCheckResult = (check, title, icon) => {
    if (!check) return null;

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {check.passed ? (
              <CheckCircle sx={{ color: '#4caf50', mr: 1 }} />
            ) : (
              <ErrorIcon sx={{ color: '#f44336', mr: 1 }} />
            )}
            <Typography variant="h6">{title}</Typography>
          </Box>

          {check.issues && check.issues.length > 0 && (
            <List dense>
              {check.issues.map((issue, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getSeverityIcon(issue.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={issue.message}
                    secondary={issue.suggestion}
                  />
                </ListItem>
              ))}
            </List>
          )}

          {check.similarity !== undefined && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Similarity Score: {check.similarity}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={check.similarity}
                color={check.similarity > 30 ? 'error' : 'success'}
              />
            </Box>
          )}

          {check.sources && check.sources.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Potential Sources:
              </Typography>
              {check.sources.map((source, index) => (
                <Chip
                  key={index}
                  label={source}
                  size="small"
                  component="a"
                  href={source}
                  target="_blank"
                  clickable
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          )}

          {check.types && check.types.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Detected Bias Types:
              </Typography>
              {check.types.map((type, index) => (
                <Chip
                  key={index}
                  label={type}
                  size="small"
                  color="warning"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          )}

          {check.suggestions && check.suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Suggestions:
              </Typography>
              <List dense>
                {check.suggestions.map((suggestion, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Quality Review
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review the content quality checks before publishing
        </Typography>
      </Box>

      {/* Loading State */}
      {loading.validate && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading.validate && (
        <>
          {/* Quality Score */}
          <Paper elevation={2} sx={{ p: 4, mb: 4, textAlign: 'center' }}>
            <Box
              sx={{
                position: 'relative',
                display: 'inline-flex',
                mb: 2
              }}
            >
              <CircularProgress
                variant="determinate"
                value={qualityCheck.score}
                size={150}
                thickness={4}
                sx={{
                  color: getGradeColor(qualityCheck.score),
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round'
                  }
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}
              >
                <Typography variant="h3" component="div" fontWeight="bold">
                  {qualityCheck.score}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Grade {getGradeLetter(qualityCheck.score)}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom>
              Overall Quality Score
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {qualityCheck.passed
                ? 'Content meets quality standards and is ready for publishing'
                : 'Content needs improvements before publishing'}
            </Typography>
          </Paper>

          {/* Check Results */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              {renderCheckResult(qualityCheck.factCheck, 'Fact Check', <CheckCircle />)}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderCheckResult(qualityCheck.safetyCheck, 'Safety Check', <CheckCircle />)}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderCheckResult(qualityCheck.plagiarismCheck, 'Plagiarism Check', <CheckCircle />)}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderCheckResult(qualityCheck.biasCheck, 'Bias Check', <CheckCircle />)}
            </Grid>
          </Grid>

          {/* Issues List */}
          {qualityCheck.issues && qualityCheck.issues.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Issues Found ({qualityCheck.issues.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                {qualityCheck.issues.map((issue, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon sx={{ mt: 1 }}>
                        {getSeverityIcon(issue.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{issue.message}</Typography>
                            <Chip
                              label={issue.severity}
                              size="small"
                              color={getSeverityColor(issue.severity)}
                            />
                            <Chip
                              label={issue.type}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            {issue.suggestion && (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                💡 Suggestion: {issue.suggestion}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <Button size="small" variant="outlined" sx={{ ml: 2 }}>
                        Fix
                      </Button>
                    </ListItem>
                    {index < qualityCheck.issues.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}

          {/* Summary Alert */}
          {!qualityCheck.passed && (
            <Alert severity="warning" sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Content Quality Below Threshold
              </Typography>
              <Typography variant="body2">
                This content has {qualityCheck.issues?.length || 0} issues that should be addressed
                before publishing. You can request a manual review or make the suggested improvements.
              </Typography>
            </Alert>
          )}

          {qualityCheck.passed && (
            <Alert severity="success" sx={{ mb: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Content Approved
              </Typography>
              <Typography variant="body2">
                This content meets all quality standards and is ready to be published.
              </Typography>
            </Alert>
          )}

          {/* Approval Buttons */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Approval Decision
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  size="large"
                  startIcon={<ThumbDown />}
                  onClick={handleOpenRejectDialog}
                  disabled={loading.reject}
                >
                  Reject
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="warning"
                  size="large"
                  startIcon={<ReviewsOutlined />}
                  disabled={loading.approve}
                >
                  Request Review
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<ThumbUp />}
                  onClick={handleApprove}
                  disabled={!qualityCheck.passed || loading.approve}
                >
                  {qualityCheck.passed ? 'Approve & Continue' : 'Override & Approve'}
                </Button>
              </Grid>
            </Grid>

            {!qualityCheck.passed && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Content can be approved with admin override, but it's recommended to address the
                  issues first for better student experience.
                </Typography>
              </Alert>
            )}
          </Paper>
        </>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={handleCloseRejectDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Content</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Reason for Rejection"
              required
              multiline
              rows={3}
              fullWidth
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this content is being rejected..."
            />
            <TextField
              label="Required Changes"
              multiline
              rows={4}
              fullWidth
              value={requiredChanges}
              onChange={(e) => setRequiredChanges(e.target.value)}
              placeholder="List the changes required (one per line)..."
              helperText="Each line will be a separate required change"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectReason.trim() || loading.reject}
          >
            {loading.reject ? 'Rejecting...' : 'Reject Content'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityReview;
