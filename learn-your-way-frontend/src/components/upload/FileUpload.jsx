import React, { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadFile, setSelectedContent } from '../../store/slices/uploadSlice';
import { CloudUpload, Description, InsertDriveFile, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
  Paper,
  Grid,
  IconButton,
  Alert
} from '@mui/material';

// Accepted file types
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt']
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

const FILE_TYPE_ICONS = {
  pdf: '📄',
  docx: '📝',
  doc: '📝',
  pptx: '📊',
  ppt: '📊'
};

const FileUpload = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const {
    uploading,
    uploadProgress,
    uploadedFile,
    recentUploads,
    error
  } = useSelector((state) => state.upload);

  // Validate file
  const validateFile = (file) => {
    // Check file type
    const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
    const acceptedExtensions = Object.values(ACCEPTED_FILE_TYPES).flat();
    
    if (!acceptedExtensions.includes(fileExtension)) {
      return `Invalid file type. Please upload PDF, DOCX, or PPTX files.`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      return `File size exceeds ${sizeMB}MB limit. Please choose a smaller file.`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback((files) => {
    setValidationError(null);

    if (!files || files.length === 0) return;

    const file = files[0];
    const error = validateFile(file);

    if (error) {
      setValidationError(error);
      return;
    }

    // Create FormData and dispatch upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
    formData.append('fileType', file.type);
    formData.append('fileSize', file.size);

    dispatch(uploadFile(formData));
  }, [dispatch]);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files);
    }
  };

  // Handle click to browse
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    return FILE_TYPE_ICONS[extension] || '📄';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'processing':
        return 'info';
      case 'draft':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle recent upload click
  const handleRecentUploadClick = (upload) => {
    dispatch(setSelectedContent(upload));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Upload Learning Content
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload PDF, DOCX, or PPTX files to create engaging learning content for your students
        </Typography>
      </Box>

      {/* Error Alert */}
      {(error || validationError) && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setValidationError(null)}>
          {validationError || error}
        </Alert>
      )}

      {/* Upload Area */}
      <Paper
        elevation={dragActive ? 8 : 2}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          mb: 4,
          p: 4,
          border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
          backgroundColor: dragActive ? 'rgba(25, 118, 210, 0.05)' : 'background.paper',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.02)'
          }
        }}
        onClick={handleBrowseClick}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            {dragActive ? 'Drop your file here' : 'Drag and drop your file here'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or
          </Typography>
          
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            disabled={uploading}
          >
            Browse Files
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept={Object.keys(ACCEPTED_FILE_TYPES).join(',')}
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </Box>

        {/* File Type Info */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Accepted formats: PDF, DOCX, PPTX
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Maximum file size: 50MB
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Processing time: ~2-5 minutes depending on file size
          </Typography>
        </Box>
      </Paper>

      {/* Upload Progress */}
      {uploading && uploadedFile && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Description sx={{ mr: 2, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1">{uploadedFile.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatFileSize(uploadedFile.size)} • Uploading...
              </Typography>
            </Box>
            <Typography variant="h6" color="primary">
              {uploadProgress}%
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, #1976d2 0%, #4caf50 ${uploadProgress}%)`
              }
            }}
          />
          
          {uploadProgress < 100 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Upload speed: {((uploadedFile.size * uploadProgress / 100) / (1024 * 1024)).toFixed(2)} MB/s
            </Typography>
          )}
        </Paper>
      )}

      {/* Recent Uploads */}
      {recentUploads && recentUploads.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Recent Uploads
          </Typography>
          
          <Grid container spacing={2}>
            {recentUploads.map((upload, index) => (
              <Grid item xs={12} sm={6} md={4} key={upload.id || index}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleRecentUploadClick(upload)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h4" sx={{ mr: 2 }}>
                        {getFileIcon(upload.filename)}
                      </Typography>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle1"
                          noWrap
                          title={upload.filename}
                        >
                          {upload.filename}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(upload.uploadedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip
                        label={upload.status || 'draft'}
                        size="small"
                        color={getStatusColor(upload.status)}
                        icon={
                          upload.status === 'published' ? (
                            <CheckCircle fontSize="small" />
                          ) : upload.status === 'error' ? (
                            <ErrorIcon fontSize="small" />
                          ) : null
                        }
                      />
                      {upload.fileSize && (
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(upload.fileSize)}
                        </Typography>
                      )}
                    </Box>

                    {upload.metadata?.title && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                        noWrap
                      >
                        {upload.metadata.title}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {!uploading && recentUploads.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            border: '1px dashed #ccc'
          }}
        >
          <InsertDriveFile sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No uploads yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload your first file to get started creating learning content
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload;
