'use client';

import { useState } from 'react';

interface Condition {
  id: string;
  expression: string;
  operator: string;
  value: string;
}

interface IfElseNodeData {
  conditions?: Condition[];
  convertTypes?: boolean;
  [key: string]: unknown;
}

interface IfElseConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData?: IfElseNodeData;
  onSave?: (data: IfElseNodeData) => void;
}

export default function IfElseConfigPanel({ 
  isOpen, 
  onClose, 
  nodeData,
  onSave 
}: IfElseConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<'parameters' | 'settings'>('parameters');
  const [conditions, setConditions] = useState<Condition[]>(
    nodeData?.conditions || [
      { id: '1', expression: '{{ $json.output }}', operator: 'is equal to', value: 'Bridge' }
    ]
  );
  const [convertTypes, setConvertTypes] = useState(nodeData?.convertTypes || false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave) {
      onSave({
        conditions,
        convertTypes,
      });
    }
    onClose();
  };

  const addCondition = () => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      expression: '',
      operator: 'is equal to',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const operatorOptions = [
    'is equal to',
    'is not equal to',
    'contains',
    'does not contain',
    'starts with',
    'ends with',
    'is empty',
    'is not empty',
    'greater than',
    'less than',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="relative flex"
        style={{
          width: '95%',
          maxWidth: '1600px',
          height: '90vh',
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Panel - INPUT */}
        <div
          className="flex flex-col"
          style={{
            width: '280px',
            background: '#f9fafb',
            borderRight: '1px solid #e5e7eb',
          }}
        >
          <div
            className="px-6 py-4"
            style={{
              borderBottom: '1px solid #e5e7eb',
              background: 'white',
            }}
          >
            <h2
              className="text-lg font-bold"
              style={{
                color: '#1f2937',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              INPUT
            </h2>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p
                className="text-sm mb-4"
                style={{
                  color: '#6b7280',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                AI Agent Response<br /><br />
                Parsed and structured output<br /><br />
                Action: bridge<br /><br />
                Amount: 0.05 ETH<br /><br />
                From Network: Base Sepolia<br /><br />
                To Network: Hedera<br /><br />
                Condition: ETH price reach 3800 USD
              </p>
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                style={{
                  color: '#374151',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Execute previous nodes
              </button>
              <p
                className="text-xs mt-2"
                style={{
                  color: '#9ca3af',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                (From the earliest node that needs it ⓘ)
              </p>
            </div>
          </div>
        </div>

        {/* Middle Panel - Configuration */}
        <div
          className="flex-1 flex flex-col"
          style={{
            background: 'white',
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                }}
              >
                <span className="text-white text-xl font-bold">⇄</span>
              </div>
              <h2
                className="text-xl font-bold"
                style={{
                  color: '#1f2937',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                If
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#"
                className="text-sm font-medium flex items-center gap-1"
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
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all hover:opacity-90"
                style={{
                  background: '#ff6b6b',
                  color: 'white',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Execute step
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex px-6 gap-6"
            style={{
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <button
              onClick={() => setActiveTab('parameters')}
              className="py-3 text-sm font-medium transition-colors relative"
              style={{
                color: activeTab === 'parameters' ? '#ff6b6b' : '#6b7280',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Parameters
              {activeTab === 'parameters' && (
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: '2px',
                    background: '#ff6b6b',
                  }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="py-3 text-sm font-medium transition-colors"
              style={{
                color: activeTab === 'settings' ? '#ff6b6b' : '#6b7280',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'parameters' && (
              <div className="space-y-6">
                {/* Conditions Section */}
                <div>
                  <h3
                    className="text-sm font-semibold mb-4"
                    style={{
                      color: '#1f2937',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Conditions
                  </h3>

                  {conditions.map((condition) => (
                    <div key={condition.id} className="mb-3">
                      <div className="flex gap-2">
                        {/* Expression Input */}
                        <div className="relative flex-1">
                          <span
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          >
                            fx
                          </span>
                          <input
                            type="text"
                            value={condition.expression}
                            onChange={(e) => updateCondition(condition.id, 'expression', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                            style={{
                              fontFamily: "'Consolas', 'Monaco', monospace",
                              color: '#374151',
                            }}
                            placeholder="Expression..."
                          />
                        </div>

                        {/* Operator Dropdown */}
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            color: '#374151',
                            minWidth: '140px',
                          }}
                        >
                          {operatorOptions.map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>

                        {/* Value Input */}
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            color: '#374151',
                          }}
                          placeholder="Value..."
                        />

                        {/* Delete Button */}
                        {conditions.length > 1 && (
                          <button
                            onClick={() => removeCondition(condition.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add Condition Button */}
                  <button
                    onClick={addCondition}
                    className="w-full py-3 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
                    style={{
                      color: '#374151',
                      fontFamily: "'Inter', sans-serif",
                      background: '#f3f4f6',
                    }}
                  >
                    Add condition
                  </button>
                </div>

                {/* Convert Types Toggle */}
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: '#374151',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Convert types where required
                    </span>
                    <button
                      onClick={() => setConvertTypes(!convertTypes)}
                      className="relative inline-flex items-center rounded-full transition-colors"
                      style={{
                        width: '44px',
                        height: '24px',
                        background: convertTypes ? '#10b981' : '#d1d5db',
                      }}
                    >
                      <span
                        className="inline-block rounded-full bg-white shadow transform transition-transform"
                        style={{
                          width: '20px',
                          height: '20px',
                          marginLeft: convertTypes ? '22px' : '2px',
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Options Section */}
                <div>
                  <h3
                    className="text-sm font-semibold mb-4"
                    style={{
                      color: '#1f2937',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Options
                  </h3>

                  <p
                    className="text-sm mb-3"
                    style={{
                      color: '#6b7280',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    No properties
                  </p>

                  {/* Add Option Button */}
                  <button
                    className="w-full py-3 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-between px-4"
                    style={{
                      color: '#374151',
                      fontFamily: "'Inter', sans-serif",
                      background: '#f3f4f6',
                    }}
                  >
                    <span>Add option</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <p
                  className="text-sm"
                  style={{
                    color: '#6b7280',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Additional settings for the If node
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - OUTPUT */}
        <div
          className="flex flex-col"
          style={{
            width: '280px',
            background: '#f9fafb',
            borderLeft: '1px solid #e5e7eb',
          }}
        >
          <div
            className="px-6 py-4"
            style={{
              borderBottom: '1px solid #e5e7eb',
              background: 'white',
            }}
          >
            <h2
              className="text-lg font-bold"
              style={{
                color: '#1f2937',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              OUTPUT
            </h2>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <p
              className="text-sm text-center"
              style={{
                color: '#6b7280',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              true
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

