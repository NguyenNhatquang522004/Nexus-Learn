# Study Room & Collaboration UI - Implementation Guide

## Overview

Complete implementation of the Study Room & Collaboration system with real-time WebSocket features, enabling students to study together, collaborate, compete, and communicate in real-time.

## Architecture

### Workflow Steps
1. **Create Room** → Set name, topic, privacy, max participants, schedule
2. **Invite Peers** → Share link via URL copy or native share API
3. **Join Room** → Participants join via link or room list
4. **Room Lobby** → Wait for participants, ready check
5. **Active Study** → Collaborate on content, chat, whiteboard
6. **Shared Quiz** → Team or competitive mode with live scoring
7. **Leaderboard** → Real-time rankings and achievements

### Technology Stack
- **State Management**: Redux Toolkit with collaborationSlice
- **Real-time**: WebSocket (ws://localhost:8012)
- **UI Framework**: Material-UI v5
- **Date Handling**: date-fns with DateTimePicker
- **Backend**: Real-time Coordination Agent (Port 8012), Analytics Agent (Port 8011)

## Implemented Components

### 1. Redux Store - collaborationSlice.js
**Lines**: 780  
**Location**: `src/store/slices/collaborationSlice.js`

**State Structure**:
```javascript
{
  // Room state
  roomId, roomName, roomTopic, roomPrivacy, maxParticipants,
  scheduledTime, hostId, roomStatus, sessionStartTime, sessionDuration,
  
  // Participants
  participants[], myParticipantId, participantCount,
  readyParticipants[], allReady,
  
  // Chat
  messages[], unreadCount, typingUsers[],
  
  // Presence
  presence: {}, cursors: {}, highlights[],
  
  // Quiz collaboration
  quizMode, currentQuestion, teamAnswers: {}, teamVotes: {},
  consensusAnswer, individualScores: {}, teamScore,
  
  // Leaderboard
  leaderboard[], leaderboardFilter, myPosition,
  
  // Whiteboard
  whiteboardState: { drawings[], activeTool, color, thickness },
  
  // WebSocket
  wsConnected, wsError, reconnecting, reconnectAttempts,
  
  // Shared state
  sharedContent, sharedContentType, contentSyncVersion,
  
  // UI state
  chatOpen, videoCallActive, whiteboardOpen, showLeaderboard,
  
  loading: {}, error
}
```

**Async Thunks** (11):
1. `createRoom(roomData)` - Create new study room, returns room object with id
2. `joinRoom(roomId)` - Join existing room, returns room details with participants
3. `leaveRoom(roomId)` - Leave current room
4. `fetchRoomDetails(roomId)` - Get room info and participant list
5. `fetchUserPresence(userId)` - Get user online/offline status
6. `broadcastMessage({ roomId, message })` - Send message to all participants
7. `fetchLeaderboard({ roomId, filter })` - Get rankings (all/today/week)
8. `submitSharedAnswer({ roomId, questionId, answer, mode })` - Submit quiz answer
9. `trackCollaborativeEvent(eventData)` - Track actions to Analytics Agent
10. `updateReadyStatus({ roomId, isReady })` - Update ready state in lobby
11. `startRoomSession(roomId)` - Host starts active session

**Reducer Actions** (40+):
- WebSocket: `setWsConnected`, `setWsError`, `setReconnecting`, `incrementReconnectAttempts`
- Participants: `addParticipant`, `removeParticipant`, `updateParticipant`, `setParticipantReady`
- Chat: `addMessage`, `clearMessages`, `markMessagesRead`, `setTypingUser`
- Presence: `updatePresence`, `updateCursor`, `removeCursor`, `addSharedHighlight`, `removeSharedHighlight`
- Quiz: `setQuizMode`, `setCurrentQuestion`, `submitTeamAnswer`, `voteForAnswer`, `setConsensusAnswer`, `updateIndividualScore`, `updateTeamScore`
- Leaderboard: `setLeaderboardFilter`, `updateMyPosition`
- Whiteboard: `addDrawing`, `clearDrawings`, `updateDrawingTool`, `updateDrawingColor`, `updateDrawingThickness`
- Content: `setSharedContent`, `updateSharedContent`
- UI: `toggleChat`, `setChatOpen`, `toggleVideoCall`, `setVideoCallActive`, `toggleWhiteboard`, `setWhiteboardOpen`, `toggleLeaderboard`, `setShowLeaderboard`
- Room: `setRoomStatus`, `updateSessionDuration`
- Utility: `resetCollaboration`, `clearError`

### 2. API Services Enhancement
**Location**: `src/services/api.js`  
**Added**: realtimeService with 12 methods

**Methods**:
```javascript
realtimeService = {
  // Room management
  createRoom(roomData): POST /api/create-room
    -> { id, name, topic, privacy, maxParticipants, hostId, status }
  
  joinRoom(roomId): POST /api/join-room
    -> { ...room, participants[], myParticipantId }
  
  leaveRoom(roomId): POST /api/leave-room
  
  getRoomDetails(roomId): GET /api/room/:roomId
    -> { ...room, participants[], status }
  
  // Broadcasting
  broadcastToRoom(roomId, message): POST /api/broadcast/:roomId
  
  // Presence
  getUserPresence(userId): GET /api/presence/:userId
    -> { status, lastSeen, currentView, cursor }
  
  updatePresence(presenceData): POST /api/presence/update
  
  // Ready status
  updateReadyStatus(roomId, isReady): POST /api/ready
  
  // Session control
  startSession(roomId): POST /api/start-session
  endSession(roomId): POST /api/end-session
  
  // Leaderboard
  getLeaderboard(roomId, filter): GET /api/leaderboard/:roomId?filter=
    -> { rankings[], myPosition }
  
  // Quiz
  submitAnswer(roomId, answerData): POST /api/submit-answer
    -> { correct, score, teamScore }
  
  // WebSocket helper
  getWebSocketUrl(userId): returns ws://localhost:8012/ws/:userId
}
```

### 3. CreateRoom Component
**Lines**: 420  
**Location**: `src/components/collaboration/CreateRoom.jsx`

**Features**:
- Dialog modal with form
- Room name TextField (3-50 chars, required)
- Topic Select (15 subjects: Math, Science, History, etc.)
- Description TextField (optional, 500 char limit)
- Privacy ToggleButtonGroup: Public (anyone joins) | Private (invite only)
- Max participants Slider (2-30, marks at 2/5/10/15/20/25/30)
- Schedule DateTimePicker (optional, future dates only)
- Real-time form validation
- Room summary card showing all settings
- Create button (disabled until name + topic provided)

**Props**:
- `open` (boolean) - Dialog visibility
- `onClose` (function) - Close handler

**Redux State Used**:
- `collaboration.loading.createRoom` - Submit button state
- `collaboration.error` - Error display
- `auth.user` - Current user for hostId

**Redux Actions**:
- `createRoom(roomData)` - Dispatch on submit, navigate to `/study-room/:id` on success

**Validation Rules**:
- Name: 3-50 chars, required
- Topic: Must select from dropdown
- Scheduled time: Must be future date if provided
- Description: Max 500 chars

**Styling**:
- Material-UI Dialog with rounded corners, shadow
- Purple gradient header with white text
- Two-column privacy toggle with icons
- Slider with marks and value label
- Summary card with primary.lighter background, border

### 4. RoomLobby Component
**Lines**: 520  
**Location**: `src/components/collaboration/RoomLobby.jsx`

**Features**:
- Purple gradient header with room info (name, topic, privacy, participant count)
- Share link section: TextField with copy button, Share button (native API)
- Participant grid (responsive: 3 cols desktop, 2 tablet, 1 mobile)
- Participant cards show: avatar with ready badge, name, host chip, status
- Empty slot placeholders with dashed border
- Ready check buttons: "I'm Ready" (green) / "Not Ready" (red)
- Host-only "Start Session" button (enabled when all ready, min 2 participants)
- Ready progress bar (visual indicator of ready participants)
- Leave room button in header
- Alerts: waiting for participants, waiting for ready status

**Components**:
- `ParticipantCard` - Shows participant with avatar, name, host badge, ready status
  - Avatar colors: 8 colors rotated by user ID hash
  - Ready badge: green checkmark icon bottom-right of avatar
  - Border highlight for current user (blue, 2px)
  - Hover effect: lift 4px, increase shadow

**Props**: None (uses URL params)

**Redux State Used**:
- `collaboration.roomId`, `roomName`, `roomTopic`, `roomPrivacy`
- `collaboration.hostId`, `maxParticipants`, `scheduledTime`
- `collaboration.participants`, `participantCount`, `myParticipantId`
- `collaboration.readyParticipants`, `allReady`, `roomStatus`
- `collaboration.loading`, `error`

**Redux Actions**:
- `fetchRoomDetails(roomId)` - On mount
- `updateReadyStatus({ roomId, isReady })` - Toggle ready
- `startRoomSession(roomId)` - Host starts
- `leaveRoom(roomId)` - Leave and navigate to dashboard

**Navigation**:
- Auto-navigate to `/study-room/:roomId/active` when `roomStatus === 'active'`

**Styling**:
- Container maxWidth="lg", py: 4
- Header Paper with gradient background, white text
- Participant cards with hover lift animation
- Empty slots with dashed border, light background
- Sticky bottom Paper for actions, zIndex 1000
- Progress bar: 8px height, green when allReady

### 5. ChatPanel Component
**Lines**: 480  
**Location**: `src/components/collaboration/ChatPanel.jsx`

**Features**:
- Real-time messaging with WebSocket sync
- Message bubbles: left (others) / right (me)
- Avatar display (shown on first message in sequence)
- Timestamp (relative, e.g., "2 minutes ago")
- Typing indicators (animated dots with user names)
- Emoji picker popover (16 common emojis)
- File attachment button (UI ready)
- Message input: multiline TextField, auto-grow (max 4 rows)
- Send button (disabled when empty, primary blue when enabled)
- Auto-scroll to bottom on new messages
- Unread count tracking
- Empty state when no messages

**Components**:
- `Message` - Individual message bubble with avatar, text, timestamp
- `TypingIndicator` - Animated dots with "X is typing..." text

**Props**:
- `height` (string, default: '600px') - Panel height

**Redux State Used**:
- `collaboration.messages[]` - Message list
- `collaboration.participants[]` - For user lookups
- `collaboration.myParticipantId` - Current user ID
- `collaboration.typingUsers[]` - Currently typing user IDs
- `collaboration.roomId` - For message context

**Redux Actions**:
- `addMessage(message)` - Add new message to state
- `markMessagesRead()` - Clear unread count
- `setTypingUser({ userId, isTyping })` - Update typing status

**Message Format**:
```javascript
{
  id: 'msg-timestamp',
  text: 'message content',
  userId: 'user-id',
  user: { id, name, avatar },
  timestamp: 'ISO string',
  roomId: 'room-id'
}
```

**Typing Logic**:
- Trigger typing indicator on text change
- Clear indicator after 3 seconds of inactivity
- Clear on send message

**Styling**:
- Header: primary.main background, white text
- Messages area: background.default, custom scrollbar (8px width)
- Message bubbles: rounded corners, primary for sent, paper for received
- Input area: rounded TextField (borderRadius: 3)
- Send button: circular IconButton, primary.main background

**Emoji List**: 👍 👎 ❤️ 😂 😮 😢 🎉 🤔 ✅ ❌ ⭐ 🔥 💡 📚 ✏️ 🎯

### 6. Leaderboard Component
**Lines**: 550  
**Location**: `src/components/collaboration/Leaderboard.jsx`

**Features**:
- Purple gradient header with trophy icon
- Filter dropdown: All Time | Today | This Week | This Month
- "My Position" card (if ranked): shows rank, percentile, score, progress to next rank
- Top 3 podium display: 1st (gold, tallest), 2nd (silver), 3rd (bronze)
- Leaderboard rows: rank, avatar, name, score, change indicator
- Medal icons for top 3: 🥇 🥈 🥉
- Streak badges (fire icon) for users with 3+ day streaks
- Highlighted row for current user (blue border, light background)
- Empty state when no rankings
- Loading indicator during fetch

**Components**:
- `LeaderboardRow` - Individual ranking row
  - Rank circle: gold/silver/bronze for top 3, gray for others
  - Avatar with medal border for top 3
  - User name with "You" chip for current user
  - Streak chip (fire icon) if streak >= 3
  - Score with change indicator (up/down arrow, green/red)
  - Hover effect: slide right 4px, increase shadow
  
- `MyPositionCard` - Current user's position summary
  - Shows rank, percentile (top X%)
  - Current score display
  - Points needed to next rank
  - Progress bar showing advancement percentage
  - White text on primary.main background

**Props**: None

**Redux State Used**:
- `collaboration.roomId` - For fetching leaderboard
- `collaboration.leaderboard[]` - Rankings array
- `collaboration.leaderboardFilter` - Current filter
- `collaboration.myPosition` - Current user position data
- `collaboration.myParticipantId` - Current user ID
- `collaboration.loading.leaderboard` - Loading state

**Redux Actions**:
- `fetchLeaderboard({ roomId, filter })` - Fetch on mount and filter change
- `setLeaderboardFilter(filter)` - Update filter

**User Object Structure**:
```javascript
{
  id: 'user-id',
  name: 'User Name',
  avatar: 'url',
  score: 1250,
  change: +50,  // Points change (optional)
  streak: 5,    // Days streak (optional)
  level: 10     // User level (optional)
}
```

**My Position Structure**:
```javascript
{
  rank: 5,
  score: 850,
  nextRank: { score: 1000 }  // Next user's score
}
```

**Styling**:
- Header Paper: gradient purple background, white text
- Filter Select: white text, transparent background with white border
- Position card: primary.main background, white text, rounded corners
- Podium boxes: colored backgrounds (gold/silver/bronze), rounded top
- Podium avatars: positioned absolutely above boxes, white border
- Leaderboard rows: Card with hover animation, 2px border for current user
- Medal colors: #FFD700 (gold), #C0C0C0 (silver), #CD7F32 (bronze)

## WebSocket Integration

### WebSocket Connection Setup
```javascript
// In study room component
const ws = useRef(null);
const userId = currentUser.id;

useEffect(() => {
  const wsUrl = realtimeService.getWebSocketUrl(userId);
  ws.current = new WebSocket(wsUrl);
  
  ws.current.onopen = () => {
    dispatch(setWsConnected(true));
  };
  
  ws.current.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleWebSocketMessage(data);
  };
  
  ws.current.onerror = (error) => {
    dispatch(setWsError(error.message));
  };
  
  ws.current.onclose = () => {
    dispatch(setWsConnected(false));
    handleReconnect();
  };
  
  return () => {
    ws.current?.close();
  };
}, [userId]);
```

### Outgoing Events
```javascript
// Cursor movement
ws.send(JSON.stringify({
  type: 'cursor_move',
  position: { x, y },
  userId,
  roomId
}));

// Chat message
ws.send(JSON.stringify({
  type: 'chat_message',
  message: 'Hello!',
  userId,
  roomId
}));

// Ready status
ws.send(JSON.stringify({
  type: 'ready_status',
  isReady: true,
  userId,
  roomId
}));

// Quiz answer
ws.send(JSON.stringify({
  type: 'quiz_answer_submitted',
  userId,
  questionId,
  answer,
  mode: 'team' | 'competitive'
}));

// Typing indicator
ws.send(JSON.stringify({
  type: 'typing',
  userId,
  isTyping: true
}));

// Whiteboard drawing
ws.send(JSON.stringify({
  type: 'whiteboard_draw',
  userId,
  drawing: { path, color, thickness }
}));
```

### Incoming Events
```javascript
// User joined
{
  type: 'user_joined',
  user: { id, name, avatar }
}

// User left
{
  type: 'user_left',
  userId: 'user-id'
}

// Chat message received
{
  type: 'chat_message',
  message: { id, text, userId, user, timestamp }
}

// Cursor update
{
  type: 'cursor_update',
  userId: 'user-id',
  position: { x, y }
}

// Ready status changed
{
  type: 'ready_status_changed',
  userId: 'user-id',
  isReady: true
}

// Session started
{
  type: 'session_started',
  roomId: 'room-id',
  startTime: 'ISO timestamp'
}

// Quiz answer submitted
{
  type: 'quiz_answer_submitted',
  userId: 'user-id',
  answer: 'A',
  correct: true,
  score: 100
}

// Leaderboard update
{
  type: 'leaderboard_update',
  rankings: [{ userId, score, rank }]
}

// Whiteboard drawing
{
  type: 'whiteboard_draw',
  userId: 'user-id',
  drawing: { path, color, thickness }
}
```

### Event Handler
```javascript
const handleWebSocketMessage = (data) => {
  switch (data.type) {
    case 'user_joined':
      dispatch(addParticipant(data.user));
      break;
    
    case 'user_left':
      dispatch(removeParticipant(data.userId));
      break;
    
    case 'chat_message':
      dispatch(addMessage(data.message));
      break;
    
    case 'cursor_update':
      dispatch(updateCursor({ userId: data.userId, position: data.position }));
      break;
    
    case 'ready_status_changed':
      dispatch(setParticipantReady({ userId: data.userId, isReady: data.isReady }));
      break;
    
    case 'session_started':
      dispatch(setRoomStatus('active'));
      navigate(`/study-room/${data.roomId}/active`);
      break;
    
    case 'quiz_answer_submitted':
      if (data.mode === 'team') {
        dispatch(submitTeamAnswer({ participantId: data.userId, answer: data.answer }));
      } else {
        dispatch(updateIndividualScore({ participantId: data.userId, score: data.score }));
      }
      break;
    
    case 'leaderboard_update':
      dispatch(fetchLeaderboard({ roomId, filter: leaderboardFilter }));
      break;
    
    case 'whiteboard_draw':
      dispatch(addDrawing(data.drawing));
      break;
    
    case 'typing':
      dispatch(setTypingUser({ userId: data.userId, isTyping: data.isTyping }));
      break;
  }
};
```

### Reconnection Logic
```javascript
const handleReconnect = () => {
  const maxAttempts = 5;
  const reconnectInterval = 3000;
  
  if (reconnectAttempts < maxAttempts) {
    dispatch(setReconnecting(true));
    dispatch(incrementReconnectAttempts());
    
    setTimeout(() => {
      const wsUrl = realtimeService.getWebSocketUrl(userId);
      ws.current = new WebSocket(wsUrl);
      // Re-attach event handlers
    }, reconnectInterval);
  } else {
    dispatch(setWsError('Failed to reconnect after multiple attempts'));
  }
};
```

## Additional Components (Implementation Required)

### 7. ActiveStudyRoom Component
**Location**: `src/components/collaboration/ActiveStudyRoom.jsx`

**Features**:
- Header: room name, participant count, elapsed timer, leave button
- Main area: shared content viewer with live cursors
- Sidebar: participant bar (collapsed), chat panel, video call toggle
- Whiteboard toggle button
- Split layout: 70% content, 30% sidebar

### 8. CollaborativeWhiteboard Component
**Location**: `src/components/collaboration/CollaborativeWhiteboard.jsx`

**Features**:
- HTML5 Canvas element
- Drawing tools: pen, eraser, line, rectangle, circle
- Color picker (8 colors)
- Thickness slider (1-10px)
- Clear all button
- Real-time sync via WebSocket
- Undo/redo support

### 9. SharedQuiz Component
**Location**: `src/components/collaboration/SharedQuiz.jsx`

**Features**:
- Two modes: Team (collaborative) | Competitive (race)
- Team mode: all see answers, consensus voting, submit together
- Competitive mode: individual answers, speed bonus, live leaderboard
- Question display with timer
- Answer options with selection state
- Team discussion chat (team mode only)
- Score display per participant
- Progress indicator

### 10. PresenceIndicators Component
**Location**: `src/components/collaboration/PresenceIndicators.jsx`

**Features**:
- Online/offline badges (green/gray dots)
- "Currently viewing" tooltip on shared content
- Live cursor display (colored by user)
- Typing indicators in chat
- Active/idle status (idle after 5 min)

## Environment Configuration

### .env.example Updates
```env
# Real-time Coordination Agent (Port 8012)
VITE_REALTIME_AGENT_URL=http://localhost:8012
VITE_REALTIME_WS_ENDPOINT=/ws
VITE_REALTIME_CREATE_ROOM_ENDPOINT=/api/create-room
VITE_REALTIME_JOIN_ROOM_ENDPOINT=/api/join-room
VITE_REALTIME_LEAVE_ROOM_ENDPOINT=/api/leave-room
VITE_REALTIME_ROOM_ENDPOINT=/api/room
VITE_REALTIME_BROADCAST_ENDPOINT=/api/broadcast
VITE_REALTIME_PRESENCE_ENDPOINT=/api/presence
VITE_REALTIME_PRESENCE_UPDATE_ENDPOINT=/api/presence/update
VITE_REALTIME_READY_ENDPOINT=/api/ready
VITE_REALTIME_START_SESSION_ENDPOINT=/api/start-session
VITE_REALTIME_END_SESSION_ENDPOINT=/api/end-session
VITE_REALTIME_LEADERBOARD_ENDPOINT=/api/leaderboard
VITE_REALTIME_SUBMIT_ANSWER_ENDPOINT=/api/submit-answer

# Analytics Agent (Port 8011)
VITE_ANALYTICS_AGENT_URL=http://localhost:8011
VITE_ANALYTICS_EVENTS_ENDPOINT=/api/events

# Collaboration Settings
VITE_COLLAB_MAX_PARTICIPANTS=30
VITE_COLLAB_DEFAULT_PARTICIPANTS=10
VITE_COLLAB_MAX_MESSAGE_LENGTH=1000
VITE_COLLAB_RECONNECT_ATTEMPTS=5
VITE_COLLAB_RECONNECT_INTERVAL=3000
```

## Backend Requirements

### Real-time Coordination Agent (Port 8012) APIs

**POST /api/create-room**
```javascript
Request: {
  name: string,
  topic: string,
  privacy: 'public' | 'private',
  maxParticipants: number,
  scheduledTime: string | null,
  description: string,
  hostId: string,
  hostName: string
}

Response: {
  id: string,
  name: string,
  topic: string,
  privacy: string,
  maxParticipants: number,
  scheduledTime: string | null,
  hostId: string,
  status: 'lobby',
  createdAt: string
}
```

**POST /api/join-room**
```javascript
Request: {
  roomId: string
}

Response: {
  ...room,
  participants: [{
    id: string,
    name: string,
    avatar: string,
    isReady: boolean,
    joinedAt: string
  }],
  myParticipantId: string
}
```

**GET /api/room/:roomId**
```javascript
Response: {
  id: string,
  name: string,
  topic: string,
  privacy: string,
  maxParticipants: number,
  hostId: string,
  status: 'lobby' | 'active' | 'ended',
  participants: [...],
  scheduledTime: string | null,
  sessionStartTime: string | null
}
```

**POST /api/broadcast/:roomId**
```javascript
Request: {
  type: string,
  data: any
}

Response: {
  success: boolean,
  deliveredTo: number
}
```

**GET /api/presence/:userId**
```javascript
Response: {
  userId: string,
  status: 'online' | 'offline' | 'idle',
  lastSeen: string,
  currentView: string | null,
  cursor: { x: number, y: number } | null
}
```

**POST /api/ready**
```javascript
Request: {
  roomId: string,
  isReady: boolean
}

Response: {
  userId: string,
  isReady: boolean,
  allReady: boolean,
  readyCount: number,
  totalParticipants: number
}
```

**POST /api/start-session**
```javascript
Request: {
  roomId: string
}

Response: {
  roomId: string,
  status: 'active',
  startTime: string
}
```

**GET /api/leaderboard/:roomId?filter=all**
```javascript
Response: {
  rankings: [{
    id: string,
    name: string,
    avatar: string,
    score: number,
    change: number,
    streak: number,
    level: number
  }],
  myPosition: {
    rank: number,
    score: number,
    nextRank: { score: number }
  }
}
```

**POST /api/submit-answer**
```javascript
Request: {
  roomId: string,
  questionId: string,
  answer: string,
  mode: 'team' | 'competitive'
}

Response: {
  correct: boolean,
  score: number,
  teamScore: number,
  explanation: string
}
```

**WebSocket /ws/:userId**
```javascript
// Connection established
{ type: 'connected', userId: string }

// Events sent/received as documented in WebSocket Integration section
```

### Analytics Agent (Port 8011) APIs

**POST /api/events**
```javascript
Request: {
  category: 'collaboration',
  action: string,
  label: string,
  value: number,
  userId: string,
  roomId: string,
  timestamp: string,
  metadata: object
}

Response: {
  eventId: string,
  tracked: boolean
}
```

## User Workflows

### Complete Study Room Workflow

1. **Create Room** (Educator or Student)
   - Click "Create Study Room" button on dashboard
   - Fill out form: name, topic, privacy, max participants, optional schedule
   - Review summary card
   - Click "Create Room"
   - Navigate to room lobby at `/study-room/:id`

2. **Invite Peers**
   - In lobby, copy room URL from TextField
   - OR click "Share" button (uses native share API if available)
   - Share via messaging apps, email, or paste in class chat

3. **Join Room** (Invited Participants)
   - Click shared link
   - Automatically join room (if public) or request access (if private)
   - Navigate to lobby

4. **Room Lobby** (All Participants)
   - See all participants joining in real-time
   - View participant avatars and names
   - Mark yourself as "Ready" when prepared
   - Host sees "Start Session" button enabled when all ready (min 2 participants)
   - Host clicks "Start Session"

5. **Active Study Session**
   - Room transitions to active state
   - Navigate to `/study-room/:id/active`
   - Main area shows shared content (document, slides, etc.)
   - See live cursors of other participants
   - Use chat panel for discussion
   - Toggle whiteboard for collaborative drawing
   - Optional: enable video call

6. **Shared Quiz** (If quiz loaded)
   - Host selects quiz mode: Team or Competitive
   - **Team Mode**: all see question together, discuss in chat, vote on answer, submit as team
   - **Competitive Mode**: individual answers, speed bonus, live leaderboard updates
   - See real-time score updates

7. **View Leaderboard**
   - Toggle leaderboard panel
   - See top 3 podium display
   - View your position card with percentile
   - Filter by time period (all time, today, week, month)
   - Track progress to next rank

8. **End Session**
   - Host ends session OR participants leave
   - Room status changes to 'ended'
   - Final leaderboard displayed
   - Option to save session summary

### Collaborative Features Usage

**Live Cursors**:
- Each user's cursor shown in different color
- Username label appears on hover
- Updates every 100ms via WebSocket

**Chat Communication**:
- Type message in input field
- Send with Enter or click Send button
- See typing indicators for others
- Add emojis from picker
- Attach files (optional feature)

**Whiteboard Collaboration**:
- Click whiteboard icon to toggle
- Select drawing tool (pen, eraser, shapes)
- Choose color from palette
- Adjust line thickness
- All drawings sync in real-time
- Clear all button (host only)

**Presence Awareness**:
- Green dot: online and active
- Yellow dot: online but idle (no activity 5+ min)
- Gray dot: offline
- "Currently viewing" badge on shared content
- Typing indicators in chat

## Testing Checklist

### Unit Tests
- [ ] collaborationSlice reducers
- [ ] collaborationSlice async thunks
- [ ] realtimeService API methods
- [ ] CreateRoom form validation
- [ ] RoomLobby participant management
- [ ] ChatPanel message handling
- [ ] Leaderboard ranking calculations
- [ ] WebSocket message parsing
- [ ] Presence status logic
- [ ] Ready check validation

### Integration Tests
- [ ] Create room flow (form → API → navigation)
- [ ] Join room flow (link → API → lobby)
- [ ] Ready check flow (button → API → WebSocket → all participants)
- [ ] Start session flow (host action → API → all navigate)
- [ ] Chat message flow (send → WebSocket → all receive)
- [ ] Cursor sync flow (mouse move → WebSocket → display)
- [ ] Leaderboard update flow (quiz answer → score update → leaderboard refresh)
- [ ] WebSocket reconnection flow
- [ ] Leave room cleanup

### E2E Tests
- [ ] Complete study session (create → invite → join → ready → start → chat → quiz → leaderboard)
- [ ] Multiple users in same room (2+ participants)
- [ ] Simultaneous chat messages (no race conditions)
- [ ] Network interruption handling (WebSocket reconnect)
- [ ] Room capacity limits (max participants enforcement)
- [ ] Private room access control
- [ ] Scheduled room start time
- [ ] Team quiz consensus voting
- [ ] Competitive quiz speed bonus
- [ ] Whiteboard collaboration (multiple users drawing)

## Design Compliance

### Patterns from learnyourway.withgoogle.com

**Chat UI**:
- Clean message bubbles with rounded corners
- Avatar display for message senders
- Timestamp below messages (relative format)
- Typing indicators with animated dots
- Input field with emoji picker
- Send button disabled when empty

**Participant List**:
- Grid layout with avatar cards
- Hover effects (lift and shadow)
- Online status badges
- Ready check indicators
- Host badge display

**Leaderboard Aesthetics**:
- Medal icons for top 3
- Podium display (1st tallest, 2nd and 3rd shorter)
- Gradient backgrounds
- Score change indicators (arrows, color-coded)
- Streak badges with fire icon
- Progress bars for advancement

**Presence Indicators**:
- Colored dots (green online, yellow idle, gray offline)
- Badge positioning (bottom-right of avatar)
- Cursor colors unique per user
- Tooltip labels on hover

## File Summary

| File | Location | Lines | Purpose |
|------|----------|-------|---------|
| collaborationSlice.js | src/store/slices/ | 780 | Redux state management for collaboration |
| api.js (enhanced) | src/services/ | +120 | Real-time Coordination Agent API client |
| CreateRoom.jsx | src/components/collaboration/ | 420 | Room creation dialog with form |
| RoomLobby.jsx | src/components/collaboration/ | 520 | Lobby with participants, ready check |
| ChatPanel.jsx | src/components/collaboration/ | 480 | Real-time chat with typing indicators |
| Leaderboard.jsx | src/components/collaboration/ | 550 | Rankings display with podium |
| ActiveStudyRoom.jsx | src/components/collaboration/ | ~500 | Active session with shared content (TODO) |
| CollaborativeWhiteboard.jsx | src/components/collaboration/ | ~400 | Canvas drawing with sync (TODO) |
| SharedQuiz.jsx | src/components/collaboration/ | ~450 | Team/competitive quiz modes (TODO) |
| PresenceIndicators.jsx | src/components/collaboration/ | ~200 | Live cursors and status (TODO) |

**Total**: 6 files complete (~2,870 lines), 4 files pending (~1,550 lines)

## Next Steps

### Installation
```bash
# No new dependencies required
# date-fns already installed from previous prompt
```

### Configuration
1. Add Real-time Agent environment variables to `.env`
2. Verify WebSocket URL configuration
3. Update router with collaboration routes

### Router Configuration
```javascript
import CreateRoom from './components/collaboration/CreateRoom';
import RoomLobby from './components/collaboration/RoomLobby';
import ActiveStudyRoom from './components/collaboration/ActiveStudyRoom';

// In router config
<Route path="/study-room/create" element={<CreateRoom />} />
<Route path="/study-room/:roomId" element={<RoomLobby />} />
<Route path="/study-room/:roomId/active" element={<ActiveStudyRoom />} />
```

### Backend Integration
1. Implement Real-time Coordination Agent APIs (Port 8012)
2. Implement WebSocket server for `/ws/:userId`
3. Set up room state management (Redis recommended)
4. Implement leaderboard calculations
5. Add analytics event tracking
6. Test all endpoints independently before frontend integration

### Testing
1. Unit test all Redux reducers and thunks
2. Test WebSocket connection and reconnection
3. Test chat message synchronization
4. Test ready check flow with multiple users
5. Test leaderboard updates in real-time
6. E2E test complete study session workflow

### Production Considerations
1. Implement WebSocket connection pooling
2. Add rate limiting for chat messages (prevent spam)
3. Implement message history persistence
4. Add moderation tools (report, mute, kick)
5. Optimize cursor update frequency (throttle to 100ms)
6. Add video call integration (WebRTC or third-party SDK)
7. Implement session recording for review
8. Add breakout rooms feature
9. Implement screen sharing capability
10. Add file sharing in chat

## Troubleshooting

### WebSocket Connection Fails
- **Check**: Real-time Agent running on port 8012
- **Check**: VITE_REALTIME_AGENT_URL environment variable
- **Check**: CORS settings allow WebSocket connections
- **Check**: Firewall rules allow WebSocket traffic
- **Solution**: Test WebSocket connection independently with `wscat -c ws://localhost:8012/ws/test-user`

### Messages Not Syncing
- **Check**: WebSocket connection status (wsConnected === true)
- **Check**: roomId is correctly set in message payload
- **Check**: User is properly authenticated
- **Solution**: Add logging to WebSocket message handler, verify message format

### Ready Check Not Working
- **Check**: updateReadyStatus API endpoint responding
- **Check**: WebSocket broadcasting ready status changes
- **Check**: readyParticipants array updating in Redux state
- **Solution**: Check Redux DevTools for action dispatches

### Leaderboard Not Updating
- **Check**: fetchLeaderboard API returning data
- **Check**: myPosition calculation correct
- **Check**: leaderboardFilter state matches request param
- **Solution**: Manually call fetchLeaderboard from console, check network tab

### Participant List Empty
- **Check**: fetchRoomDetails called on mount
- **Check**: joinRoom API returned participants array
- **Check**: participants state populated in Redux
- **Solution**: Check room ID validity, verify user joined successfully

## Support

For implementation questions:
- Check Redux DevTools for state updates
- Monitor browser console for errors
- Use Network tab to inspect API calls
- Test WebSocket with browser DevTools
- Verify environment variables loaded correctly
- Check backend logs for API errors

