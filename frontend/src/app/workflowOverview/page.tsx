'use client';

import Header from '../../../component/Header';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getAllWorkflows, 
  updateWorkflowStatus, 
  deleteWorkflow,
  formatRelativeTime,
  formatCreationDate,
  WorkflowData 
} from '@/lib/workflowStorage';

interface Workflow {
  id: string;
  title: string;
  lastUpdated: string;
  created: string;
  isPersonal: boolean;
  isActive: boolean;
}

export default function WorkflowOverview() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'workflows' | 'credentials' | 'executions' | 'dataTables'>('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('last updated');
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);

  // Load workflows from localStorage
  useEffect(() => {
    const loadedWorkflows = getAllWorkflows();
    setWorkflows(loadedWorkflows);
  }, []);

  // Reload workflows when window gains focus (to catch changes)
  useEffect(() => {
    const handleFocus = () => {
      const loadedWorkflows = getAllWorkflows();
      setWorkflows(loadedWorkflows);
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const toggleWorkflowActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    const workflow = workflows.find(w => w.id === id);
    if (workflow) {
      updateWorkflowStatus(id, !workflow.isActive);
      setWorkflows(workflows.map(w => 
        w.id === id ? { ...w, isActive: !w.isActive } : w
      ));
    }
  };

  const handleDeleteWorkflow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(id);
      setWorkflows(workflows.filter(w => w.id !== id));
    }
  };

  const handleWorkflowClick = (id: string) => {
    router.push(`/flow?id=${id}`);
  };

  const handleNewWorkflow = () => {
    router.push('/flow');
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #0f0f14 0%, #1a1a24 50%, #14141c 100%)',
      }}
    >
      <Header title="LinkedOut" showBackButton={false} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-8 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={() => setActiveTab('workflows')}
            className="pb-4 font-semibold transition-all relative"
            style={{
              color: activeTab === 'workflows' ? '#ef4444' : '#9fb5cc',
              fontSize: '15px',
            }}
          >
            Workflows
            {activeTab === 'workflows' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#ef4444' }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className="pb-4 font-semibold transition-all relative"
            style={{
              color: activeTab === 'credentials' ? '#ef4444' : '#9fb5cc',
              fontSize: '15px',
            }}
          >
            Credentials
            {activeTab === 'credentials' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#ef4444' }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className="pb-4 font-semibold transition-all relative"
            style={{
              color: activeTab === 'executions' ? '#ef4444' : '#9fb5cc',
              fontSize: '15px',
            }}
          >
            Executions
            {activeTab === 'executions' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#ef4444' }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('dataTables')}
            className="pb-4 font-semibold transition-all relative flex items-center gap-2"
            style={{
              color: activeTab === 'dataTables' ? '#ef4444' : '#9fb5cc',
              fontSize: '15px',
            }}
          >
            Data tables
            <span 
              className="px-2 py-0.5 rounded text-xs"
              style={{
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#a78bfa',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              Beta
            </span>
            {activeTab === 'dataTables' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#ef4444' }}
              />
            )}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 max-w-md relative">
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                fill="none"
                stroke="#9fb5cc"
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg outline-none transition-all"
                style={{
                  background: 'rgba(30, 30, 40, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e0e8f0',
                }}
              />
            </div>

            <button
              onClick={handleNewWorkflow}
              className="px-6 py-2.5 rounded-lg font-semibold transition-all hover:scale-105 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
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
                  d="M12 4v16m8-8H4" 
                />
              </svg>
              New Workflow
            </button>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 rounded-lg outline-none transition-all cursor-pointer"
              style={{
                background: 'rgba(30, 30, 40, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e0e8f0',
                fontSize: '14px',
              }}
            >
              <option value="last updated">Sort by last updated</option>
              <option value="created">Sort by created</option>
              <option value="name">Sort by name</option>
            </select>

            <button
              className="p-2.5 rounded-lg transition-all hover:scale-105"
              style={{
                background: 'rgba(30, 30, 40, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="#9fb5cc" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
                />
              </svg>
            </button>

            <button
              className="p-2.5 rounded-lg transition-all hover:scale-105"
              style={{
                background: 'rgba(30, 30, 40, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="#9fb5cc" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Workflow List */}
        <div className="mt-6 space-y-4">
          {workflows.length === 0 ? (
            <div 
              className="text-center py-16"
              style={{ color: '#9fb5cc' }}
            >
              <svg 
                className="w-16 h-16 mx-auto mb-4 opacity-50" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                />
              </svg>
              <p className="text-lg mb-4">No workflows yet</p>
              <button
                onClick={handleNewWorkflow}
                className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                }}
              >
                Create Your First Workflow
              </button>
            </div>
          ) : (
            workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => handleWorkflowClick(workflow.id)}
                className="p-6 rounded-lg transition-all hover:scale-[1.01] cursor-pointer"
                style={{
                  background: 'rgba(30, 30, 40, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: '#e0e8f0' }}
                    >
                      {workflow.title}
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: '#9fb5cc' }}
                    >
                      Last updated {formatRelativeTime(workflow.lastUpdated)} | Created {formatCreationDate(workflow.created)}
                    </p>
                  </div>

                <div className="flex items-center gap-4">
                  <div
                    className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                    style={{
                      background: 'rgba(60, 60, 70, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="#9fb5cc" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
                    </svg>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: '#9fb5cc' }}
                    >
                      Personal
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span 
                      className="text-sm font-medium"
                      style={{ color: '#9fb5cc' }}
                    >
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={(e) => toggleWorkflowActive(workflow.id, e)}
                      className="relative w-12 h-6 rounded-full transition-all"
                      style={{
                        background: workflow.isActive 
                          ? 'rgba(34, 197, 94, 0.3)' 
                          : 'rgba(100, 100, 110, 0.3)',
                        border: workflow.isActive
                          ? '1px solid rgba(34, 197, 94, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                        style={{
                          background: workflow.isActive ? '#22c55e' : '#64646e',
                          left: workflow.isActive ? 'calc(100% - 22px)' : '2px',
                        }}
                      />
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                    className="p-2 rounded-lg transition-all hover:scale-110 hover:bg-red-500/10"
                    style={{
                      background: 'rgba(60, 60, 70, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                    title="Delete workflow"
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="#ef4444" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <div 
            className="text-sm"
            style={{ color: '#9fb5cc' }}
          >
            Total {workflows.length}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-lg font-semibold transition-all"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#ef4444',
                  fontSize: '14px',
                }}
              >
                1
              </button>
            </div>

            <select
              className="px-4 py-2 rounded-lg outline-none transition-all cursor-pointer"
              style={{
                background: 'rgba(30, 30, 40, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e0e8f0',
                fontSize: '14px',
              }}
            >
              <option value="50">50/page</option>
              <option value="100">100/page</option>
              <option value="200">200/page</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

