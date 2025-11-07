import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import {
  saveNote,
  saveHighlights,
  updateProgress,
  toggleBookmark as toggleBookmarkAction,
  markSaved
} from '../store/slices/contentSlice';
import { showToast } from '../store/slices/uiSlice';

const STORAGE_KEYS = {
  NOTES: 'content_notes',
  HIGHLIGHTS: 'content_highlights',
  PROGRESS: 'content_progress',
  BOOKMARKS: 'content_bookmarks',
  DRAFT: 'content_draft'
};

const useContentSync = (conceptId) => {
  const dispatch = useDispatch();
  const { auth } = useSelector((state) => state.auth);
  const { notes, highlights, progress, bookmarked, autoSaveEnabled, lastSaved } = useSelector(
    (state) => state.content
  );
  
  const userId = auth?.user?.id;
  const syncTimeoutRef = useRef(null);
  const lastSyncRef = useRef({
    notes: null,
    highlights: null,
    progress: null
  });

  // Load data from localStorage on mount
  useEffect(() => {
    if (!conceptId || !userId) return;

    try {
      const storageKey = `${STORAGE_KEYS.NOTES}_${userId}_${conceptId}`;
      const savedNotes = localStorage.getItem(storageKey);
      if (savedNotes) {
        const parsedNotes = JSON.parse(savedNotes);
        // Notes are already loaded by Redux thunk, this is just for offline support
      }

      const highlightsKey = `${STORAGE_KEYS.HIGHLIGHTS}_${userId}_${conceptId}`;
      const savedHighlights = localStorage.getItem(highlightsKey);
      if (savedHighlights) {
        const parsedHighlights = JSON.parse(savedHighlights);
        // Highlights are already loaded by Redux thunk
      }

      const progressKey = `${STORAGE_KEYS.PROGRESS}_${userId}_${conceptId}`;
      const savedProgress = localStorage.getItem(progressKey);
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        // Progress is already loaded by Redux thunk
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, [conceptId, userId]);

  // Save notes to localStorage
  const saveNotesLocally = useCallback((notesData) => {
    if (!conceptId || !userId) return;

    try {
      const storageKey = `${STORAGE_KEYS.NOTES}_${userId}_${conceptId}`;
      localStorage.setItem(storageKey, JSON.stringify(notesData));
    } catch (error) {
      console.error('Error saving notes to localStorage:', error);
    }
  }, [conceptId, userId]);

  // Save highlights to localStorage
  const saveHighlightsLocally = useCallback((highlightsData) => {
    if (!conceptId || !userId) return;

    try {
      const storageKey = `${STORAGE_KEYS.HIGHLIGHTS}_${userId}_${conceptId}`;
      localStorage.setItem(storageKey, JSON.stringify(highlightsData));
    } catch (error) {
      console.error('Error saving highlights to localStorage:', error);
    }
  }, [conceptId, userId]);

  // Save progress to localStorage
  const saveProgressLocally = useCallback((progressData) => {
    if (!conceptId || !userId) return;

    try {
      const storageKey = `${STORAGE_KEYS.PROGRESS}_${userId}_${conceptId}`;
      localStorage.setItem(storageKey, JSON.stringify({
        progress: progressData,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  }, [conceptId, userId]);

  // Debounced cloud sync for notes
  const syncNotesToCloud = useCallback(
    debounce(async (notesData) => {
      if (!conceptId || !userId || !autoSaveEnabled) return;

      const notesString = JSON.stringify(notesData);
      if (notesString === lastSyncRef.current.notes) return;

      try {
        for (const note of notesData) {
          await dispatch(saveNote({
            userId,
            conceptId,
            note
          })).unwrap();
        }
        
        lastSyncRef.current.notes = notesString;
        dispatch(markSaved());
        
        dispatch(showToast({
          message: 'Notes saved successfully',
          type: 'success',
          duration: 2000
        }));
      } catch (error) {
        console.error('Error syncing notes to cloud:', error);
        dispatch(showToast({
          message: 'Failed to save notes',
          type: 'error',
          duration: 3000
        }));
      }
    }, 2000),
    [conceptId, userId, autoSaveEnabled, dispatch]
  );

  // Debounced cloud sync for highlights
  const syncHighlightsToCloud = useCallback(
    debounce(async (highlightsData) => {
      if (!conceptId || !userId || !autoSaveEnabled) return;

      const highlightsString = JSON.stringify(highlightsData);
      if (highlightsString === lastSyncRef.current.highlights) return;

      try {
        await dispatch(saveHighlights({
          userId,
          conceptId,
          highlights: highlightsData
        })).unwrap();
        
        lastSyncRef.current.highlights = highlightsString;
        dispatch(markSaved());
      } catch (error) {
        console.error('Error syncing highlights to cloud:', error);
        dispatch(showToast({
          message: 'Failed to save highlights',
          type: 'error',
          duration: 3000
        }));
      }
    }, 2000),
    [conceptId, userId, autoSaveEnabled, dispatch]
  );

  // Debounced cloud sync for progress
  const syncProgressToCloud = useCallback(
    debounce(async (progressData) => {
      if (!conceptId || !userId) return;

      const progressString = JSON.stringify(progressData);
      if (progressString === lastSyncRef.current.progress) return;

      try {
        await dispatch(updateProgress({
          userId,
          conceptId,
          progress: progressData
        })).unwrap();
        
        lastSyncRef.current.progress = progressString;
      } catch (error) {
        console.error('Error syncing progress to cloud:', error);
      }
    }, 1000),
    [conceptId, userId, dispatch]
  );

  // Auto-sync notes when they change
  useEffect(() => {
    if (notes && notes.length > 0) {
      saveNotesLocally(notes);
      syncNotesToCloud(notes);
    }
  }, [notes, saveNotesLocally, syncNotesToCloud]);

  // Auto-sync highlights when they change
  useEffect(() => {
    if (highlights && highlights.length > 0) {
      saveHighlightsLocally(highlights);
      syncHighlightsToCloud(highlights);
    }
  }, [highlights, saveHighlightsLocally, syncHighlightsToCloud]);

  // Auto-sync progress when it changes
  useEffect(() => {
    if (progress !== null && progress !== undefined) {
      saveProgressLocally(progress);
      syncProgressToCloud(progress);
    }
  }, [progress, saveProgressLocally, syncProgressToCloud]);

  // Manual sync function
  const manualSync = useCallback(async () => {
    if (!conceptId || !userId) return;

    try {
      dispatch(showToast({
        message: 'Syncing...',
        type: 'info',
        duration: 1000
      }));

      await Promise.all([
        syncNotesToCloud.flush(),
        syncHighlightsToCloud.flush(),
        syncProgressToCloud.flush()
      ]);

      dispatch(showToast({
        message: 'All changes synced successfully',
        type: 'success',
        duration: 2000
      }));
    } catch (error) {
      console.error('Error during manual sync:', error);
      dispatch(showToast({
        message: 'Sync failed',
        type: 'error',
        duration: 3000
      }));
    }
  }, [conceptId, userId, syncNotesToCloud, syncHighlightsToCloud, syncProgressToCloud, dispatch]);

  // Toggle bookmark with sync
  const toggleBookmark = useCallback(async () => {
    if (!conceptId || !userId) return;

    try {
      await dispatch(toggleBookmarkAction({
        userId,
        conceptId,
        bookmarked: !bookmarked
      })).unwrap();

      dispatch(showToast({
        message: bookmarked ? 'Bookmark removed' : 'Bookmark added',
        type: 'success',
        duration: 2000
      }));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      dispatch(showToast({
        message: 'Failed to update bookmark',
        type: 'error',
        duration: 3000
      }));
    }
  }, [conceptId, userId, bookmarked, dispatch]);

  // Save draft content (for text editor)
  const saveDraft = useCallback((draftContent) => {
    if (!conceptId || !userId) return;

    try {
      const draftKey = `${STORAGE_KEYS.DRAFT}_${userId}_${conceptId}`;
      localStorage.setItem(draftKey, JSON.stringify({
        content: draftContent,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [conceptId, userId]);

  // Load draft content
  const loadDraft = useCallback(() => {
    if (!conceptId || !userId) return null;

    try {
      const draftKey = `${STORAGE_KEYS.DRAFT}_${userId}_${conceptId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        return parsed.content;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
    return null;
  }, [conceptId, userId]);

  // Clear draft content
  const clearDraft = useCallback(() => {
    if (!conceptId || !userId) return;

    try {
      const draftKey = `${STORAGE_KEYS.DRAFT}_${userId}_${conceptId}`;
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, [conceptId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      // Flush any pending syncs
      syncNotesToCloud.flush();
      syncHighlightsToCloud.flush();
      syncProgressToCloud.flush();
    };
  }, [syncNotesToCloud, syncHighlightsToCloud, syncProgressToCloud]);

  return {
    manualSync,
    toggleBookmark,
    saveDraft,
    loadDraft,
    clearDraft,
    isSyncing: !lastSaved || (Date.now() - new Date(lastSaved).getTime()) > 5000,
    lastSyncTime: lastSaved
  };
};

export default useContentSync;
