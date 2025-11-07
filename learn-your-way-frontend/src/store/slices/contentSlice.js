import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  contentService,
  personalizationService,
  visualService,
  audioService,
  translationService,
  knowledgeGraphService
} from '../../services/api';

// Async thunks
export const fetchContent = createAsyncThunk(
  'content/fetchContent',
  async ({ conceptId, userId, learningStyle }, { rejectWithValue }) => {
    try {
      const content = await contentService.getContent(conceptId);
      
      // Personalize content based on user profile
      const personalizedContent = await personalizationService.personalizeContent({
        userId,
        content: content.text,
        learningStyle,
        conceptId
      });
      
      return {
        ...content,
        personalizedText: personalizedContent.text,
        examples: personalizedContent.examples,
        vocabulary: personalizedContent.vocabulary
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPrerequisites = createAsyncThunk(
  'content/fetchPrerequisites',
  async (conceptId, { rejectWithValue }) => {
    try {
      const prerequisites = await knowledgeGraphService.getPrerequisites(conceptId);
      return prerequisites;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRelatedConcepts = createAsyncThunk(
  'content/fetchRelatedConcepts',
  async (conceptId, { rejectWithValue }) => {
    try {
      const related = await knowledgeGraphService.getRelatedConcepts(conceptId);
      return related;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchVisualEnhancements = createAsyncThunk(
  'content/fetchVisualEnhancements',
  async ({ conceptId, contentText }, { rejectWithValue }) => {
    try {
      const images = await visualService.generateImages({
        conceptId,
        text: contentText,
        count: 3
      });
      return images;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAudioContent = createAsyncThunk(
  'content/fetchAudioContent',
  async ({ conceptId, text, voice }, { rejectWithValue }) => {
    try {
      const audio = await audioService.generateAudio({
        text,
        voice: voice || 'default',
        conceptId
      });
      
      const transcript = await audioService.getTranscript(audio.audioId);
      
      return {
        audioUrl: audio.url,
        audioId: audio.audioId,
        transcript: transcript.words,
        duration: audio.duration
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const translateContent = createAsyncThunk(
  'content/translateContent',
  async ({ text, targetLanguage }, { rejectWithValue }) => {
    try {
      const translated = await translationService.translate({
        text,
        targetLanguage,
        sourceLanguage: 'auto'
      });
      return translated;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const saveNote = createAsyncThunk(
  'content/saveNote',
  async ({ userId, conceptId, note }, { rejectWithValue }) => {
    try {
      const savedNote = await contentService.saveNote({
        userId,
        conceptId,
        content: note.content,
        timestamp: note.timestamp,
        position: note.position
      });
      return savedNote;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const loadNotes = createAsyncThunk(
  'content/loadNotes',
  async ({ userId, conceptId }, { rejectWithValue }) => {
    try {
      const notes = await contentService.getNotes(userId, conceptId);
      return notes;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const saveHighlights = createAsyncThunk(
  'content/saveHighlights',
  async ({ userId, conceptId, highlights }, { rejectWithValue }) => {
    try {
      const saved = await contentService.saveHighlights({
        userId,
        conceptId,
        highlights
      });
      return saved;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateProgress = createAsyncThunk(
  'content/updateProgress',
  async ({ userId, conceptId, progress }, { rejectWithValue }) => {
    try {
      const updated = await contentService.updateProgress({
        userId,
        conceptId,
        progress,
        completedAt: progress === 100 ? new Date().toISOString() : null
      });
      return updated;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  'content/toggleBookmark',
  async ({ userId, conceptId, bookmarked }, { rejectWithValue }) => {
    try {
      const result = await contentService.toggleBookmark({
        userId,
        conceptId,
        bookmarked
      });
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMindMap = createAsyncThunk(
  'content/fetchMindMap',
  async (conceptId, { rejectWithValue }) => {
    try {
      const mindMap = await knowledgeGraphService.getMindMap(conceptId);
      return mindMap;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Initial state
const initialState = {
  currentConcept: null,
  content: {
    id: null,
    title: '',
    text: '',
    personalizedText: '',
    examples: [],
    vocabulary: {},
    images: [],
    slides: [],
    tableOfContents: []
  },
  format: 'text', // text | slides | audio
  currentSlide: 0,
  audio: {
    url: null,
    audioId: null,
    transcript: [],
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    playbackRate: 1.0
  },
  notes: [],
  highlights: [],
  bookmarked: false,
  progress: 0,
  prerequisites: [],
  relatedConcepts: [],
  mindMap: null,
  translation: null,
  loading: {
    content: false,
    audio: false,
    images: false,
    notes: false,
    translation: false,
    prerequisites: false
  },
  error: null,
  autoSaveEnabled: true,
  lastSaved: null
};

// Content slice
const contentSlice = createSlice({
  name: 'content',
  initialState,
  reducers: {
    setFormat: (state, action) => {
      state.format = action.payload;
    },
    setCurrentSlide: (state, action) => {
      state.currentSlide = action.payload;
    },
    nextSlide: (state) => {
      if (state.currentSlide < state.content.slides.length - 1) {
        state.currentSlide += 1;
      }
    },
    previousSlide: (state) => {
      if (state.currentSlide > 0) {
        state.currentSlide -= 1;
      }
    },
    setAudioTime: (state, action) => {
      state.audio.currentTime = action.payload;
    },
    setAudioPlaying: (state, action) => {
      state.audio.isPlaying = action.payload;
    },
    setPlaybackRate: (state, action) => {
      state.audio.playbackRate = action.payload;
    },
    addNote: (state, action) => {
      const note = {
        id: Date.now(),
        content: action.payload.content,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        position: action.payload.position || 0,
        createdAt: new Date().toISOString()
      };
      state.notes.push(note);
      state.lastSaved = null; // Mark as unsaved
    },
    updateNote: (state, action) => {
      const index = state.notes.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.notes[index] = {
          ...state.notes[index],
          ...action.payload,
          updatedAt: new Date().toISOString()
        };
        state.lastSaved = null;
      }
    },
    deleteNote: (state, action) => {
      state.notes = state.notes.filter(n => n.id !== action.payload);
      state.lastSaved = null;
    },
    addHighlight: (state, action) => {
      const highlight = {
        id: Date.now(),
        text: action.payload.text,
        start: action.payload.start,
        end: action.payload.end,
        color: action.payload.color || '#fef3c7',
        createdAt: new Date().toISOString()
      };
      state.highlights.push(highlight);
      state.lastSaved = null;
    },
    removeHighlight: (state, action) => {
      state.highlights = state.highlights.filter(h => h.id !== action.payload);
      state.lastSaved = null;
    },
    updateHighlightColor: (state, action) => {
      const highlight = state.highlights.find(h => h.id === action.payload.id);
      if (highlight) {
        highlight.color = action.payload.color;
        state.lastSaved = null;
      }
    },
    setProgress: (state, action) => {
      state.progress = Math.min(100, Math.max(0, action.payload));
    },
    setAutoSave: (state, action) => {
      state.autoSaveEnabled = action.payload;
    },
    markSaved: (state) => {
      state.lastSaved = new Date().toISOString();
    },
    clearTranslation: (state) => {
      state.translation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetContent: (state) => {
      return {
        ...initialState,
        format: state.format,
        autoSaveEnabled: state.autoSaveEnabled
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch content
      .addCase(fetchContent.pending, (state) => {
        state.loading.content = true;
        state.error = null;
      })
      .addCase(fetchContent.fulfilled, (state, action) => {
        state.loading.content = false;
        state.content = action.payload;
        state.currentConcept = action.payload.id;
        state.progress = 0;
        state.currentSlide = 0;
      })
      .addCase(fetchContent.rejected, (state, action) => {
        state.loading.content = false;
        state.error = action.payload || 'Failed to fetch content';
      })
      
      // Fetch prerequisites
      .addCase(fetchPrerequisites.pending, (state) => {
        state.loading.prerequisites = true;
      })
      .addCase(fetchPrerequisites.fulfilled, (state, action) => {
        state.loading.prerequisites = false;
        state.prerequisites = action.payload;
      })
      .addCase(fetchPrerequisites.rejected, (state, action) => {
        state.loading.prerequisites = false;
        state.error = action.payload || 'Failed to fetch prerequisites';
      })
      
      // Fetch related concepts
      .addCase(fetchRelatedConcepts.fulfilled, (state, action) => {
        state.relatedConcepts = action.payload;
      })
      
      // Fetch visual enhancements
      .addCase(fetchVisualEnhancements.pending, (state) => {
        state.loading.images = true;
      })
      .addCase(fetchVisualEnhancements.fulfilled, (state, action) => {
        state.loading.images = false;
        state.content.images = action.payload;
      })
      .addCase(fetchVisualEnhancements.rejected, (state, action) => {
        state.loading.images = false;
        state.error = action.payload || 'Failed to fetch images';
      })
      
      // Fetch audio content
      .addCase(fetchAudioContent.pending, (state) => {
        state.loading.audio = true;
      })
      .addCase(fetchAudioContent.fulfilled, (state, action) => {
        state.loading.audio = false;
        state.audio = {
          ...state.audio,
          ...action.payload,
          currentTime: 0,
          isPlaying: false
        };
      })
      .addCase(fetchAudioContent.rejected, (state, action) => {
        state.loading.audio = false;
        state.error = action.payload || 'Failed to fetch audio';
      })
      
      // Translate content
      .addCase(translateContent.pending, (state) => {
        state.loading.translation = true;
      })
      .addCase(translateContent.fulfilled, (state, action) => {
        state.loading.translation = false;
        state.translation = action.payload;
      })
      .addCase(translateContent.rejected, (state, action) => {
        state.loading.translation = false;
        state.error = action.payload || 'Failed to translate content';
      })
      
      // Load notes
      .addCase(loadNotes.pending, (state) => {
        state.loading.notes = true;
      })
      .addCase(loadNotes.fulfilled, (state, action) => {
        state.loading.notes = false;
        state.notes = action.payload;
      })
      .addCase(loadNotes.rejected, (state, action) => {
        state.loading.notes = false;
        state.error = action.payload || 'Failed to load notes';
      })
      
      // Save note
      .addCase(saveNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex(n => n.id === action.payload.id);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
        state.lastSaved = new Date().toISOString();
      })
      
      // Save highlights
      .addCase(saveHighlights.fulfilled, (state) => {
        state.lastSaved = new Date().toISOString();
      })
      
      // Update progress
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.progress = action.payload.progress;
      })
      
      // Toggle bookmark
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        state.bookmarked = action.payload.bookmarked;
      })
      
      // Fetch mind map
      .addCase(fetchMindMap.fulfilled, (state, action) => {
        state.mindMap = action.payload;
      });
  }
});

export const {
  setFormat,
  setCurrentSlide,
  nextSlide,
  previousSlide,
  setAudioTime,
  setAudioPlaying,
  setPlaybackRate,
  addNote,
  updateNote,
  deleteNote,
  addHighlight,
  removeHighlight,
  updateHighlightColor,
  setProgress,
  setAutoSave,
  markSaved,
  clearTranslation,
  clearError,
  resetContent
} = contentSlice.actions;

export default contentSlice.reducer;
