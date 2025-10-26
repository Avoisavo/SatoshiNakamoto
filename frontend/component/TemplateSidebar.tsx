'use client';

import { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: string[];
}

const templates: Template[] = [
  {
    id: 'telegram-alert',
    name: 'Telegram Alert',
    description: 'Send alerts to Telegram when conditions are met',
    category: 'Notifications',
    nodes: ['Trigger', 'Condition', 'Telegram']
  },
  {
    id: 'price-monitor',
    name: 'Price Monitor',
    description: 'Monitor cryptocurrency prices and execute actions',
    category: 'Trading',
    nodes: ['Pyth', 'If/Else', 'Action']
  },
  {
    id: 'base-bridge',
    name: 'Base Bridge',
    description: 'Bridge tokens between Base and other networks',
    category: 'DeFi',
    nodes: ['Trigger', 'Base', 'Bridge']
  },
  {
    id: 'ai-workflow',
    name: 'AI Workflow',
    description: 'Use AI agents to automate decisions',
    category: 'AI',
    nodes: ['Trigger', 'AI Agent', 'Action']
  },
];

export default function TemplateSidebar() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];
  
  const filteredTemplates = selectedCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleDragStart = (e: React.DragEvent, template: Template) => {
    e.dataTransfer.setData('application/json', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div 
      className="w-80 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col"
      style={{
        boxShadow: '0 8px 32px 0 rgba(138, 180, 248, 0.1)',
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 
          className="text-xl font-bold mb-1"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: 'linear-gradient(135deg, #8ab4f8 0%, #6ab7ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Templates
        </h2>
        <p className="text-xs text-gray-400">Drag and drop to use</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
            style={{
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-blue-500/30 scrollbar-track-transparent">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            draggable
            onDragStart={(e) => handleDragStart(e, template)}
            className="group p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-blue-400/50 transition-all duration-300 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-blue-500/20"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 
                className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                {template.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {template.category}
              </span>
            </div>
            
            <p className="text-xs text-gray-400 mb-3 line-clamp-2">
              {template.description}
            </p>
            
            <div className="flex flex-wrap gap-1">
              {template.nodes.map((node, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-300 border border-white/10"
                >
                  {node}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300"
          style={{
            fontFamily: "'Orbitron', sans-serif",
          }}
        >
          Create Custom Template
        </button>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.3);
          border-radius: 20px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(96, 165, 250, 0.5);
        }
      `}</style>
    </div>
  );
}

