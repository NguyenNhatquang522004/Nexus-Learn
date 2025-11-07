import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiSend, FiUsers, FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';
import { Card, Button, Input } from '../components/shared';
import WebSocketService from '../services/websocket';

const StudyRoom = () => {
  const { user } = useSelector((state) => state.auth);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([
    { id: 1, name: 'You', status: 'active', avatar: user?.name?.[0] || 'U' },
    { id: 2, name: 'Alice Johnson', status: 'active', avatar: 'A' },
    { id: 3, name: 'Bob Smith', status: 'idle', avatar: 'B' }
  ]);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const messagesEndRef = useRef(null);
  const wsService = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    wsService.current = WebSocketService;
    wsService.current.connect();
    wsService.current.joinRoom('study-room-1');

    // Listen for messages
    wsService.current.onMessage((data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: data.sender,
          text: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false
        }
      ]);
    });

    // Add welcome message
    setMessages([
      {
        id: 1,
        sender: 'System',
        text: 'Welcome to the Biology Study Room! 🧬',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }
    ]);

    return () => {
      wsService.current?.leaveRoom('study-room-1');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: user?.name || 'You',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    };

    setMessages((prev) => [...prev, message]);
    wsService.current?.sendChatMessage('study-room-1', newMessage);
    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Biology Study Room</h1>
              <p className="text-neutral-600">Collaborative learning space</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isMuted ? 'outline' : 'primary'}
                size="md"
                icon={isMuted ? <FiMicOff /> : <FiMic />}
                onClick={() => setIsMuted(!isMuted)}
              />
              <Button
                variant={isVideoOff ? 'outline' : 'primary'}
                size="md"
                icon={isVideoOff ? <FiVideoOff /> : <FiVideo />}
                onClick={() => setIsVideoOff(!isVideoOff)}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Grid */}
            <Card>
              <div className="grid grid-cols-2 gap-4 p-4">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg relative overflow-hidden"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl font-bold">
                        {participant.avatar}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{participant.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            participant.status === 'active' ? 'bg-success-500' : 'bg-warning-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Chat */}
            <Card className="h-[500px] flex flex-col">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-neutral-900">Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.isSystem ? (
                      <div className="text-center w-full">
                        <span className="text-sm text-neutral-500 bg-neutral-100 px-4 py-2 rounded-full">
                          {message.text}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[70%] ${
                          message.isOwn ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-900'
                        } rounded-lg px-4 py-2`}
                      >
                        {!message.isOwn && (
                          <p className="text-xs font-semibold mb-1 opacity-70">{message.sender}</p>
                        )}
                        <p>{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.isOwn ? 'text-white/70' : 'text-neutral-500'
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" variant="primary" icon={<FiSend />}>
                    Send
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Participants */}
            <Card>
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <FiUsers /> Participants ({participants.length})
                </h2>
              </div>
              <div className="card-body space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                      {participant.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{participant.name}</p>
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            participant.status === 'active' ? 'bg-success-500' : 'bg-warning-500'
                          }`}
                        />
                        <span className="text-xs text-neutral-600 capitalize">
                          {participant.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Study Materials */}
            <Card>
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">Study Materials</h2>
              </div>
              <div className="card-body space-y-2">
                {[
                  { name: 'Cell Biology Notes.pdf', size: '2.4 MB' },
                  { name: 'Practice Questions.docx', size: '1.1 MB' },
                  { name: 'Lecture Slides.pptx', size: '5.8 MB' }
                ].map((file, index) => (
                  <div
                    key={index}
                    className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-neutral-900 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-neutral-600">{file.size}</p>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Add Material
                </Button>
              </div>
            </Card>

            {/* Session Timer */}
            <Card>
              <div className="card-header">
                <h2 className="text-lg font-semibold text-neutral-900">Session Time</h2>
              </div>
              <div className="card-body text-center">
                <div className="text-4xl font-bold text-primary-500 mb-2">45:32</div>
                <p className="text-sm text-neutral-600">Time studying together</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;
