import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectSocket } from '../lib/socket';
import { fetchUserDisplayName } from '../lib/Auth';
import './ChatComponent.css';

function ChatComponent() {
  const { userId } = useParams();
  const { currentUser, loading } = useAuth();
  const [message, setMessage] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [recipientName, setRecipientName] = useState('Loading...');
  const socketRef = useRef(null); 

  useEffect(() => {
    if (!userId) return;
    fetchUserDisplayName(userId).then(setRecipientName);
  }, [userId]);

  useEffect(() => {
    if (!currentUser || !userId) return;

    const setupSocket = async () => {
      if (!socketRef.current) {
        socketRef.current = await connectSocket(currentUser);
      }

      const socket = socketRef.current;
      if (!socket) return;

      const roomId = [currentUser.uid, userId].sort().join('_');
      socket.emit('join_room', roomId);

    
      socket.off('receive_message'); 
      socket.on('receive_message', (msg) => {
        setChatLog((prev) => [
          ...prev,
          `${msg.senderId === currentUser.uid ? 'You' : 'Them'}: ${msg.content}`
        ]);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });
    };

    setupSocket();

    return () => {
      const socket = socketRef.current;
      if (socket) {
        socket.off('receive_message');
      }
    };
  }, [currentUser, userId]);

  const sendMessage = (e) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!currentUser || !socket || !message.trim()) return;

    const room = [currentUser.uid, userId].sort().join('_');
    const msg = {
      from: currentUser.uid,
      to: userId,
      text: message,
      room,
    };

    socket.emit('send_message', msg);
    setMessage('');
  };

  if (loading || !currentUser) return <p>Loading chat...</p>;

  return (
    <div className="chat-container">
      <h2 className="chat-title">Chat with {recipientName}</h2>
      <div className="chat-log">
        {chatLog.map((msg, i) => (
          <p key={i} className={`chat-message ${msg.startsWith('You:') ? 'you' : 'them'}`}>
            {msg}
          </p>
        ))}
      </div>
      <form onSubmit={sendMessage} className="chat-form">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="chat-input"
        />
        <button type="submit" className="chat-send-button">Send</button>
      </form>
    </div>
  );
}

export default ChatComponent;
