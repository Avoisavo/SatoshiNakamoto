'use client';

import React, { useState, useRef } from 'react';

interface AIAgentNodeProps {
  id: string;
  position: { x: number; y: number };
  isDragging?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDelete: () => void;
  onAddConnection?: () => void;
  hasChildren?: boolean;
  data?: {
    [key: string]: unknown;
  };
  isExecuting?: boolean;
}

export default function AIAgentNode({ 
  position, 
  isDragging, 
  onMouseDown, 
  onDelete,
  onAddConnection,
  hasChildren,
  isExecuting 
}: AIAgentNodeProps) {
  const [showModelModal, setShowModelModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [circlePosition, setCirclePosition] = useState({ x: 100, y: 250 });
  const [isDraggingCircle, setIsDraggingCircle] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [memoryCirclePosition, setMemoryCirclePosition] = useState({ x: 300, y: 250 });
  const [isDraggingMemoryCircle, setIsDraggingMemoryCircle] = useState(false);
  const [memoryDragOffset, setMemoryDragOffset] = useState({ x: 0, y: 0 });
  const [toolCirclePosition, setToolCirclePosition] = useState({ x: 500, y: 250 });
  const [isDraggingToolCircle, setIsDraggingToolCircle] = useState(false);
  const [toolDragOffset, setToolDragOffset] = useState({ x: 0, y: 0 });
  const modelDiamondRef = useRef<HTMLDivElement>(null);
  const memoryDiamondRef = useRef<HTMLDivElement>(null);
  const toolDiamondRef = useRef<HTMLDivElement>(null);

  const models = ['ChatGPT', 'Claude', 'Llama 3', 'Groq'];
  const memories = ['MongoDB', 'Redis', 'PostgreSQL', 'No Memory'];
  const tools = ['Code Interpreter', 'Web Search', 'Image Generator', 'Custom Tool'];

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setShowModelModal(false);
  };

  const handleMemorySelect = (memory: string) => {
    setSelectedMemory(memory);
    setShowMemoryModal(false);
  };

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
    setShowToolModal(false);
  };

  // Calculate line coordinates
  const getLineCoordinates = () => {
    const diamondCenterX = 102;
    const diamondBottomY = 155;
    
    return {
      x1: diamondCenterX,
      y1: diamondBottomY,
      x2: circlePosition.x + 40,
      y2: circlePosition.y + 40,
    };
  };

  // Calculate curved path for smooth line
  const getCurvedPath = () => {
    const coords = getLineCoordinates();
    const x1 = coords.x1;
    const y1 = coords.y1;
    const x2 = coords.x2;
    const y2 = coords.y2;
    
    const controlPointOffset = Math.abs(y2 - y1) * 0.5;
    const cx1 = x1;
    const cy1 = y1 + controlPointOffset;
    const cx2 = x2;
    const cy2 = y2 - controlPointOffset;
    
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  // Calculate memory line coordinates
  const getMemoryLineCoordinates = () => {
    const diamondCenterX = 195;
    const diamondBottomY = 155;
    
    return {
      x1: diamondCenterX,
      y1: diamondBottomY,
      x2: memoryCirclePosition.x + 55,
      y2: memoryCirclePosition.y + 40,
    };
  };

  // Calculate curved path for memory line
  const getMemoryCurvedPath = () => {
    const coords = getMemoryLineCoordinates();
    const x1 = coords.x1;
    const y1 = coords.y1;
    const x2 = coords.x2;
    const y2 = coords.y2;
    
    const controlPointOffset = Math.abs(y2 - y1) * 0.5;
    const cx1 = x1;
    const cy1 = y1 + controlPointOffset;
    const cx2 = x2;
    const cy2 = y2 - controlPointOffset;
    
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  const handleCircleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingCircle(true);
    setDragOffset({
      x: e.clientX - circlePosition.x,
      y: e.clientY - circlePosition.y,
    });
  };

  const handleCircleMouseMove = (e: MouseEvent) => {
    if (isDraggingCircle) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setCirclePosition({
        x: newX,
        y: newY,
      });
    }
  };

  const handleCircleMouseUp = () => {
    setIsDraggingCircle(false);
  };

  React.useEffect(() => {
    if (isDraggingCircle) {
      window.addEventListener('mousemove', handleCircleMouseMove);
      window.addEventListener('mouseup', handleCircleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleCircleMouseMove);
      window.removeEventListener('mouseup', handleCircleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleCircleMouseMove);
      window.removeEventListener('mouseup', handleCircleMouseUp);
    };
  }, [isDraggingCircle, dragOffset]);

  // Memory circle drag handlers
  const handleMemoryCircleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingMemoryCircle(true);
    setMemoryDragOffset({
      x: e.clientX - memoryCirclePosition.x,
      y: e.clientY - memoryCirclePosition.y,
    });
  };

  const handleMemoryCircleMouseMove = (e: MouseEvent) => {
    if (isDraggingMemoryCircle) {
      const newX = e.clientX - memoryDragOffset.x;
      const newY = e.clientY - memoryDragOffset.y;
      setMemoryCirclePosition({
        x: newX,
        y: newY,
      });
    }
  };

  const handleMemoryCircleMouseUp = () => {
    setIsDraggingMemoryCircle(false);
  };

  React.useEffect(() => {
    if (isDraggingMemoryCircle) {
      window.addEventListener('mousemove', handleMemoryCircleMouseMove);
      window.addEventListener('mouseup', handleMemoryCircleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMemoryCircleMouseMove);
      window.removeEventListener('mouseup', handleMemoryCircleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMemoryCircleMouseMove);
      window.removeEventListener('mouseup', handleMemoryCircleMouseUp);
    };
  }, [isDraggingMemoryCircle, memoryDragOffset]);

  // Tool circle drag handlers
  const handleToolCircleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingToolCircle(true);
    setToolDragOffset({
      x: e.clientX - toolCirclePosition.x,
      y: e.clientY - toolCirclePosition.y,
    });
  };

  const handleToolCircleMouseMove = (e: MouseEvent) => {
    if (isDraggingToolCircle) {
      const newX = e.clientX - toolDragOffset.x;
      const newY = e.clientY - toolDragOffset.y;
      setToolCirclePosition({
        x: newX,
        y: newY,
      });
    }
  };

  const handleToolCircleMouseUp = () => {
    setIsDraggingToolCircle(false);
  };

  React.useEffect(() => {
    if (isDraggingToolCircle) {
      window.addEventListener('mousemove', handleToolCircleMouseMove);
      window.addEventListener('mouseup', handleToolCircleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleToolCircleMouseMove);
      window.removeEventListener('mouseup', handleToolCircleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleToolCircleMouseMove);
      window.removeEventListener('mouseup', handleToolCircleMouseUp);
    };
  }, [isDraggingToolCircle, toolDragOffset]);

  // Calculate tool line coordinates
  const getToolLineCoordinates = () => {
    const diamondCenterX = 312;
    const diamondBottomY = 155;
    
    return {
      x1: diamondCenterX,
      y1: diamondBottomY,
      x2: toolCirclePosition.x + 70,
      y2: toolCirclePosition.y + 40,
    };
  };

  // Calculate curved path for tool line
  const getToolCurvedPath = () => {
    const coords = getToolLineCoordinates();
    const x1 = coords.x1;
    const y1 = coords.y1;
    const x2 = coords.x2;
    const y2 = coords.y2;
    
    const controlPointOffset = Math.abs(y2 - y1) * 0.5;
    const cx1 = x1;
    const cy1 = y1 + controlPointOffset;
    const cx2 = x2;
    const cy2 = y2 - controlPointOffset;
    
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        transition: isDragging ? 'none' : 'all 0.3s ease',
      }}
    >
      <div className="flex flex-col items-center">
        {/* Main Rectangle */}
        <div
          className="relative flex items-center justify-center group"
          style={{
            width: '420px',
            height: '140px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.1))',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: '24px',
            cursor: isDragging ? 'grabbing' : 'grab',
            backdropFilter: 'blur(10px)',
            boxShadow: isExecuting 
              ? '0 0 80px rgba(139, 92, 246, 0.8), 0 0 120px rgba(139, 92, 246, 0.6), 0 10px 60px rgba(139, 92, 246, 0.5), inset 0 0 40px rgba(139, 92, 246, 0.2)' 
              : '0 0 20px rgba(139, 92, 246, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.05), 0 10px 40px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
          }}
          onMouseDown={onMouseDown}
        >
          {/* Delete Button - Top Right */}
          <button
            className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg p-2"
            style={{
              top: '12px',
              right: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="#ef4444" 
              viewBox="0 0 24 24" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Left Side - Purple Circle */}
          <div
            className="absolute"
            style={{
              left: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(99, 102, 241, 0.6))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
          />

          {/* AI Icon and Title */}
          <div className="flex items-center gap-4">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              }}
            >
              <svg 
                className="w-8 h-8" 
                fill="white" 
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <h3
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(to bottom, #a78bfa 0%, #8b5cf6 50%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                letterSpacing: '0.05em',
              }}
            >
              AI Agent
            </h3>
          </div>

          {/* Right Side - Connection Point and Plus Button */}
          <div
            className="absolute flex items-center"
            style={{
              right: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {/* Purple Circle - Always visible */}
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(99, 102, 241, 0.6))',
                border: '2px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            />

            {/* Connecting Line and Plus Button - Only when no children */}
            {!hasChildren && (
              <>
                {/* Connecting Line */}
                <div
                  style={{
                    width: '60px',
                    height: '2px',
                    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.6), rgba(99, 102, 241, 0.3))',
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.4)',
                  }}
                />

                {/* Plus Button */}
                <button
                  className="flex items-center justify-center rounded-lg transition-all"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddConnection?.();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="#a78bfa" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Three Diamonds Below Rectangle */}
        <div 
          className="flex items-start gap-12"
          style={{
            marginTop: '-12px',
          }}
        >
          {/* First Diamond - Chat Model */}
          <div className="flex flex-col items-center" ref={modelDiamondRef}>
            <div 
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowModelModal(true);
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.8))',
                  transform: 'rotate(45deg)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                className="hover:scale-110"
              />
              <span
                style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  color: '#c0d0e0',
                  fontWeight: '500',
                  letterSpacing: '0.02em',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                {selectedModel || 'Chat Model'}
              </span>
            </div>
          </div>

          {/* Second Diamond - Memory */}
          <div className="flex flex-col items-center" ref={memoryDiamondRef}>
            <div 
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowMemoryModal(true);
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.8))',
                  transform: 'rotate(45deg)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                className="hover:scale-110"
              />
              <span
                style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  color: '#c0d0e0',
                  fontWeight: '500',
                  letterSpacing: '0.02em',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                {selectedMemory || 'Memory'}
              </span>
            </div>
          </div>

          {/* Third Diamond - Tools */}
          <div className="flex flex-col items-center" ref={toolDiamondRef}>
            <div 
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowToolModal(true);
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.8))',
                  transform: 'rotate(45deg)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                className="hover:scale-110"
              />
              <span
                style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                  color: '#c0d0e0',
                  fontWeight: '500',
                  letterSpacing: '0.02em',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.2)',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                Tools
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Curved Connection Line - shown after model selection */}
      {selectedModel && (() => {
        const pathData = getCurvedPath();
        return (
          <svg
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 5,
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(139, 92, 246, 0.6)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(99, 102, 241, 0.3)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d={pathData}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))',
              }}
            />
          </svg>
        );
      })()}

      {/* Draggable Circle with Model Icon - shown after model selection */}
      {selectedModel && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${circlePosition.x}px`,
            top: `${circlePosition.y}px`,
            cursor: isDraggingCircle ? 'grabbing' : 'grab',
            transition: isDraggingCircle ? 'none' : 'all 0.3s ease',
            zIndex: 10,
          }}
          onMouseDown={handleCircleMouseDown}
        >
          <div
            className="relative group"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
            }}
          >
            {/* Delete Button - Top Right */}
            <button
              className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full p-1.5"
              style={{
                top: '-8px',
                right: '-8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backdropFilter: 'blur(10px)',
                zIndex: 20,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedModel(null);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
            >
              <svg 
                className="w-3 h-3" 
                fill="none" 
                stroke="#ef4444" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white',
                fontWeight: 'bold',
                fontFamily: "'Orbitron', sans-serif",
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                overflow: 'hidden',
              }}
            >
              {selectedModel === 'ChatGPT' ? '⚡' : selectedModel === 'Claude' ? '🤖' : selectedModel === 'Llama 3' ? (
                <img src="/llama3.png" alt="Llama 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : 'G'}
            </div>
          </div>
          
          {/* Title and Subtitle */}
          <div className="flex flex-col items-center" style={{ marginTop: '16px', pointerEvents: 'none' }}>
            <span
              style={{
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
                color: '#ffffff',
                fontWeight: '600',
                letterSpacing: '0.02em',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              }}
            >
              {selectedModel}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                color: '#9ca3af',
                fontWeight: '400',
                letterSpacing: '0.02em',
                marginTop: '4px',
              }}
            >
              Chat Model
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Curved Connection Line for Memory - shown after memory selection */}
      {selectedMemory && (() => {
        const pathData = getMemoryCurvedPath();
        return (
          <svg
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 5,
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id="memoryLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(139, 92, 246, 0.6)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(99, 102, 241, 0.3)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d={pathData}
              stroke="url(#memoryLineGradient)"
              strokeWidth="2"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))',
              }}
            />
          </svg>
        );
      })()}

      {/* Draggable Circle with Memory Icon - shown after memory selection */}
      {selectedMemory && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${memoryCirclePosition.x}px`,
            top: `${memoryCirclePosition.y}px`,
            cursor: isDraggingMemoryCircle ? 'grabbing' : 'grab',
            transition: isDraggingMemoryCircle ? 'none' : 'all 0.3s ease',
            zIndex: 10,
          }}
          onMouseDown={handleMemoryCircleMouseDown}
        >
          <div
            className="relative group"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
            }}
          >
            {/* Delete Button - Top Right */}
            <button
              className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full p-1.5"
              style={{
                top: '-8px',
                right: '-8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backdropFilter: 'blur(10px)',
                zIndex: 20,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMemory(null);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
            >
              <svg 
                className="w-3 h-3" 
                fill="none" 
                stroke="#ef4444" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: selectedMemory === 'MongoDB' ? '#10aa50' : selectedMemory === 'Redis' ? '#dc2626' : selectedMemory === 'PostgreSQL' ? '#3b82f6' : '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                overflow: 'hidden',
              }}
            >
              {selectedMemory === 'MongoDB' ? (
                <img src="/mogodb.png" alt="MongoDB" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : selectedMemory === 'Redis' ? '⚡' : selectedMemory === 'PostgreSQL' ? '🐘' : '∅'}
            </div>
          </div>
          
          {/* Title and Subtitle */}
          <div className="flex flex-col items-center" style={{ marginTop: '16px', pointerEvents: 'none' }}>
            <span
              style={{
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
                color: '#ffffff',
                fontWeight: '600',
                letterSpacing: '0.02em',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              }}
            >
              {selectedMemory}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                color: '#9ca3af',
                fontWeight: '400',
                letterSpacing: '0.02em',
                marginTop: '4px',
              }}
            >
              Memory
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Curved Connection Line for Tool - shown after tool selection */}
      {selectedTool && (() => {
        const pathData = getToolCurvedPath();
        return (
          <svg
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 5,
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id="toolLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(139, 92, 246, 0.6)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(99, 102, 241, 0.3)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d={pathData}
              stroke="url(#toolLineGradient)"
              strokeWidth="2"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))',
              }}
            />
          </svg>
        );
      })()}

      {/* Draggable Circle with Tool Icon - shown after tool selection */}
      {selectedTool && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${toolCirclePosition.x}px`,
            top: `${toolCirclePosition.y}px`,
            cursor: isDraggingToolCircle ? 'grabbing' : 'grab',
            transition: isDraggingToolCircle ? 'none' : 'all 0.3s ease',
            zIndex: 10,
          }}
          onMouseDown={handleToolCircleMouseDown}
        >
          <div
            className="relative group"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
            }}
          >
            {/* Delete Button - Top Right */}
            <button
              className="absolute opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full p-1.5"
              style={{
                top: '-8px',
                right: '-8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backdropFilter: 'blur(10px)',
                zIndex: 20,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTool(null);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              }}
            >
              <svg 
                className="w-3 h-3" 
                fill="none" 
                stroke="#ef4444" 
                viewBox="0 0 24 24" 
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                overflow: 'hidden',
              }}
            >
              {selectedTool === 'Code Interpreter' ? (
                <img src="/codeinterpretor.png" alt="Code Interpreter" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : selectedTool === 'Web Search' ? '🔍' : selectedTool === 'Image Generator' ? '🎨' : '🔧'}
            </div>
          </div>
          
          {/* Title and Subtitle */}
          <div className="flex flex-col items-center" style={{ marginTop: '16px', pointerEvents: 'none' }}>
            <span
              style={{
                fontSize: '16px',
                fontFamily: "'Inter', sans-serif",
                color: '#ffffff',
                fontWeight: '600',
                letterSpacing: '0.02em',
                textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              }}
            >
              {selectedTool}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontFamily: "'Inter', sans-serif",
                color: '#9ca3af',
                fontWeight: '400',
                letterSpacing: '0.02em',
                marginTop: '4px',
              }}
            >
              Tool
            </span>
          </div>
        </div>
      )}

      {/* Add font imports */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      {/* Chat Model Selection Modal */}
      {showModelModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowModelModal(false)}
        >
          <div
            className="relative"
            style={{
              width: '400px',
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.95))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: "'Inter', sans-serif",
                color: '#ffffff',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              Select Chat Model
            </h2>

            <div className="flex flex-col gap-3">
              {models.map((model) => (
                <button
                  key={model}
                  className="w-full transition-all duration-200"
                  style={{
                    padding: '16px 24px',
                    background: selectedModel === model 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))'
                      : 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))',
                    border: selectedModel === model
                      ? '1px solid rgba(139, 92, 246, 0.5)'
                      : '1px solid rgba(156, 163, 175, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleModelSelect(model)}
                  onMouseEnter={(e) => {
                    if (selectedModel !== model) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.4))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedModel !== model) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                    }
                  }}
                >
                  {model}
                </button>
              ))}
            </div>

            <button
              className="w-full mt-6 transition-all duration-200"
              style={{
                padding: '12px',
                background: 'rgba(156, 163, 175, 0.1)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
              }}
              onClick={() => setShowModelModal(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(156, 163, 175, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(156, 163, 175, 0.1)';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Memory Selection Modal */}
      {showMemoryModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowMemoryModal(false)}
        >
          <div
            className="relative"
            style={{
              width: '400px',
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.95))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: "'Inter', sans-serif",
                color: '#ffffff',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              Select Memory
            </h2>

            <div className="flex flex-col gap-3">
              {memories.map((memory) => (
                <button
                  key={memory}
                  className="w-full transition-all duration-200"
                  style={{
                    padding: '16px 24px',
                    background: selectedMemory === memory 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))'
                      : 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))',
                    border: selectedMemory === memory
                      ? '1px solid rgba(139, 92, 246, 0.5)'
                      : '1px solid rgba(156, 163, 175, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleMemorySelect(memory)}
                  onMouseEnter={(e) => {
                    if (selectedMemory !== memory) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.4))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMemory !== memory) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                    }
                  }}
                >
                  {memory}
                </button>
              ))}
            </div>

            <button
              className="w-full mt-6 transition-all duration-200"
              style={{
                padding: '12px',
                background: 'rgba(156, 163, 175, 0.1)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
              }}
              onClick={() => setShowMemoryModal(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(156, 163, 175, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(156, 163, 175, 0.1)';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tools Selection Modal */}
      {showToolModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowToolModal(false)}
        >
          <div
            className="relative"
            style={{
              width: '400px',
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.95))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                fontFamily: "'Inter', sans-serif",
                color: '#ffffff',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              Select Tool
            </h2>

            <div className="flex flex-col gap-3">
              {tools.map((tool) => (
                <button
                  key={tool}
                  className="w-full transition-all duration-200"
                  style={{
                    padding: '16px 24px',
                    background: selectedTool === tool 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))'
                      : 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))',
                    border: selectedTool === tool
                      ? '1px solid rgba(139, 92, 246, 0.5)'
                      : '1px solid rgba(156, 163, 175, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleToolSelect(tool)}
                  onMouseEnter={(e) => {
                    if (selectedTool !== tool) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.4))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTool !== tool) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                    }
                  }}
                >
                  {tool}
                </button>
              ))}
            </div>

            <button
              className="w-full mt-6 transition-all duration-200"
              style={{
                padding: '12px',
                background: 'rgba(156, 163, 175, 0.1)',
                border: '1px solid rgba(156, 163, 175, 0.3)',
                borderRadius: '8px',
                color: '#9ca3af',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
              }}
              onClick={() => setShowToolModal(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(156, 163, 175, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(156, 163, 175, 0.1)';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

