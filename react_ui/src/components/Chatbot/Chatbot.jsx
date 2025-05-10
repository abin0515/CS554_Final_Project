import React, { useState, useEffect, useRef } from 'react';
import {POST_API_BASE_URL} from '../../config.js';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to MotherDuckers! I'm your friendly assistant, here to help you navigate the platform, answer your parenting questions, or guide you in sharing your own experiences.",
      avatar: 'M' // Changed to M
    },
    // {
    //   role: 'assistant',
    //   content: 'How can I help you today? Feel free to ask anything, or choose an option below to get started!',
    //   avatar: 'M' // Changed to M (if uncommented)
    // },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
 
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const sendMessage = async (messageContent, isQuickReply = false) => {
    if (!messageContent.trim()) return;

    const newUserMessage = { role: 'user', content: messageContent, avatar: 'U' };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    if (isQuickReply) {
      // No need to clear input for quick replies
    } else {
      setInputValue('');
    }
    setIsLoading(true);

    try {
      const messagesToSend = [...messages, newUserMessage].map(msg => ({ role: msg.role, content: msg.content }));

      const response = await fetch(POST_API_BASE_URL + '/chat/', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messagesToSend }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Network response was not ok');
      }

      const data = await response.json();
      const assistantResponse = data.response;

      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: assistantResponse, avatar: 'M' }, // Changed to M
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: `Error: ${error.message}`, avatar: 'M' }, // Changed to M
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    sendMessage(inputValue);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  const handleQuickReply = (replyText) => {
    sendMessage(replyText, true);
  };

  // Updated quick replies for MotherDuckers
  const quickReplies = [
    { id: 'ask_question', text: 'Ask a parenting question' },
    { id: 'share_experience', text: 'Share my experience (Blog)' },
    { id: 'find_discussions', text: 'Find discussions' },
  ];


  return (
    <div className="chatbot-container">
      <button className="chatbot-toggle-button" onClick={toggleChat} aria-label={isOpen ? "Close chat" : "Open chat"}>
        {isOpen ? <span className="chatbot-close-icon-custom">&times;</span> : <span className="chatbot-logo-m">M</span>} 
      </button>
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            MotherDuckers Assistant
            <button className="chatbot-close-button" onClick={toggleChat} aria-label="Close chat">
              &times;
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-container ${msg.role}`}>
                {msg.role === 'assistant' && <div className="message-avatar assistant-avatar">{msg.avatar}</div>}
                <div className={`message ${msg.role}`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && <div className="message-avatar user-avatar">{msg.avatar}</div>}
              </div>
            ))}
            {isLoading && 
              <div className="message-container assistant">
                <div className="message-avatar assistant-avatar">M</div>
                <div className="message assistant typing">MotherDuckers is typing...</div>
              </div>
            }
            <div ref={messagesEndRef} />
          </div>
          {messages.length > 0 && 
            messages[messages.length -1].role === 'assistant' && 
            (messages[messages.length-1].content.includes("select an option") || messages[messages.length-1].content.includes("How can I help you today?")) && 
            !isLoading && (
            <div className="quick-replies">
              {quickReplies.map((reply) => (
                <button key={reply.id} onClick={() => handleQuickReply(reply.text)} disabled={isLoading}>
                  {reply.text}
                </button>
              ))}
            </div>
          )}
          <div className="chatbot-input-area">
            <input 
              type="text" 
              placeholder="Ask a question..." 
              value={inputValue} 
              onChange={handleInputChange} 
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading} aria-label="Send message">
              {isLoading ? <div className="typing-indicator-dot"></div> : '➡️'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot; 