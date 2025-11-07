import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  nextStep,
  previousStep,
  setCurrentStep,
  resetUpload,
  pollProcessingStatus,
  setProcessingStatus,
  addProcessingLog
} from '../store/slices/uploadSlice';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  CloudUpload,
  HourglassEmpty,
  Preview,
  VerifiedUser,
  Publish,
  CheckCircle,
  ArrowBack,
  ArrowForward,
  Close
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

// Import step components
import FileUpload from '../components/upload/FileUpload';
import ProcessingStatus from '../components/upload/ProcessingStatus';
import ContentEditor from '../components/upload/ContentEditor';
import QualityReview from '../components/upload/QualityReview';
import PublishSettings from '../components/upload/PublishSettings';

// Workflow steps configuration
const WORKFLOW_STEPS = [
  {
    key: 'upload',
    label: 'Upload',
    icon: <CloudUpload />,
    description: 'Select and upload your content file',
    component: FileUpload
  },
  {
    key: 'processing',
    label: 'Processing',
    icon: <HourglassEmpty />,
    description: 'Content is being analyzed and processed',
    component: ProcessingStatus
  },
  {
    key: 'preview',
    label: 'Preview & Edit',
    icon: <Preview />,
    description: 'Review and edit extracted content',
    component: ContentEditor
  },
  {
    key: 'quality',
    label: 'Quality Review',
    icon: <VerifiedUser />,
    description: 'Review content quality checks',
    component: QualityReview
  },
  {
    key: 'publish',
    label: 'Publish',
    icon: <Publish />,
    description: 'Configure publishing settings',
    component: PublishSettings
  },
  {
    key: 'complete',
    label: 'Complete',
    icon: <CheckCircle />,
    description: 'Upload completed successfully',
    component: null
  }
];

const ContentUpload = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contentId } = useParams();
  const pollingIntervalRef = useRef(null);
  const [cancelDialog, setCancelDialog] = React.useState(false);

  const {
    currentStep,
    uploadedFile,
    processing,
    processingStatus,
    metadata,
    qualityCheck,
    publishSettings,
    jobId,
    error
  } = useSelector((state) => state.upload);

  // Get current step index
  const currentStepIndex = WORKFLOW_STEPS.findIndex((step) => step.key === currentStep);
  const CurrentStepComponent = WORKFLOW_STEPS[currentStepIndex]?.component;

  // Load existing content for editing
  useEffect(() => {
    if (contentId) {
      // Fetch content and set state
      // dispatch(fetchExtractedContent(contentId));
    }
  }, [contentId, dispatch]);

  // Polling for processing status
  useEffect(() => {
    if (processing && jobId && processingStatus.stage !== 'complete' && processingStatus.stage !== 'error') {
      // Poll every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        dispatch(pollProcessingStatus(jobId));
      }, 2000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [processing, jobId, processingStatus.stage, dispatch]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Escape key - show cancel dialog
      if (event.key === 'Escape' && currentStep !== 'complete') {
        setCancelDialog(true);
      }
      
      // Ctrl+S - save draft (future feature)
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        // dispatch(saveDraft());
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep]);

  // Check if next step is allowed
  const canProceedToNext = () => {
    switch (currentStep) {
      case 'upload':
        return uploadedFile !== null;
      case 'processing':
        return !processing && processingStatus.stage === 'complete';
      case 'preview':
        return metadata.title && metadata.title.trim().length > 0;
      case 'quality':
        return qualityCheck.passed || qualityCheck.score >= 0; // Allow with admin override
      case 'publish':
        return publishSettings.visibility !== null;
      default:
        return true;
    }
  };

  // Handle step navigation
  const handleNext = () => {
    if (canProceedToNext()) {
      dispatch(nextStep());
    }
  };

  const handleBack = () => {
    dispatch(previousStep());
  };

  const handleStepClick = (stepKey) => {
    const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === stepKey);
    
    // Can only go to completed steps or current step
    if (stepIndex <= currentStepIndex) {
      dispatch(setCurrentStep(stepKey));
    }
  };

  // Handle cancel
  const handleCancelClick = () => {
    setCancelDialog(true);
  };

  const handleCancelConfirm = () => {
    dispatch(resetUpload());
    navigate('/dashboard');
  };

  // Handle completion actions
  const handleViewContent = () => {
    // Navigate to content view
    navigate(`/content/${uploadedFile?.id || 'latest'}`);
  };

  const handleUploadAnother = () => {
    dispatch(resetUpload());
  };

  const handleGoToLibrary = () => {
    navigate('/upload/library');
  };

  // Get next button label
  const getNextButtonLabel = () => {
    switch (currentStep) {
      case 'upload':
        return 'Start Processing';
      case 'processing':
        return 'Review Content';
      case 'preview':
        return 'Check Quality';
      case 'quality':
        return 'Configure Publishing';
      case 'publish':
        return 'Publish Content';
      default:
        return 'Next';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', py: 4 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: 3 }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">
              {contentId ? 'Edit Content' : 'Upload New Content'}
            </Typography>
            {currentStep !== 'complete' && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Close />}
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Paper>

        {/* Progress Stepper */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={currentStepIndex} alternativeLabel>
            {WORKFLOW_STEPS.map((step, index) => (
              <Step
                key={step.key}
                completed={index < currentStepIndex}
                onClick={() => handleStepClick(step.key)}
                sx={{
                  cursor: index <= currentStepIndex ? 'pointer' : 'default',
                  '&:hover': {
                    opacity: index <= currentStepIndex ? 0.8 : 1
                  }
                }}
              >
                <StepLabel
                  icon={step.icon}
                  optional={
                    <Typography variant="caption" align="center">
                      {step.description}
                    </Typography>
                  }
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch({ type: 'upload/clearError' })}>
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ mb: 3 }}>
          {currentStep === 'complete' ? (
            <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
              <Typography variant="h4" gutterBottom>
                Content Published Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Your content has been published and is now available to your students.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleViewContent}
                >
                  View Content
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleUploadAnother}
                >
                  Upload Another
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleGoToLibrary}
                >
                  Go to Library
                </Button>
              </Box>
            </Paper>
          ) : CurrentStepComponent ? (
            <CurrentStepComponent />
          ) : (
            <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Step content not available
              </Typography>
            </Paper>
          )}
        </Box>

        {/* Navigation Buttons */}
        {currentStep !== 'complete' && (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleBack}
                disabled={currentStepIndex === 0}
              >
                Back
              </Button>

              <Box sx={{ flex: 1, mx: 3 }}>
                {/* Progress indicator for current step */}
                {(currentStep === 'upload' || currentStep === 'processing') && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                      {currentStep === 'upload' ? 'Waiting for file upload' : 'Processing...'}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={handleNext}
                disabled={!canProceedToNext()}
              >
                {getNextButtonLabel()}
              </Button>
            </Box>

            {/* Helpful messages */}
            {!canProceedToNext() && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {currentStep === 'upload' && 'Please upload a file to continue'}
                {currentStep === 'processing' && 'Please wait for processing to complete'}
                {currentStep === 'preview' && 'Please add a title to continue'}
                {currentStep === 'quality' && 'Please review quality checks before publishing'}
                {currentStep === 'publish' && 'Please select a visibility option'}
              </Alert>
            )}
          </Paper>
        )}

        {/* Loading Overlay */}
        {(processing && currentStep === 'processing') && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999
            }}
          >
            <LinearProgress />
          </Box>
        )}

        {/* Cancel Confirmation Dialog */}
        <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
          <DialogTitle>Cancel Upload?</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel? All progress will be lost.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialog(false)}>
              Continue Editing
            </Button>
            <Button onClick={handleCancelConfirm} color="error" variant="contained">
              Cancel Upload
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ContentUpload;
