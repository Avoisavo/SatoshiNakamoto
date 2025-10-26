'use client';

import React, { useState } from 'react';

interface GmailNodeData {
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
  [key: string]: unknown;
}

interface GmailConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData?: GmailNodeData;
  onSave: (data: GmailNodeData) => void;
}

export default function GmailConfigPanel({
  isOpen,
  onClose,
  nodeData,
  onSave,
}: GmailConfigPanelProps) {
  const [emailTo, setEmailTo] = useState(nodeData?.emailTo || '');
  const [emailSubject, setEmailSubject] = useState(nodeData?.emailSubject || '');
  const [emailBody, setEmailBody] = useState(nodeData?.emailBody || '');

  const handleSave = () => {
    onSave({
      emailTo,
      emailSubject,
      emailBody,
    });
    onClose();
  };

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
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{
          width: '420px',
          background: 'rgba(20, 20, 25, 0.98)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b flex items-center justify-between"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2
            className="text-xl font-semibold"
            style={{
              color: '#e0e8f0',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Gmail Configuration
          </h2>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Email To */}
            <div>
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: '#e0e8f0' }}
              >
                To
              </label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e0e8f0',
                }}
              />
            </div>

            {/* Email Subject */}
            <div>
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: '#e0e8f0' }}
              >
                Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e0e8f0',
                }}
              />
            </div>

            {/* Email Body */}
            <div>
              <label
                className="block mb-2 text-sm font-medium"
                style={{ color: '#e0e8f0' }}
              >
                Message
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email message"
                rows={6}
                className="w-full px-4 py-2 rounded-lg resize-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e0e8f0',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
            }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </>
  );
}


