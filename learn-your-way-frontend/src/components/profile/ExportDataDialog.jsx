import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Alert,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  exportData,
  setShowExportDataDialog,
  selectLoading,
  selectGDPR,
} from '../../store/slices/profileSlice';

const ExportDataDialog = () => {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.profile.showExportDataDialog);
  const loading = useSelector(selectLoading).export;
  const gdpr = useSelector(selectGDPR);
  const userId = useSelector((state) => state.auth?.user?.id);

  // Form state
  const [selectedData, setSelectedData] = useState({
    profile: true,
    learningHistory: true,
    quizResults: true,
    notes: true,
    achievements: true,
    studyRooms: true,
  });

  const [format, setFormat] = useState('json');
  const [sendEmail, setSendEmail] = useState(false);

  // Handle data selection
  const handleDataSelect = (key, checked) => {
    setSelectedData((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  // Check if at least one option is selected
  const hasSelection = Object.values(selectedData).some((value) => value);

  // Handle export
  const handleExport = async () => {
    try {
      await dispatch(
        exportData({
          userId,
          options: selectedData,
          format,
        })
      ).unwrap();

      if (sendEmail) {
        // Show email sent notification
        console.log('Download link will be sent to your email');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  // Handle close
  const handleClose = () => {
    dispatch(setShowExportDataDialog(false));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FileDownloadIcon />
          Export Your Data
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Info Alert */}
          <Alert severity="info">
            We'll prepare your data for download. Large exports may take a few minutes.
          </Alert>

          {/* Select Data to Export */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Select Data to Export
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.profile}
                    onChange={(e) => handleDataSelect('profile', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Profile information</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Name, email, grade, school, bio, preferences
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.learningHistory}
                    onChange={(e) =>
                      handleDataSelect('learningHistory', e.target.checked)
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Learning history</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Courses, lessons, progress, time spent
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.quizResults}
                    onChange={(e) =>
                      handleDataSelect('quizResults', e.target.checked)
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Quiz results and progress</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Scores, answers, feedback, statistics
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.notes}
                    onChange={(e) => handleDataSelect('notes', e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Notes and highlights</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your annotations, bookmarks, saved content
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.achievements}
                    onChange={(e) =>
                      handleDataSelect('achievements', e.target.checked)
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Achievements and badges</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Unlocked achievements, progress, dates
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.studyRooms}
                    onChange={(e) =>
                      handleDataSelect('studyRooms', e.target.checked)
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Study room history</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Rooms joined, messages, collaborations
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Box>

          {/* Export Format */}
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Export Format
            </Typography>
            <RadioGroup value={format} onChange={(e) => setFormat(e.target.value)}>
              <FormControlLabel
                value="json"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">JSON</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Machine-readable format for data portability
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="pdf"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2">PDF</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Human-readable document with formatted data
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>

          {/* Email Option */}
          <FormControlLabel
            control={
              <Checkbox
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
            }
            label="Send download link to my email"
          />

          {/* Export Progress */}
          {gdpr.exportInProgress && (
            <Box>
              <LinearProgress />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                Preparing your export... This may take a few minutes.
              </Typography>
            </Box>
          )}

          {/* Export Ready */}
          {gdpr.exportUrl && !gdpr.exportInProgress && (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <AlertTitle>Export Ready!</AlertTitle>
              Your data export is ready for download.
              <Button
                variant="contained"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => window.open(gdpr.exportUrl, '_blank')}
                sx={{ mt: 1, display: 'block' }}
              >
                Download Now
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Link expires in 24 hours
              </Typography>
            </Alert>
          )}

          {/* Last Export Date */}
          {gdpr.lastExportDate && !gdpr.exportInProgress && !gdpr.exportUrl && (
            <Alert severity="info">
              Last export:{' '}
              {new Date(gdpr.lastExportDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={gdpr.exportInProgress}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          disabled={!hasSelection || gdpr.exportInProgress}
          startIcon={<FileDownloadIcon />}
        >
          {gdpr.exportInProgress ? 'Exporting...' : 'Export Data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDataDialog;
