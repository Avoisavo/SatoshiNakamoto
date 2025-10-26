'use client';

import { useState, useEffect, useRef } from 'react';
import { getUpdates, deleteWebhook } from '../src/lib/telegram';

interface TelegramNodeConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: () => void;
  triggerType: string;
  botToken: string;
  botInfo?: any;
}

export default function TelegramNodeConfig({ isOpen, onClose, onAddNode, triggerType, botToken, botInfo }: TelegramNodeConfigProps) {
  const [activeTab, setActiveTab] = useState<'parameters' | 'settings'>('parameters');
  const [isWebhookExpanded, setIsWebhookExpanded] = useState(false);
  const [isAdditionalFieldsExpanded, setIsAdditionalFieldsExpanded] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState('telegram-account');
  const [triggerOn, setTriggerOn] = useState('Message');
  const [outputData, setOutputData] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastUpdateId, setLastUpdateId] = useState<number>(0);
  const [messages, setMessages] = useState<any[]>([]);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Start listening for messages
  const startListening = async () => {
    setIsListening(true);
    
    // Delete any existing webhook to enable polling
    await deleteWebhook(botToken);
    
    // Start polling
    pollMessages();
  };

  const pollMessages = async () => {
    const result = await getUpdates(botToken, lastUpdateId + 1);
    
    if (result.success && result.data && result.data.length > 0) {
      const newMessages = result.data;
      
      // Update last update ID
      const maxUpdateId = Math.max(...newMessages.map((msg: any) => msg.update_id));
      setLastUpdateId(maxUpdateId);
      
      // Add new messages
      newMessages.forEach((update: any) => {
        if (update.message) {
          setMessages(prev => [...prev, update.message]);
          setOutputData(update.message); // Show latest message
        }
      });
    }
    
    // Continue polling if still listening
    if (isListening) {
      pollingInterval.current = setTimeout(pollMessages, 2000); // Poll every 2 seconds
    }
  };

  // Stop listening
  const stopListening = () => {
    setIsListening(false);
    if (pollingInterval.current) {
      clearTimeout(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  // Auto-start polling when listening
  useEffect(() => {
    if (isListening && pollingInterval.current === null) {
      pollMessages();
    }
  }, [isListening]);

  const handleExecute = () => {
    if (!isListening) {
      startListening();
    } else {
      stopListening();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{
        background: 'rgba(108, 117, 125, 0.95)',
      }}
    >
      {/* Back to canvas button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-gray-700"
        style={{
          color: 'white',
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to canvas
      </button>

      {/* Main Content Container */}
      <div className="flex-1 flex items-start justify-center pt-20 pb-8 px-4 overflow-auto">
        <div className="flex gap-4 w-full max-w-7xl">
          {/* Left Sidebar */}
          <div
            className="flex-shrink-0 rounded-lg p-6 flex flex-col items-center"
            style={{
              width: '280px',
              background: 'rgba(248, 249, 250, 0.95)',
            }}
          >
            <h3
              className="text-center mb-4 font-medium"
              style={{
                color: '#1f2937',
                fontFamily: "'Inter', sans-serif",
                fontSize: '16px',
              }}
            >
              Pull in events from Telegram
            </h3>
            
            {botInfo && (
              <div
                className="mb-4 p-3 rounded-lg w-full"
                style={{
                  background: 'rgba(0, 136, 204, 0.1)',
                  border: '1px solid rgba(0, 136, 204, 0.3)',
                }}
              >
                <p
                  className="text-xs font-medium mb-1"
                  style={{
                    color: '#0088cc',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Connected Bot
                </p>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: '#1f2937',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  @{botInfo.username}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: '#6b7280',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {botInfo.first_name}
                </p>
              </div>
            )}

            {isListening && (
              <div
                className="mb-4 p-3 rounded-lg w-full flex items-center gap-2"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <p
                  className="text-sm font-medium"
                  style={{
                    color: '#10b981',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Listening for messages...
                </p>
              </div>
            )}

            {messages.length > 0 && (
              <>
                <div
                  className="mb-4 p-3 rounded-lg w-full"
                  style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <p
                    className="text-xs mb-1"
                    style={{
                      color: '#6b7280',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Messages Received
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: '#3b82f6',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {messages.length}
                  </p>
                </div>

                {/* Add Node Button */}
                <button
                  onClick={onAddNode}
                  className="mb-4 px-4 py-3 rounded-lg font-medium transition-all hover:opacity-90 flex items-center gap-2 w-full justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Node to Canvas
                </button>
              </>
            )}
            
            <button
              onClick={handleExecute}
              className="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90 flex items-center gap-2 w-full justify-center"
              style={{
                background: isListening 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                  : 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
              }}
            >
              {isListening ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop Listening
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Listening
                </>
              )}
            </button>
          </div>

          {/* Middle Configuration Panel */}
          <div
            className="flex-1 rounded-lg shadow-xl overflow-hidden flex flex-col"
            style={{
              background: 'white',
              maxWidth: '800px',
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                  className="text-xl font-semibold"
                  style={{
                    color: '#1f2937',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Telegram Trigger
                </h2>
              </div>
              <button
                onClick={handleExecute}
                className="px-5 py-2.5 rounded-lg font-medium transition-all hover:opacity-90 flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                  color: 'white',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Execute step
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6">
              <button
                onClick={() => setActiveTab('parameters')}
                className="px-4 py-3 font-medium transition-colors relative"
                style={{
                  color: activeTab === 'parameters' ? '#ff6b6b' : '#6b7280',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  borderBottom: activeTab === 'parameters' ? '2px solid #ff6b6b' : 'none',
                }}
              >
                Parameters
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="px-4 py-3 font-medium transition-colors"
                style={{
                  color: activeTab === 'settings' ? '#ff6b6b' : '#6b7280',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  borderBottom: activeTab === 'settings' ? '2px solid #ff6b6b' : 'none',
                }}
              >
                Settings
              </button>
              <div className="flex-1"></div>
              <a
                href="#"
                className="px-4 py-3 text-sm flex items-center gap-1 hover:text-blue-700"
                style={{
                  color: '#6b7280',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Docs
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {activeTab === 'parameters' && (
                <div className="space-y-6">
                  {/* Webhook URLs - Collapsible */}
                  <div>
                    <button
                      onClick={() => setIsWebhookExpanded(!isWebhookExpanded)}
                      className="w-full flex items-center justify-between py-2"
                    >
                      <span
                        className="font-medium"
                        style={{
                          color: '#ff6b6b',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                        }}
                      >
                        Webhook URLs
                      </span>
                      <svg
                        className={`w-5 h-5 transition-transform ${isWebhookExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: '#ff6b6b' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Credential to connect with */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{
                        color: '#374151',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Credential to connect with
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedCredential}
                        onChange={(e) => setSelectedCredential(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                        style={{
                          borderColor: 'rgba(0, 0, 0, 0.2)',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                        }}
                      >
                        <option value="telegram-account">Telegram account</option>
                      </select>
                      <button
                        className="p-2.5 rounded-lg border hover:bg-gray-50"
                        style={{ borderColor: 'rgba(0, 0, 0, 0.2)' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <div
                      className="mt-3 p-3 rounded-lg"
                      style={{
                        background: 'rgba(255, 237, 213, 0.5)',
                        border: '1px solid rgba(255, 183, 77, 0.3)',
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{
                          color: '#9a6700',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Due to Telegram API limitations, you can use just one Telegram trigger for each bot at a time
                      </p>
                    </div>
                  </div>

                  {/* Trigger On */}
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{
                        color: '#374151',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Trigger On
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={triggerOn}
                        readOnly
                        className="w-full px-4 py-2.5 rounded-lg border pr-10"
                        style={{
                          borderColor: 'rgba(0, 0, 0, 0.2)',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                          background: '#f9fafb',
                        }}
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div
                      className="mt-3 p-3 rounded-lg"
                      style={{
                        background: 'rgba(255, 237, 213, 0.5)',
                        border: '1px solid rgba(255, 183, 77, 0.3)',
                      }}
                    >
                      <p
                        className="text-xs"
                        style={{
                          color: '#9a6700',
                          fontFamily: "'Inter', sans-serif",
                          lineHeight: '1.5',
                        }}
                      >
                        Every uploaded attachment, even if sent in a group, will trigger a separate event. You can identify that an attachment belongs to a certain group by <code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '3px' }}>media_group_id</code>.
                      </p>
                    </div>
                  </div>

                  {/* Additional Fields - Collapsible */}
                  <div>
                    <button
                      onClick={() => setIsAdditionalFieldsExpanded(!isAdditionalFieldsExpanded)}
                      className="w-full flex items-center justify-between py-2 mb-2"
                    >
                      <span
                        className="font-medium"
                        style={{
                          color: '#374151',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '14px',
                        }}
                      >
                        Additional Fields
                      </span>
                      <svg
                        className={`w-5 h-5 transition-transform ${isAdditionalFieldsExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: '#6b7280' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {isAdditionalFieldsExpanded && (
                      <div>
                        <p
                          className="text-sm mb-3"
                          style={{
                            color: '#6b7280',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          No properties
                        </p>
                        <select
                          className="w-full px-4 py-2.5 rounded-lg border"
                          style={{
                            borderColor: 'rgba(0, 0, 0, 0.2)',
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '14px',
                          }}
                        >
                          <option>Add Field</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="text-center py-12">
                  <p
                    style={{
                      color: '#6b7280',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Settings configuration coming soon...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Output Panel */}
          <div
            className="flex-shrink-0 rounded-lg p-6"
            style={{
              width: '380px',
              background: 'rgba(248, 249, 250, 0.95)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className="font-semibold text-lg"
                style={{
                  color: '#1f2937',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                OUTPUT
              </h3>
              <button className="p-2 rounded-lg hover:bg-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>

            {outputData ? (
              <div
                className="rounded-lg p-4 overflow-auto"
                style={{
                  background: 'white',
                  maxHeight: '600px',
                }}
              >
                <pre
                  className="text-xs"
                  style={{
                    fontFamily: "'Courier New', monospace",
                    color: '#1f2937',
                  }}
                >
                  {JSON.stringify(outputData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-20">
                <p
                  className="mb-2"
                  style={{
                    color: '#6b7280',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '14px',
                  }}
                >
                  Execute this node to view data
                </p>
                <p
                  className="text-sm"
                  style={{
                    color: '#6b7280',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  or{' '}
                  <button
                    onClick={() => handleExecute()}
                    className="text-red-500 hover:underline"
                  >
                    set mock data
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

