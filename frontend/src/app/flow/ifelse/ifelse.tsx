'use client';

import React from 'react';

interface IfElseNodeProps {
  id: string;
  position: { x: number; y: number };
  isDragging?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDelete: () => void;
  onAddConnection?: (branch?: 'true' | 'false') => void;
  hasTrueChild?: boolean;
  hasFalseChild?: boolean;
  data?: {
    icon?: string;
    color?: string;
  };
  isExecuting?: boolean;
}

export default function IfElseNode({ 
  id, 
  position, 
  isDragging, 
  onMouseDown, 
  onDelete,
  onAddConnection,
  hasTrueChild,
  hasFalseChild,
  data,
  isExecuting 
}: IfElseNodeProps) {
  return (
    <div
      className="absolute hover:shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        transition: isDragging ? 'none' : 'all 0.2s',
        pointerEvents: isDragging ? 'none' : 'auto',
      }}
    >
      <div className="flex flex-col items-center">
        {/* Main Node Card - Rounded Square */}
        <div
          className="relative shadow-lg transition-all hover:shadow-xl group"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.1))',
            border: '2px solid rgba(139, 92, 246, 0.4)',
            width: '160px',
            height: '160px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '32px',
            cursor: isDragging ? 'grabbing' : 'grab',
            backdropFilter: 'blur(10px)',
            boxShadow: isExecuting 
              ? '0 0 80px rgba(139, 92, 246, 0.8), 0 0 120px rgba(139, 92, 246, 0.6), 0 10px 60px rgba(139, 92, 246, 0.5), inset 0 0 40px rgba(139, 92, 246, 0.2)' 
              : '0 0 20px rgba(139, 92, 246, 0.2), inset 0 0 20px rgba(139, 92, 246, 0.05), 0 10px 40px rgba(0, 0, 0, 0.3)',
          }}
          onMouseDown={onMouseDown}
          title="Double-click to configure"
        >
          {/* Delete Button - Top Right */}
          <button
            className="absolute opacity-0 hover:opacity-100 transition-opacity rounded-full p-1 hover:bg-red-50"
            style={{
              top: '8px',
              right: '8px',
              zIndex: 10,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="#ef4444" 
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* IfElse Image - Center */}
          <div
            className="flex items-center justify-center"
            style={{
              width: '120px',
              height: '120px',
              cursor: 'pointer',
            }}
          >
            <img 
              src="/ifelse1.png" 
              alt="If/Else"
              className="w-full h-full object-contain"
              style={{
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Connection Point - Left Side (Receiving) */}
          <div
            className="absolute"
            style={{
              left: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(99, 102, 241, 0.6))',
                border: '2px solid rgba(139, 92, 246, 0.5)',
                boxShadow: '0 0 15px rgba(139, 92, 246, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            />
          </div>

          {/* Connection Point - Right Side TRUE */}
          <div
            className="absolute"
            style={{
              right: '-5px',
              top: '30%', 
              transform: 'translateY(-50%)',
            }}
          >
            {/* True Label - Always visible */}
            <span
              className="font-medium"
              style={{
                position: 'absolute',
                left: '28px',
                top: '-20px',
                color: '#a78bfa',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: '600',
              }}
            >
              true
            </span>
            
            <div className="flex items-center">
              {/* Purple Circle - Always visible */}
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(99, 102, 241, 0.6))',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              />
              
              {/* Connecting Line and Plus Button - Only when no child */}
              {!hasTrueChild && (
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddConnection?.('true');
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

          {/* Connection Point - Right Side FALSE */}
          <div
            className="absolute"
            style={{
              right: '-5px',
              top: '70%', 
              transform: 'translateY(-50%)',
            }}
          >
            {/* False Label - Always visible */}
            <span
              className="font-medium"
              style={{
                position: 'absolute',
                left: '28px',
                top: '-20px',
                color: '#8b5cf6',
                fontSize: '14px',
                fontFamily: "'Inter', sans-serif",
                fontWeight: '600',
              }}
            >
              false
            </span>
            
            <div className="flex items-center">
              {/* Purple Circle - Always visible */}
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(99, 102, 241, 0.6))',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  boxShadow: '0 0 15px rgba(139, 92, 246, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
                }}
              />
              
              {/* Connecting Line and Plus Button - Only when no child */}
              {!hasFalseChild && (
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddConnection?.('false');
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
        </div>

        {/* Text Below Card */}
        <div className="mt-4 text-center">
          <h3
            className="font-semibold mb-1"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '16px',
              fontWeight: 'bold',
              background: 'linear-gradient(to bottom, #a78bfa 0%, #8b5cf6 50%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
              letterSpacing: '0.05em',
            }}
          >
            If/Else
          </h3>
          <p
            className="text-sm"
            style={{
              color: '#c0d0e0',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '500',
              letterSpacing: '0.02em',
            }}
          >
            Conditional routing
          </p>
        </div>
      </div>

      {/* Add font imports */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>
    </div>
  );
}

