import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaSearch,
  FaClock,
  FaTimes,
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaLink
} from 'react-icons/fa';
import {
  addNote,
  updateNote,
  deleteNote
} from '../../store/slices/contentSlice';
import { showToast } from '../../store/slices/uiSlice';
import useContentSync from '../../hooks/useContentSync';

const NotesPanel = ({ conceptId }) => {
  const dispatch = useDispatch();
  const { notes, audio, progress } = useSelector((state) => state.content);
  const { isSyncing, lastSyncTime } = useContentSync(conceptId);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const editorRef = useRef(null);

  // Filter notes by search query
  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort notes by timestamp (newest first)
  const sortedNotes = [...filteredNotes].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const handleCreateNote = useCallback(() => {
    setShowEditor(true);
    setEditingNote(null);
    setNoteContent('');
  }, []);

  const handleEditNote = useCallback((note) => {
    setShowEditor(true);
    setEditingNote(note);
    setNoteContent(note.content);
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!noteContent.trim()) {
      dispatch(showToast({
        message: 'Note content cannot be empty',
        type: 'error',
        duration: 2000
      }));
      return;
    }

    if (editingNote) {
      // Update existing note
      dispatch(updateNote({
        ...editingNote,
        content: noteContent
      }));

      dispatch(showToast({
        message: 'Note updated',
        type: 'success',
        duration: 2000
      }));
    } else {
      // Create new note
      dispatch(addNote({
        content: noteContent,
        timestamp: new Date().toISOString(),
        position: audio.currentTime || progress || 0
      }));

      dispatch(showToast({
        message: 'Note created',
        type: 'success',
        duration: 2000
      }));
    }

    setShowEditor(false);
    setEditingNote(null);
    setNoteContent('');
  }, [noteContent, editingNote, audio.currentTime, progress, dispatch]);

  const handleDeleteNote = useCallback((noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      dispatch(deleteNote(noteId));
      dispatch(showToast({
        message: 'Note deleted',
        type: 'info',
        duration: 2000
      }));
    }
  }, [dispatch]);

  const handleCancelEdit = useCallback(() => {
    setShowEditor(false);
    setEditingNote(null);
    setNoteContent('');
  }, []);

  // Rich text formatting
  const applyFormat = useCallback((format) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = noteContent.substring(start, end);

    let formattedText = '';

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'ul':
        formattedText = `\n- ${selectedText}`;
        break;
      case 'ol':
        formattedText = `\n1. ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent =
      noteContent.substring(0, start) + formattedText + noteContent.substring(end);

    setNoteContent(newContent);

    // Refocus textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + formattedText.length,
        start + formattedText.length
      );
    }, 0);
  }, [noteContent]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatPosition = (position) => {
    if (!position) return '';
    
    const mins = Math.floor(position / 60);
    const secs = Math.floor(position % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            📝 Notes
            <span className="text-sm font-normal text-gray-500">
              ({notes.length})
            </span>
          </h3>
          <button
            onClick={handleCreateNote}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <FaPlus className="text-sm" />
            New
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Sync status */}
        {isSyncing && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            Syncing...
          </div>
        )}
        {lastSyncTime && !isSyncing && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Saved {formatTimestamp(lastSyncTime)}
          </div>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {sortedNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FaClock />
                  <span>{formatTimestamp(note.timestamp)}</span>
                  {note.position > 0 && (
                    <>
                      <span>•</span>
                      <span>@ {formatPosition(note.position)}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="p-1 text-gray-500 hover:text-primary-600"
                    title="Edit note"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Delete note"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                {note.content}
              </div>

              {note.updatedAt && (
                <div className="mt-2 text-xs text-gray-400">
                  Edited {formatTimestamp(note.updatedAt)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'No notes match your search' : 'No notes yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNote}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Create your first note
              </button>
            )}
          </div>
        )}
      </div>

      {/* Editor modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {/* Formatting toolbar */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-lg border">
                <button
                  onClick={() => applyFormat('bold')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Bold"
                >
                  <FaBold />
                </button>
                <button
                  onClick={() => applyFormat('italic')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Italic"
                >
                  <FaItalic />
                </button>
                <button
                  onClick={() => applyFormat('underline')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Underline"
                >
                  <FaUnderline />
                </button>
                <div className="w-px h-6 bg-gray-300" />
                <button
                  onClick={() => applyFormat('ul')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Bullet list"
                >
                  <FaListUl />
                </button>
                <button
                  onClick={() => applyFormat('ol')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Numbered list"
                >
                  <FaListOl />
                </button>
                <button
                  onClick={() => applyFormat('link')}
                  className="p-2 hover:bg-gray-200 rounded"
                  title="Insert link"
                >
                  <FaLink />
                </button>
              </div>

              {/* Text editor */}
              <textarea
                ref={editorRef}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your note here... You can use markdown formatting."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                autoFocus
              />

              {/* Character count */}
              <div className="mt-2 text-xs text-gray-500 text-right">
                {noteContent.length} characters
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <FaSave />
                  {editingNote ? 'Update' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesPanel;
