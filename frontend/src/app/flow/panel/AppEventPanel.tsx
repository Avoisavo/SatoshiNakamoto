'use client';

import { useState } from 'react';

interface AppEventPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSelectApp: (appId: string) => void;
}

interface AppIntegration {
  id: string;
  name: string;
  description?: string;
  verified?: boolean;
  iconColor: string;
  iconBg: string;
}

export default function AppEventPanel({ isOpen, onClose, onBack, onSelectApp }: AppEventPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const appIntegrations: AppIntegration[] = [
    {
      id: '1shot-api',
      name: '1Shot API',
      description: 'Interact with EVM blockchains via 1Shot API',
      verified: true,
      iconColor: '#4FC3F7',
      iconBg: 'rgba(79, 195, 247, 0.2)',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Send and receive messages via Telegram bot',
      verified: true,
      iconColor: '#0088cc',
      iconBg: 'rgba(0, 136, 204, 0.2)',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      description: 'Post tweets and interact with Twitter API',
      verified: true,
      iconColor: '#1DA1F2',
      iconBg: 'rgba(29, 161, 242, 0.2)',
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Send messages and manage Discord servers',
      verified: true,
      iconColor: '#5865F2',
      iconBg: 'rgba(88, 101, 242, 0.2)',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Send and receive emails via Gmail',
      verified: true,
      iconColor: '#EA4335',
      iconBg: 'rgba(234, 67, 53, 0.2)',
    },
    {
      id: 'active-campaign',
      name: 'ActiveCampaign',
      iconColor: '#3949AB',
      iconBg: 'rgba(57, 73, 171, 0.2)',
    },
    {
      id: 'affinity',
      name: 'Affinity',
      iconColor: '#5C6BC0',
      iconBg: 'rgba(92, 107, 192, 0.2)',
    },
    {
      id: 'agile-crm',
      name: 'Agile CRM',
      iconColor: '#42A5F5',
      iconBg: 'rgba(66, 165, 245, 0.2)',
    },
    {
      id: 'ai-scraper',
      name: 'AI Scraper',
      description: 'Scrape data from websites using the Parsera API',
      verified: true,
      iconColor: '#8D6E63',
      iconBg: 'rgba(141, 110, 99, 0.2)',
    },
    {
      id: 'air',
      name: 'AIR',
      description: 'Manage Binalyze AIR resources',
      verified: true,
      iconColor: '#212121',
      iconBg: 'rgba(33, 33, 33, 0.2)',
    },
    {
      id: 'airtable',
      name: 'Airtable',
      iconColor: '#FCB400',
      iconBg: 'rgba(252, 180, 0, 0.2)',
    },
  ];

  const filteredApps = appIntegrations.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
          className="px-6 py-5 border-b flex items-center gap-4"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Back Button */}
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
            style={{ color: '#9fb5cc' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Icon and Title */}
          <div className="flex items-center gap-3 flex-1">
            <div
              className="p-2 rounded-lg"
              style={{
                background: 'rgba(100, 150, 200, 0.2)',
                color: '#7fb3e8',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0M12 12h.01" />
              </svg>
            </div>
            <h2
              className="text-xl font-semibold"
              style={{
                color: '#e0e8f0',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              On app event
            </h2>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 transition-colors flex-shrink-0"
            style={{ color: '#9fb5cc' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4">
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
                background: 'rgba(255, 255, 255, 0.95)',
                border: '2px solid rgba(100, 120, 200, 0.4)',
                color: '#2c2c2c',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
        </div>

        {/* App Integrations List */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              onClick={() => {
                onSelectApp(app.id);
                console.log('Selected app:', app.name);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-lg mb-2 transition-all group"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
              }}
            >
              {/* App Icon */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg"
                style={{
                  background: app.iconBg,
                  color: app.iconColor,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {app.name.substring(0, 2).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="font-semibold"
                    style={{
                      color: '#e0e8f0',
                      fontSize: '15px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {app.name}
                  </h3>
                  {app.verified && (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      style={{ color: '#7fb3e8' }}
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                {app.description && (
                  <p
                    className="text-sm"
                    style={{
                      color: '#9fb5cc',
                      fontSize: '13px',
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: '1.4',
                    }}
                  >
                    {app.description}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
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

