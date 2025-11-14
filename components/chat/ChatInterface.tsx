'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw } from 'lucide-react';

// Simple utility for class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Persona = 'career' | 'technical' | 'general';

const PERSONA_LABELS: Record<Persona, string> = {
  career: 'Career Advisor',
  technical: 'Tech Mentor',
  general: 'Life Coach'
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState<Persona>('career');
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load session ID from localStorage or generate a new one
  useEffect(() => {
    const savedSessionId = localStorage.getItem('chatSessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
    } else {
      const newSessionId = `session-${Date.now()}`;
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId,
          persona,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant' as const, content: data.response }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant' as const, 
          content: 'Sorry, I encountered an error. Please try again.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    // Optionally clear session ID to start a new conversation
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);
  };

  // Add animation styles to head
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      maxWidth: '48rem',
      margin: '0 auto',
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      overflow: 'hidden',
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600
        }}>AI Mentor</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value as Persona)}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              fontSize: '0.875rem',
              borderRadius: '0.25rem',
              padding: '0.25rem 0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer'
            }}
            disabled={isLoading}
          >
            {Object.entries(PERSONA_LABELS).map(([value, label]) => (
              <option key={value} value={value} style={{ color: 'black' }}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={resetConversation}
            disabled={isLoading || messages.length === 0}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (isLoading || messages.length === 0) ? 0.5 : 1,
              pointerEvents: (isLoading || messages.length === 0) ? 'none' : 'auto'
            }}
            title="Reset conversation"
          >
            <RefreshCw style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#f8fafc'
      }}>
        {messages.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            <p>Start a conversation with your AI mentor...</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {message.role === 'assistant' && (
                <div style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '9999px',
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bot style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: '80%',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: message.role === 'user' ? '#3b82f6' : 'white',
                  color: message.role === 'user' ? 'white' : 'inherit',
                  border: message.role === 'user' ? 'none' : '1px solid #e2e8f0',
                  borderTopRightRadius: message.role === 'user' ? '0' : '0.5rem',
                  borderTopLeftRadius: message.role === 'assistant' ? '0' : '0.5rem',
                  boxShadow: message.role === 'assistant' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                }}
              >
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div style={{
                  backgroundColor: '#e2e8f0',
                  padding: '0.5rem',
                  borderRadius: '9999px',
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User style={{ width: '1.25rem', height: '1.25rem' }} />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSubmit} 
        style={{
          borderTop: '1px solid #e2e8f0',
          padding: '1rem',
          backgroundColor: 'white'
        }}
      >
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
              outline: 'none',
              fontSize: '0.875rem',
              backgroundColor: '#fff',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'auto'
            }}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
              opacity: (!input.trim() || isLoading) ? 0.7 : 1
            }}
          >
            {isLoading ? (
              <RefreshCw style={{
                width: '1rem',
                height: '1rem',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <Send style={{ width: '1rem', height: '1rem' }} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
