import React from 'react';

interface StartButtonProps {
  transform: {
    x: number;
    y: number;
    scale: number;
  };
  onClick: () => void;
  onAddConnection?: () => void;
  hasChildren?: boolean;
}

export default function StartButton({ transform, onClick, onAddConnection, hasChildren }: StartButtonProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        // ADJUST START BUTTON
        transform: `translate(${-transform.x / transform.scale - 180}px, ${-transform.y / transform.scale - 30}px)`,
      }}
    >
      <button
        onClick={onClick}
        className="transition-all hover:scale-105 active:scale-95"
        style={{
          padding: '16px 32px',
          background: 'linear-gradient(135deg, rgba(100, 150, 200, 0.9), rgba(80, 120, 180, 0.9))',
          border: '2px solid rgba(150, 180, 220, 0.6)',
          borderRadius: '12px',
          color: '#ffffff',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '18px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          backdropFilter: 'blur(15px)',
          boxShadow: `
            0 12px 40px rgba(80, 120, 180, 0.4),
            inset 0 1px 2px rgba(255, 255, 255, 0.3),
            0 0 60px rgba(100, 150, 200, 0.3)
          `,
          cursor: 'pointer',
        }}
      >
        <span className="flex items-center gap-2">
          <svg 
            className="w-6 h-6" 
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
          Start with a Node
        </span>
      </button>
    </div>
  );
}

