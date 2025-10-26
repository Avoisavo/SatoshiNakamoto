'use client';

import { useState } from 'react';

interface ChatBoxProps {
  onSend?: (message: string) => void;
  walletAddress?: string;
  compact?: boolean; // Add compact mode for workflow view
}

export default function ChatBox({ onSend, walletAddress = '0x32322423...', compact = false }: ChatBoxProps) {
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    // Call the onSend callback if provided
    if (onSend) {
      onSend(input);
    } else {
      console.log('Sending message:', input);
    }
    
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check if input is empty to show/hide greeting (hide in compact mode)
  const showGreeting = !compact && input.trim().length === 0;

  return (
    <div className="w-full max-w-3xl flex flex-col items-center transition-all duration-500">
      {/* Greeting Text */}
      <div 
        className="text-center transition-all duration-500 overflow-hidden"
        style={{
          maxHeight: showGreeting ? '200px' : '0px',
          opacity: showGreeting ? 1 : 0,
          marginBottom: showGreeting ? '32px' : '0px',
          transform: showGreeting ? 'translateY(0)' : 'translateY(-20px)',
        }}
      >
        <h1 
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: 'linear-gradient(to bottom, #ffffff 0%, #e0e8f0 50%, #9fb5cc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))',
          }}
        >
          GM! {walletAddress}
        </h1>
        <p 
          className="text-lg"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: '#c0d0e0',
            fontWeight: '300',
            letterSpacing: '0.05em',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
          }}
        >
          What you wanna build today!
        </p>
      </div>

      {/* Input Field */}
      <div 
        className="w-full rounded-xl p-6 transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(40, 40, 50, 0.5), rgba(20, 20, 30, 0.7))',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: `
            0 20px 60px 0 rgba(0, 0, 0, 0.8),
            0 10px 30px 0 rgba(0, 0, 0, 0.5),
            inset 0 2px 4px 0 rgba(255, 255, 255, 0.15),
            inset 0 -2px 4px 0 rgba(0, 0, 0, 0.3),
            0 0 80px rgba(100, 150, 200, 0.2),
            0 5px 15px rgba(100, 150, 200, 0.15)
          `,
          transform: showGreeting 
            ? 'perspective(1000px) rotateX(2deg) translateY(0)' 
            : 'perspective(1000px) rotateX(2deg) translateY(-40px)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl resize-none outline-none"
              style={{
                background: 'linear-gradient(135deg, rgba(50, 50, 60, 0.4), rgba(30, 30, 40, 0.6))',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e0e8f0',
                fontFamily: "'Inter', sans-serif",
                backdropFilter: 'blur(15px)',
                boxShadow: `
                  inset 0 2px 4px rgba(0, 0, 0, 0.3),
                  inset 0 -1px 2px rgba(255, 255, 255, 0.05),
                  0 4px 12px rgba(0, 0, 0, 0.2)
                `,
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: input.trim() 
                ? 'linear-gradient(135deg, rgba(100, 150, 200, 0.5), rgba(80, 120, 180, 0.6))'
                : 'linear-gradient(135deg, rgba(60, 60, 70, 0.4), rgba(40, 40, 50, 0.5))',
              border: input.trim() 
                ? '1px solid rgba(150, 180, 220, 0.4)'
                : '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              backdropFilter: 'blur(15px)',
              boxShadow: input.trim() 
                ? `
                  0 8px 24px rgba(80, 120, 180, 0.3),
                  0 4px 12px rgba(100, 150, 200, 0.2),
                  inset 0 1px 2px rgba(255, 255, 255, 0.2),
                  inset 0 -1px 2px rgba(0, 0, 0, 0.3),
                  0 0 30px rgba(100, 150, 200, 0.25)
                `
                : `
                  0 4px 12px rgba(0, 0, 0, 0.3),
                  inset 0 1px 2px rgba(255, 255, 255, 0.1),
                  inset 0 -1px 2px rgba(0, 0, 0, 0.2)
                `,
              letterSpacing: '0.1em',
              transform: input.trim() ? 'translateY(-1px)' : 'none',
              transition: 'all 0.3s ease',
              height: '56px',
            }}
          >
            <span>SEND</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs mt-3 text-center" style={{ color: '#6b8ba8' }}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

