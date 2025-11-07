import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { Card, Button, Select, ProgressBar } from '../components/shared';
import { SUBJECTS, GRADE_LEVELS, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../utils/constants';
import { formatFileSize } from '../utils/helpers';
import api from '../services/api';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    description: ''
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      const isValidType = ALLOWED_FILE_TYPES.includes(extension);
      const isValidSize = file.size <= MAX_FILE_SIZE;
      
      if (!isValidType) {
        alert(`${file.name} is not a supported file type`);
        return false;
      }
      if (!isValidSize) {
        alert(`${file.name} exceeds the maximum file size of ${formatFileSize(MAX_FILE_SIZE)}`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: 'pending',
        progress: 0,
        error: null
      }))
    ]);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (!formData.subject || !formData.grade) {
      alert('Please select subject and grade level');
      return;
    }

    setUploading(true);

    for (const fileData of files) {
      if (fileData.status === 'success') continue;

      try {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileData.id ? { ...f, status: 'uploading' } : f))
        );

        const formDataToSend = new FormData();
        formDataToSend.append('file', fileData.file);
        formDataToSend.append('subject', formData.subject);
        formDataToSend.append('grade', formData.grade);
        formDataToSend.append('description', formData.description);

        await api.contentService.uploadFile(formDataToSend, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setFiles((prev) =>
            prev.map((f) => (f.id === fileData.id ? { ...f, progress } : f))
          );
        });

        setFiles((prev) =>
          prev.map((f) => (f.id === fileData.id ? { ...f, status: 'success', progress: 100 } : f))
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: 'error', error: error.message || 'Upload failed' }
              : f
          )
        );
      }
    }

    setUploading(false);
  };

  const allSuccess = files.length > 0 && files.every((f) => f.status === 'success');
  const hasFiles = files.length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Upload Content</h1>
          <p className="text-lg text-neutral-600">
            Transform your PDFs and documents into interactive learning experiences
          </p>
        </motion.div>

        {/* Upload Area */}
        <Card className="mb-6">
          <div
            className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-neutral-300 hover:border-neutral-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              multiple
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileInput}
              className="hidden"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <motion.div
                animate={{ y: dragActive ? -10 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiUpload className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  Drop files here or click to upload
                </h3>
                <p className="text-neutral-600 mb-4">
                  Supports PDF, DOC, DOCX, and TXT files up to {formatFileSize(MAX_FILE_SIZE)}
                </p>
                <Button variant="primary" size="lg">
                  Choose Files
                </Button>
              </motion.div>
            </label>
          </div>
        </Card>

        {/* File List */}
        <AnimatePresence>
          {hasFiles && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-6">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-neutral-900">
                    Files ({files.length})
                  </h2>
                </div>
                <div className="card-body space-y-3">
                  {files.map((fileData) => (
                    <motion.div
                      key={fileData.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded flex items-center justify-center ${
                            fileData.status === 'success'
                              ? 'bg-success-100 text-success-500'
                              : fileData.status === 'error'
                              ? 'bg-error-100 text-error-500'
                              : 'bg-primary-100 text-primary-500'
                          }`}
                        >
                          {fileData.status === 'success' ? (
                            <FiCheck className="w-5 h-5" />
                          ) : fileData.status === 'error' ? (
                            <FiAlertCircle className="w-5 h-5" />
                          ) : (
                            <FiFile className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-neutral-900 truncate">
                                {fileData.file.name}
                              </h4>
                              <p className="text-sm text-neutral-600">
                                {formatFileSize(fileData.file.size)}
                              </p>
                            </div>
                            {fileData.status !== 'uploading' && (
                              <button
                                onClick={() => removeFile(fileData.id)}
                                className="ml-2 text-neutral-400 hover:text-neutral-600"
                              >
                                <FiX className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                          {fileData.status === 'uploading' && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-neutral-600">Uploading...</span>
                                <span className="font-semibold text-neutral-900">
                                  {fileData.progress}%
                                </span>
                              </div>
                              <ProgressBar progress={fileData.progress} size="sm" color="primary" />
                            </div>
                          )}
                          {fileData.status === 'error' && (
                            <p className="text-sm text-error-600">{fileData.error}</p>
                          )}
                          {fileData.status === 'success' && (
                            <p className="text-sm text-success-600">Upload complete!</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Settings */}
        {hasFiles && !allSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-900">Content Settings</h2>
              </div>
              <div className="card-body space-y-4">
                <Select
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                >
                  <option value="">Select a subject</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject.value} value={subject.value}>
                      {subject.icon} {subject.label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Grade Level"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  required
                >
                  <option value="">Select grade level</option>
                  {GRADE_LEVELS.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </Select>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe the content of these files..."
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleUpload}
                  loading={uploading}
                  icon={<FiUpload />}
                >
                  Upload and Process Files
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Success Message */}
        {allSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center p-8 bg-gradient-to-br from-success-50 to-primary-50">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Upload Complete!
              </h2>
              <p className="text-neutral-600 mb-6">
                Your files are being processed and will be available in your library soon.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiles([]);
                    setFormData({ subject: '', grade: '', description: '' });
                  }}
                >
                  Upload More
                </Button>
                <Button variant="primary" onClick={() => window.location.href = '/learn'}>
                  Go to My Learning
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Upload;
