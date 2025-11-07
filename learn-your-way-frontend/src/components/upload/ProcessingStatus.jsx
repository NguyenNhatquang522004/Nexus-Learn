import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setProcessingStatus, addProcessingLog } from '../../store/slices/uploadSlice';
import {
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  HourglassEmpty
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for timeline
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  alternativeLabel: {
    top: 22
  },
  active: {
    '& .MuiStepConnector-line': {
      background: 'linear-gradient(90deg, #4caf50 0%, #1976d2 100%)'
    }
  },
  completed: {
    '& .MuiStepConnector-line': {
      background: '#4caf50'
    }
  },
  line: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1
  }
}));

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    background: 'linear-gradient(136deg, #1976d2 0%, #64b5f6 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)'
  }),
  ...(ownerState.completed && {
    background: 'linear-gradient(136deg, #4caf50 0%, #81c784 100%)'
  }),
  ...(ownerState.error && {
    background: 'linear-gradient(136deg, #f44336 0%, #e57373 100%)'
  })
}));

function ColorlibStepIcon(props) {
  const { active, completed, error, className, icon } = props;

  const icons = {
    1: '📤',
    2: '📝',
    3: '🧠',
    4: '🔗',
    5: '✅'
  };

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active, error }} className={className}>
      {error ? (
        <ErrorIcon />
      ) : completed ? (
        <CheckCircle />
      ) : active ? (
        <CircularProgress size={24} sx={{ color: 'white' }} />
      ) : (
        <Typography>{icons[String(icon)]}</Typography>
      )}
    </ColorlibStepIconRoot>
  );
}

// Processing steps
const PROCESSING_STEPS = [
  { key: 'uploading', label: 'File Uploaded', description: 'File uploaded successfully' },
  { key: 'extracting', label: 'Extracting Content', description: 'Extracting text, images, and metadata' },
  { key: 'analyzing', label: 'Analyzing Concepts', description: 'Identifying key concepts and topics' },
  { key: 'creating_graph', label: 'Creating Graph', description: 'Building knowledge graph connections' },
  { key: 'quality_check', label: 'Quality Check', description: 'Validating content quality and safety' }
];

const ProcessingStatus = () => {
  const dispatch = useDispatch();
  const logContainerRef = useRef(null);
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  const { jobId, processingStatus, processing } = useSelector((state) => state.upload);

  // Get current step index
  const getCurrentStepIndex = () => {
    const stage = processingStatus.stage;
    const index = PROCESSING_STEPS.findIndex((step) => step.key === stage);
    return index >= 0 ? index : 0;
  };

  // Get step status
  const getStepStatus = (stepIndex) => {
    const currentIndex = getCurrentStepIndex();
    
    if (processingStatus.stage === 'error') {
      return stepIndex <= currentIndex ? 'error' : 'pending';
    }
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Format estimated time
  const formatEstimatedTime = (seconds) => {
    if (!seconds) return 'Calculating...';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    return `${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  };

  // Get log level color
  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'info';
    }
  };

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [processingStatus.logs]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!jobId || !processing) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_REALTIME_AGENT_URL?.replace(/^http(s)?:\/\//, '') || 'localhost:8012';
    const wsUrl = `${wsProtocol}//${wsHost}${import.meta.env.VITE_REALTIME_WS_UPLOAD_ENDPOINT || '/ws/upload'}/${jobId}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected for job:', jobId);
        setWsConnected(true);
        dispatch(addProcessingLog({
          timestamp: new Date().toISOString(),
          message: 'Connected to real-time processing updates',
          level: 'info'
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Update processing status
          if (data.stage) {
            dispatch(setProcessingStatus({
              stage: data.stage,
              progress: data.progress,
              message: data.message,
              estimatedTime: data.estimatedTime
            }));
          }

          // Add log entry
          if (data.log || data.message) {
            dispatch(addProcessingLog({
              timestamp: data.timestamp || new Date().toISOString(),
              message: data.log || data.message,
              level: data.level || 'info'
            }));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
        dispatch(addProcessingLog({
          timestamp: new Date().toISOString(),
          message: 'WebSocket connection error. Updates may be delayed.',
          level: 'warning'
        }));
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [jobId, processing, dispatch]);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Processing Content
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your file is being processed. This may take a few minutes.
        </Typography>
      </Box>

      {/* Connection Status */}
      {processing && (
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: wsConnected ? '#4caf50' : '#ff9800',
              animation: wsConnected ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 }
              }
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {wsConnected ? 'Connected to real-time updates' : 'Connecting...'}
          </Typography>
        </Box>
      )}

      {/* Progress Timeline */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stepper
          alternativeLabel
          activeStep={getCurrentStepIndex()}
          connector={<ColorlibConnector />}
        >
          {PROCESSING_STEPS.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <Step key={step.key} completed={status === 'completed'}>
                <StepLabel
                  StepIconComponent={ColorlibStepIcon}
                  StepIconProps={{
                    active: status === 'active',
                    completed: status === 'completed',
                    error: status === 'error'
                  }}
                >
                  <Typography variant="subtitle2">{step.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        {/* Progress Bar */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {processingStatus.message || 'Processing...'}
            </Typography>
            <Typography variant="body2" color="primary" fontWeight="bold">
              {processingStatus.progress || 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={processingStatus.progress || 0}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, #1976d2 0%, #4caf50 ${processingStatus.progress || 0}%)`
              }
            }}
          />
        </Box>

        {/* Estimated Time */}
        {processingStatus.estimatedTime && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Estimated time remaining: {formatEstimatedTime(processingStatus.estimatedTime)}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Live Log Stream */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Processing Log</Typography>
            {processing && (
              <Chip
                icon={<HourglassEmpty />}
                label="Processing"
                color="primary"
                size="small"
              />
            )}
          </Box>

          <Paper
            ref={logContainerRef}
            variant="outlined"
            sx={{
              maxHeight: 400,
              overflow: 'auto',
              p: 2,
              backgroundColor: '#1e1e1e',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          >
            {processingStatus.logs && processingStatus.logs.length > 0 ? (
              processingStatus.logs.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 1,
                    display: 'flex',
                    gap: 2,
                    color: log.level === 'error' ? '#f44336' :
                           log.level === 'warning' ? '#ff9800' :
                           log.level === 'success' ? '#4caf50' :
                           '#90caf9'
                  }}
                >
                  <Typography
                    component="span"
                    sx={{
                      color: '#666',
                      minWidth: 80,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}
                  >
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  >
                    {log.message}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                Waiting for processing logs...
              </Typography>
            )}
          </Paper>
        </CardContent>
      </Card>

      {/* Error State */}
      {processingStatus.stage === 'error' && (
        <Paper
          elevation={2}
          sx={{
            mt: 3,
            p: 3,
            backgroundColor: 'error.light',
            color: 'error.contrastText'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ErrorIcon fontSize="large" />
            <Box>
              <Typography variant="h6">Processing Error</Typography>
              <Typography variant="body2">
                {processingStatus.message || 'An error occurred during processing. Please try again.'}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ProcessingStatus;
