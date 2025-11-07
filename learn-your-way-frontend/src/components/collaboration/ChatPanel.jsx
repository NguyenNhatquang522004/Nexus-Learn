import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
  Stack,
  Popover,
  Badge,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import {
  addMessage,
  markMessagesRead,
  setTypingUser
} from '../../store/slices/collaborationSlice';

const EMOJI_LIST = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🤔',
  '✅', '❌', '⭐', '🔥', '💡', '📚', '✏️', '🎯'
];

const Message = ({ message, isMe, showAvatar }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        mb: 2,
        gap: 1
      }}
    >
      {!isMe && showAvatar && (
        <Avatar
          src={message.user.avatar}
          sx={{ width: 32, height: 32 }}
        >
          {message.user.name?.[0]?.toUpperCase()}
        </Avatar>
      )}
      {!isMe && !showAvatar && <Box sx={{ width: 32 }} />}

      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMe ? 'flex-end' : 'flex-start'
        }}
      >
        {showAvatar && !isMe && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, px: 1 }}>
            {message.user.name}
          </Typography>
        )}
        
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            bgcolor: isMe ? 'primary.main' : 'background.paper',
            color: isMe ? 'white' : 'text.primary',
            borderRadius: 2,
            borderTopLeftRadius: !isMe && showAvatar ? 0 : 2,
            borderTopRightRadius: isMe && showAvatar ? 0 : 2,
            wordBreak: 'break-word'
          }}
        >
          <Typography variant="body2">{message.text}</Typography>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 1 }}>
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </Typography>
      </Box>

      {isMe && showAvatar && (
        <Avatar
          src={message.user.avatar}
          sx={{ width: 32, height: 32 }}
        >
          {message.user.name?.[0]?.toUpperCase()}
        </Avatar>
      )}
      {isMe && !showAvatar && <Box sx={{ width: 32 }} />}
    </Box>
  );
};

const TypingIndicator = ({ users }) => {
  if (users.length === 0) return null;

  const names = users.slice(0, 2).join(', ');
  const text = users.length === 1
    ? `${names} is typing...`
    : users.length === 2
    ? `${names} are typing...`
    : `${names} and ${users.length - 2} others are typing...`;

  return (
    <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: `${i * 0.16}s`,
              '@keyframes bounce': {
                '0%, 80%, 100%': { transform: 'scale(0)' },
                '40%': { transform: 'scale(1)' }
              }
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
};

const ChatPanel = ({ height = '600px' }) => {
  const dispatch = useDispatch();
  const {
    messages,
    participants,
    myParticipantId,
    typingUsers,
    roomId
  } = useSelector((state) => state.collaboration);
  
  const currentUser = useSelector((state) => state.auth.user);
  const messagesEndRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const typingUserNames = typingUsers
    .map(id => participants.find(p => p.id === id)?.name)
    .filter(Boolean);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when component mounts or messages change
    dispatch(markMessagesRead());
  }, [dispatch, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send typing indicator
    dispatch(setTypingUser({ userId: myParticipantId, isTyping: true }));

    // Set timeout to clear typing indicator
    const timeout = setTimeout(() => {
      dispatch(setTypingUser({ userId: myParticipantId, isTyping: false }));
    }, 3000);

    setTypingTimeout(timeout);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const message = {
      id: `msg-${Date.now()}`,
      text: messageText.trim(),
      userId: myParticipantId,
      user: {
        id: currentUser.id,
        name: currentUser.name || currentUser.username,
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString(),
      roomId
    };

    dispatch(addMessage(message));
    setMessageText('');
    
    // Clear typing indicator
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    dispatch(setTypingUser({ userId: myParticipantId, isTyping: false }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText((prev) => prev + emoji);
    setEmojiAnchor(null);
  };

  const shouldShowAvatar = (index) => {
    if (index === 0) return true;
    const currentMsg = messages[index];
    const prevMsg = messages[index - 1];
    return currentMsg.userId !== prevMsg.userId;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h6">Chat</Typography>
          <Typography variant="caption">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: 'white' }}>
          <MoreIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: 'background.default',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'background.paper'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: '4px',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No messages yet
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Start the conversation!<br />
              Share ideas, ask questions, and collaborate.
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => (
              <Message
                key={message.id || index}
                message={message}
                isMe={message.userId === myParticipantId}
                showAvatar={shouldShowAvatar(index)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Typing Indicator */}
      <TypingIndicator users={typingUserNames} />

      <Divider />

      {/* Input Area */}
      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            multiline
            maxRows={4}
            fullWidth
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
          />

          <Tooltip title="Emoji">
            <IconButton
              color="primary"
              onClick={(e) => setEmojiAnchor(e.currentTarget)}
            >
              <EmojiIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Attach file">
            <IconButton color="primary">
              <AttachIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Send message">
            <span>
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {EMOJI_LIST.map((emoji, index) => (
            <IconButton
              key={index}
              onClick={() => handleEmojiSelect(emoji)}
              sx={{ fontSize: '1.5rem' }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Paper>
  );
};

export default ChatPanel;
