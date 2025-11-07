import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  updateMetadataField,
  addTag,
  removeTag,
  updateConceptNode,
  addConceptNode,
  removeConceptNode
} from '../../store/slices/uploadSlice';
import {
  Article,
  Image,
  Psychology,
  Add,
  Close,
  Edit,
  Delete
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
  Slider,
  Chip,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';

// Grade levels
const GRADE_LEVELS = [
  'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  'Undergraduate', 'Graduate'
];

// Subjects
const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'History', 'Geography',
  'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Art', 'Music', 'Physical Education', 'Foreign Language'
];

// Languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ru', name: 'Russian' }
];

const DIFFICULTY_MARKS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Elementary' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' }
];

const ContentEditor = () => {
  const dispatch = useDispatch();
  const [previewTab, setPreviewTab] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [nodeDialog, setNodeDialog] = useState({ open: false, node: null, isNew: false });
  const [imageDialog, setImageDialog] = useState({ open: false, image: null });

  const { extractedContent, metadata, conceptGraph } = useSelector((state) => state.upload);

  // Handle metadata field change
  const handleFieldChange = (field, value) => {
    dispatch(updateMetadataField({ field, value }));
  };

  // Handle tag add
  const handleAddTag = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      dispatch(addTag(tagInput.trim()));
      setTagInput('');
    }
  };

  // Handle tag remove
  const handleRemoveTag = (tag) => {
    dispatch(removeTag(tag));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle node dialog
  const handleOpenNodeDialog = (node = null, isNew = false) => {
    setNodeDialog({
      open: true,
      node: node || { id: `node_${Date.now()}`, name: '', description: '', type: 'concept' },
      isNew
    });
  };

  const handleCloseNodeDialog = () => {
    setNodeDialog({ open: false, node: null, isNew: false });
  };

  const handleSaveNode = () => {
    if (nodeDialog.isNew) {
      dispatch(addConceptNode(nodeDialog.node));
    } else {
      dispatch(updateConceptNode({
        nodeId: nodeDialog.node.id,
        updates: nodeDialog.node
      }));
    }
    handleCloseNodeDialog();
  };

  // Handle node delete
  const handleDeleteNode = (nodeId) => {
    if (window.confirm('Are you sure you want to delete this concept?')) {
      dispatch(removeConceptNode(nodeId));
    }
  };

  // Handle image click
  const handleImageClick = (image) => {
    setImageDialog({ open: true, image });
  };

  const handleCloseImageDialog = () => {
    setImageDialog({ open: false, image: null });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Review & Edit Content
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review the extracted content and add metadata to help students find your material
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Preview Pane */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ height: '100%' }}>
            <Tabs
              value={previewTab}
              onChange={(e, newValue) => setPreviewTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab icon={<Article />} label="Text" iconPosition="start" />
              <Tab icon={<Image />} label="Images" iconPosition="start" />
              <Tab icon={<Psychology />} label="Concepts" iconPosition="start" />
            </Tabs>

            {/* Text Preview */}
            {previewTab === 0 && (
              <Box sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
                {extractedContent.text ? (
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      lineHeight: 1.8
                    }}
                  >
                    {extractedContent.text}
                  </Typography>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                    No text content extracted
                  </Typography>
                )}
              </Box>
            )}

            {/* Images Preview */}
            {previewTab === 1 && (
              <Box sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
                {extractedContent.images && extractedContent.images.length > 0 ? (
                  <Grid container spacing={2}>
                    {extractedContent.images.map((image, index) => (
                      <Grid item xs={6} sm={4} key={index}>
                        <Card
                          sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                          onClick={() => handleImageClick(image)}
                        >
                          <CardMedia
                            component="img"
                            height="140"
                            image={image.url || image}
                            alt={`Extracted image ${index + 1}`}
                            sx={{ objectFit: 'cover' }}
                          />
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                    No images found in content
                  </Typography>
                )}
              </Box>
            )}

            {/* Concepts Preview */}
            {previewTab === 2 && (
              <Box sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
                {extractedContent.concepts && extractedContent.concepts.length > 0 ? (
                  <Grid container spacing={1}>
                    {extractedContent.concepts.map((concept, index) => (
                      <Grid item key={index}>
                        <Chip
                          label={concept.name || concept}
                          color="primary"
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                    No concepts detected yet
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Metadata Form */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Content Metadata
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {/* Title */}
              <TextField
                label="Title"
                required
                fullWidth
                value={metadata.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                inputProps={{ maxLength: 200 }}
                helperText={`${metadata.title.length}/200 characters`}
              />

              {/* Subject */}
              <FormControl fullWidth required>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={metadata.subject}
                  label="Subject"
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                >
                  {SUBJECTS.map((subject) => (
                    <MenuItem key={subject} value={subject}>
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Grade Level */}
              <FormControl fullWidth required>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  value={metadata.gradeLevel}
                  label="Grade Level"
                  onChange={(e) => handleFieldChange('gradeLevel', e.target.value)}
                >
                  {GRADE_LEVELS.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Difficulty */}
              <Box>
                <Typography gutterBottom>
                  Difficulty Level: {DIFFICULTY_MARKS.find(m => m.value === metadata.difficulty)?.label}
                </Typography>
                <Slider
                  value={metadata.difficulty}
                  onChange={(e, value) => handleFieldChange('difficulty', value)}
                  step={1}
                  marks={DIFFICULTY_MARKS}
                  min={1}
                  max={5}
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Language */}
              <FormControl fullWidth required>
                <InputLabel>Language</InputLabel>
                <Select
                  value={metadata.language}
                  label="Language"
                  onChange={(e) => handleFieldChange('language', e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Tags */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  {metadata.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      color="primary"
                      size="small"
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddTag}
                    startIcon={<Add />}
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </Box>
              </Box>

              {/* Description */}
              <TextField
                label="Description"
                multiline
                rows={4}
                fullWidth
                value={metadata.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                inputProps={{ maxLength: 1000 }}
                helperText={`${metadata.description.length}/1000 characters`}
              />

              {/* Author */}
              <TextField
                label="Author"
                fullWidth
                value={metadata.author}
                onChange={(e) => handleFieldChange('author', e.target.value)}
              />

              {/* Source */}
              <TextField
                label="Source URL (optional)"
                fullWidth
                type="url"
                value={metadata.source}
                onChange={(e) => handleFieldChange('source', e.target.value)}
                placeholder="https://example.com"
              />
            </Box>
          </Paper>
        </Grid>

        {/* Concept Graph */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Concept Map</Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => handleOpenNodeDialog(null, true)}
              >
                Add Concept
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {conceptGraph.nodes && conceptGraph.nodes.length > 0 ? (
              <Grid container spacing={2}>
                {conceptGraph.nodes.map((node) => (
                  <Grid item xs={12} sm={6} md={4} key={node.id}>
                    <Card variant="outlined">
                      <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {node.name}
                          </Typography>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenNodeDialog(node, false)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteNode(node.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        {node.description && (
                          <Typography variant="body2" color="text.secondary">
                            {node.description}
                          </Typography>
                        )}
                        <Chip
                          label={node.type || 'concept'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No concepts in the graph yet. Add concepts to build your knowledge map.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Node Edit Dialog */}
      <Dialog open={nodeDialog.open} onClose={handleCloseNodeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {nodeDialog.isNew ? 'Add New Concept' : 'Edit Concept'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Concept Name"
              required
              fullWidth
              value={nodeDialog.node?.name || ''}
              onChange={(e) =>
                setNodeDialog({
                  ...nodeDialog,
                  node: { ...nodeDialog.node, name: e.target.value }
                })
              }
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={nodeDialog.node?.description || ''}
              onChange={(e) =>
                setNodeDialog({
                  ...nodeDialog,
                  node: { ...nodeDialog.node, description: e.target.value }
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNodeDialog}>Cancel</Button>
          <Button
            onClick={handleSaveNode}
            variant="contained"
            disabled={!nodeDialog.node?.name}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog
        open={imageDialog.open}
        onClose={handleCloseImageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Image Preview
            <IconButton onClick={handleCloseImageDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {imageDialog.image && (
            <img
              src={imageDialog.image.url || imageDialog.image}
              alt="Preview"
              style={{ width: '100%', height: 'auto' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ContentEditor;
