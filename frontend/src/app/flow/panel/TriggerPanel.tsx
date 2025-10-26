'use client';

import React, { useState } from 'react';

interface TriggerPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrigger: (trigger: string) => void;
}

interface TriggerOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
}

export default function TriggerPanel({ isOpen, onClose, onSelectTrigger }: TriggerPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const triggerOptions: TriggerOption[] = [
    {
      id: 'manual',
      title: 'Trigger manually',
      description: 'Runs the flow on clicking a button in n8n. Good for getting started quickly',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
    },
    {
      id: 'app-event',
      title: 'On app event',
      description: 'Runs the flow when something happens in an app like Telegram, Notion or Airtable',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0M12 12h.01" />
        </svg>
      ),
    },
    {
      id: 'schedule',
      title: 'On a schedule',
      description: 'Runs the flow every day, hour, or custom interval',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'webhook',
      title: 'On webhook call',
      description: 'Runs the flow on receiving an HTTP request',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      id: 'form',
      title: 'On form submission',
      description: 'Generate webforms in n8n and pass their responses to the workflow',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'workflow',
      title: 'When executed by another workflow',
      description: 'Runs the flow when called by the Execute Workflow node from a different workflow',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'chat',
      title: 'On chat message',
      description: 'Runs the flow when a user sends a chat message. For use with AI nodes',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'evaluation',
      title: 'When running evaluation',
      description: 'Runs the flow during evaluation process for testing and validation',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  const filteredOptions = triggerOptions.filter(
    (option) =>
      option.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.description.toLowerCase().includes(searchQuery.toLowerCase())
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
          background: 'rgba(20, 20, 25, 0.98)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{
                  color: '#e0e8f0',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                What triggers this workflow?
              </h2>
              <p
                className="text-sm"
                style={{
                  color: '#9fb5cc',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                A trigger is a step that starts your workflow
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              style={{ color: '#9fb5cc' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#9fb5cc' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2"
              style={{
                background: 'rgba(40, 40, 50, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e0e8f0',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
        </div>

        {/* Trigger Options List */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onSelectTrigger(option.id);
                onClose();
              }}
              className="w-full flex items-start gap-4 p-4 rounded-lg mb-2 transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(40, 40, 50, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(60, 60, 75, 0.8)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(40, 40, 50, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            >
              {/* Icon */}
              <div
                className="flex-shrink-0 p-2 rounded-lg"
                style={{
                  background: 'rgba(100, 150, 200, 0.2)',
                  color: '#7fb3e8',
                }}
              >
                {option.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold mb-1"
                  style={{
                    color: '#e0e8f0',
                    fontSize: '15px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {option.title}
                </h3>
                <p
                  className="text-sm"
                  style={{
                    color: '#9fb5cc',
                    fontSize: '13px',
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: '1.4',
                  }}
                >
                  {option.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#9fb5cc' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

