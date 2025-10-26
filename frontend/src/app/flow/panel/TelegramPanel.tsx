'use client';

import { useState } from 'react';

interface TelegramPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSelectAction: (actionId: string) => void;
}

interface TelegramTrigger {
  id: string;
  name: string;
  isTrigger: boolean;
}

export default function TelegramPanel({ isOpen, onClose, onBack, onSelectAction }: TelegramPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isTriggersExpanded, setIsTriggersExpanded] = useState(true);

  const triggers: TelegramTrigger[] = [
    { id: 'callback-query', name: 'On callback query', isTrigger: true },
    { id: 'channel-post', name: 'On channel post', isTrigger: true },
    { id: 'edited-channel-post', name: 'On edited channel post', isTrigger: true },
    { id: 'edited-message', name: 'On edited message', isTrigger: true },
    { id: 'inline-query', name: 'On inline query', isTrigger: true },
    { id: 'message', name: 'On message', isTrigger: true },
    { id: 'poll-change', name: 'On Poll Change', isTrigger: true },
    { id: 'pre-checkout-query', name: 'On pre checkout query', isTrigger: true },
    { id: 'shipping-query', name: 'On shipping query', isTrigger: true },
  ];

  const filteredTriggers = triggers.filter((trigger) =>
    trigger.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
        style={{ backdropFilter: 'blur(2px)' }}
      />

      {/* Panel */}
      <div
        className="fixed left-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: '420px',
          background: 'rgba(245, 245, 250, 0.98)',
          borderRight: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b flex items-center gap-4"
          style={{
            borderColor: 'rgba(0, 0, 0, 0.08)',
            background: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {/* Back Button */}
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
            style={{ color: '#6b7280' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Telegram Icon and Title */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #0088cc, #00a0e9)',
              }}
            >
              <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
            </div>
            <h2
              className="text-2xl font-semibold"
              style={{
                color: '#1f2937',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Telegram
            </h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4" style={{ background: 'rgba(255, 255, 255, 0.6)' }}>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#9ca3af' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search Telegram Actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
              style={{
                background: 'white',
                border: '2px solid rgba(100, 120, 200, 0.4)',
                color: '#1f2937',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Triggers Section */}
          <div className="mb-4">
            <button
              onClick={() => setIsTriggersExpanded(!isTriggersExpanded)}
              className="w-full flex items-center justify-between mb-3 group"
              style={{ cursor: 'pointer' }}
            >
              <div className="flex items-center gap-2">
                <h3
                  className="text-lg font-semibold"
                  style={{
                    color: '#1f2937',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Triggers ({filteredTriggers.length})
                </h3>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ color: '#ef4444' }}
                >
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                </svg>
              </div>
              <svg
                className={`w-5 h-5 transition-transform ${isTriggersExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#6b7280' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Triggers List */}
            {isTriggersExpanded && (
              <div className="space-y-0">
                {filteredTriggers.map((trigger, index) => (
                  <button
                    key={trigger.id}
                    onClick={() => {
                      onSelectAction(trigger.id);
                      console.log('Selected trigger:', trigger.name);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 transition-all group"
                    style={{
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderLeft: index === 0 ? '3px solid #ef4444' : 'none',
                      background: index === 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (index !== 0) {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (index !== 0) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {/* Telegram Icon */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #0088cc, #00a0e9)',
                      }}
                    >
                      <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                      </svg>
                    </div>

                    {/* Trigger Name */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-normal"
                        style={{
                          color: '#1f2937',
                          fontSize: '15px',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {trigger.name}
                      </h4>
                    </div>

                    {/* Lightning Icon */}
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ color: '#ef4444' }}
                    >
                      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

