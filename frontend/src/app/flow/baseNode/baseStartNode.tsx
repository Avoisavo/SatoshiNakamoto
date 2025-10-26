'use client';

import React, { useState, useRef } from 'react';

interface BaseStartNodeProps {
  id: string;
  position: { x: number; y: number };
  isDragging?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDelete: () => void;
  onAddConnection?: () => void;
  hasChildren?: boolean;
  data?: Record<string, unknown>;
  isExecuting?: boolean;
}

export default function BaseStartNode({ 
  id, 
  position, 
  isDragging, 
  onMouseDown, 
  onDelete,
  onAddConnection,
  hasChildren,
  data,
  isExecuting 
}: BaseStartNodeProps) {
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [showMiddlewareModal, setShowMiddlewareModal] = useState(false);
  const [selectedMiddleware, setSelectedMiddleware] = useState<string | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [circlePosition, setCirclePosition] = useState({ x: 100, y: 250 });
  const [isDraggingCircle, setIsDraggingCircle] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [middlewareCirclePosition, setMiddlewareCirclePosition] = useState({ x: 300, y: 250 });
  const [isDraggingMiddlewareCircle, setIsDraggingMiddlewareCircle] = useState(false);
  const [middlewareDragOffset, setMiddlewareDragOffset] = useState({ x: 0, y: 0 });
  const [contractCirclePosition, setContractCirclePosition] = useState({ x: 500, y: 250 });
  const [isDraggingContractCircle, setIsDraggingContractCircle] = useState(false);
  const [contractDragOffset, setContractDragOffset] = useState({ x: 0, y: 0 });
  const protocolDiamondRef = useRef<HTMLDivElement>(null);
  const middlewareDiamondRef = useRef<HTMLDivElement>(null);
  const contractDiamondRef = useRef<HTMLDivElement>(null);

  const protocols = ['Wormhole', 'LayerZero', 'Axelar'];
  const middlewares = ['Pyth', 'Chainlink', 'Band Protocol', 'Base account'];
  const contracts = ['ERC20', 'ERC721', 'ERC1155', 'Custom Contract'];

  const handleProtocolSelect = (protocol: string) => {
    setSelectedProtocol(protocol);
    setShowProtocolModal(false);
  };

  const handleMiddlewareSelect = (middleware: string) => {
    setSelectedMiddleware(middleware);
    setShowMiddlewareModal(false);
  };

  const handleContractSelect = (contract: string) => {
    setSelectedContract(contract);
    setShowContractModal(false);
  };

  // Calculate line coordinates
  const getLineCoordinates = () => {
    // Adjust x1 to move the line start point to the right
    const diamondCenterX = 42; // Move right from 0 to 140 (adjust this value as needed)
    const diamondBottomY = 155; // Position below the diamond
    
    return {
      x1: diamondCenterX,
      y1: diamondBottomY,
      x2: circlePosition.x + 40, // Center of circle (40 is half the circle width)
      y2: circlePosition.y + 40, // Center of circle
    };
  };

  // Calculate curved path for smooth line
  const getCurvedPath = () => {
    const coords = getLineCoordinates();
    const x1 = coords.x1;
    const y1 = coords.y1;
    const x2 = coords.x2;
    const y2 = coords.y2;
    
    // Control points for bezier curve
    const controlPointOffset = Math.abs(y2 - y1) * 0.5;
    const cx1 = x1;
    const cy1 = y1 + controlPointOffset;
    const cx2 = x2;
    const cy2 = y2 - controlPointOffset;
    
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  };

  // Calculate middleware line coordinates
  const getMiddlewareLineCoordinates = () => {
    const diamondCenterX = 157; // Middle ware diamond position
    const diamondBottomY = 155; // Position below the diamond
    
    return {
      x1: diamondCenterX,
      y1: diamondBottomY,
      x2: middlewareCirclePosition.x + 55,
      y2: middlewareCirclePosition.y + 40,
    };
  };

  // Calculate curved path for middleware line
  const getMiddlewareCurvedPath = () => {
    const coords = getMiddlewareLineCoordinates();
    const x1 = coords.x1;
    const y1 = coords.y1;
    const x2 = coords.x2;
    const y2 = coords.y2;
    
    // Control points for bezier curve
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

  // Middleware circle drag handlers
  const handleMiddlewareCircleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingMiddlewareCircle(true);
    setMiddlewareDragOffset({
      x: e.clientX - middlewareCirclePosition.x,
      y: e.clientY - middlewareCirclePosition.y,
    });
  };

  const handleMiddlewareCircleMouseMove = (e: MouseEvent) => {
    if (isDraggingMiddlewareCircle) {
      const newX = e.clientX - middlewareDragOffset.x;
      const newY = e.clientY - middlewareDragOffset.y;
      setMiddlewareCirclePosition({
        x: newX,
        y: newY,
      });
    }
  };

  const handleMiddlewareCircleMouseUp = () => {
    setIsDraggingMiddlewareCircle(false);
  };

  React.useEffect(() => {
    if (isDraggingMiddlewareCircle) {
      window.addEventListener('mousemove', handleMiddlewareCircleMouseMove);
      window.addEventListener('mouseup', handleMiddlewareCircleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMiddlewareCircleMouseMove);
      window.removeEventListener('mouseup', handleMiddlewareCircleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMiddlewareCircleMouseMove);
      window.removeEventListener('mouseup', handleMiddlewareCircleMouseUp);
    };
  }, [isDraggingMiddlewareCircle, middlewareDragOffset]);

  // Contract circle drag handlers
  const handleContractCircleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingContractCircle(true);
    setContractDragOffset({
      x: e.clientX - contractCirclePosition.x,
      y: e.clientY - contractCirclePosition.y,
    });
  };

  const handleContractCircleMouseMove = (e: MouseEvent) => {
    if (isDraggingContractCircle) {
      const newX = e.clientX - contractDragOffset.x;
      const newY = e.clientY - contractDragOffset.y;
      setContractCirclePosition({
        x: newX,
        y: newY,
      });
    }
  };

  const handleContractCircleMouseUp = () => {
    setIsDraggingContractCircle(false);
  };

  React.useEffect(() => {
    if (isDraggingContractCircle) {
      window.addEventListener('mousemove', handleContractCircleMouseMove);
      window.addEventListener('mouseup', handleContractCircleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleContractCircleMouseMove);
      window.removeEventListener('mouseup', handleContractCircleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleContractCircleMouseMove);
      window.removeEventListener('mouseup', handleContractCircleMouseUp);
    };
  }, [isDraggingContractCircle, contractDragOffset]);

  // Calculate contract line coordinates
  const getContractLineCoordinates = () => {
    const diamondCenterX = 298; // Smart contract diamond position (third diamond)
    const diamondBottomY = 155; // Position below the diamond
    
    return {
      x1: diamondCenterX,
      y1: diamondBottomY,
      x2: contractCirclePosition.x + 70,
      y2: contractCirclePosition.y + 40,
    };
  };

  // Calculate curved path for contract line
  const getContractCurvedPath = () => {
    const coords = getContractLineCoordinates();
    const x1 = coords.x1;
    const y1 = coords.y1;
    const x2 = coords.x2;
    const y2 = coords.y2;
    
    // Control points for bezier curve
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(96, 165, 250, 0.1))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '24px',
            cursor: isDragging ? 'grabbing' : 'grab',
            backdropFilter: 'blur(10px)',
            boxShadow: isExecuting 
              ? '0 0 80px rgba(59, 130, 246, 0.8), 0 0 120px rgba(59, 130, 246, 0.6), 0 10px 60px rgba(59, 130, 246, 0.5), inset 0 0 40px rgba(59, 130, 246, 0.2)' 
              : '0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.05), 0 10px 40px rgba(0, 0, 0, 0.3)',
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

          {/* Left Side - Blue Circle */}
          <div
            className="absolute"
            style={{
              left: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(96, 165, 250, 0.6))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            }}
          />

          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <img 
              src="/baselogo.png" 
              alt="Base Logo"
              style={{
                width: '64px',
                height: '64px',
              }}
            />
            <h3
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                letterSpacing: '0.05em',
              }}
            >
              Base
            </h3>
          </div>

          {/* Right Side - Connection Point and Plus Button */}
            <div
              className="absolute flex items-center"
              style={{
                right: '-120px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
            {/* Blue Circle - Always visible */}
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(96, 165, 250, 0.6))',
                  border: '2px solid rgba(59, 130, 246, 0.5)',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
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
                  background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.6), rgba(96, 165, 250, 0.3))',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
                }}
              />

              {/* Plus Button */}
              <button
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '2px solid rgba(59, 130, 246, 0.4)',
                  backdropFilter: 'blur(10px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddConnection?.();
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="#60a5fa" viewBox="0 0 24 24" strokeWidth={2.5}>
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
          {/* First Diamond - Protocol */}
          <div className="flex flex-col items-center" ref={protocolDiamondRef}>
            <div 
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowProtocolModal(true);
              }}
            >
            <div
              style={{
                width: '24px',
                height: '24px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(96, 165, 250, 0.8))',
                transform: 'rotate(45deg)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
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
                {selectedProtocol || 'Protocol'}
              </span>
            </div>

          </div>

          {/* Second Diamond - Middle ware */}
          <div className="flex flex-col items-center" ref={middlewareDiamondRef}>
            <div 
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowMiddlewareModal(true);
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, rgba(75, 85, 99, 0.9), rgba(55, 65, 81, 0.8))',
                  transform: 'rotate(45deg)',
                  border: '1px solid rgba(156, 163, 175, 0.4)',
                  boxShadow: '0 0 20px rgba(75, 85, 99, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
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
                {selectedMiddleware || 'Middle ware'}
              </span>
            </div>
          </div>

          {/* Third Diamond - Smart contract */}
          <div className="flex flex-col items-center" ref={contractDiamondRef}>
            <div 
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setShowContractModal(true);
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(96, 165, 250, 0.8))',
                  transform: 'rotate(45deg)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
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
                Smart contract
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Curved Connection Line - shown after protocol selection */}
      {selectedProtocol && (() => {
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
                <stop offset="0%" style={{ stopColor: 'rgba(59, 130, 246, 0.6)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(96, 165, 250, 0.3)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d={pathData}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))',
              }}
            />
          </svg>
        );
      })()}

      {/* Draggable Circle with LayerZero Logo - shown after protocol selection */}
      {selectedProtocol && (
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
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)',
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
                setSelectedProtocol(null);
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

            <img 
              src="/layerzerologo.png" 
              alt="LayerZero Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
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
              Layer zero
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
              Bridging
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Curved Connection Line for Middleware - shown after middleware selection */}
      {selectedMiddleware && (() => {
        const pathData = getMiddlewareCurvedPath();
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
              <linearGradient id="middlewareLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(59, 130, 246, 0.6)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(96, 165, 250, 0.3)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d={pathData}
              stroke="url(#middlewareLineGradient)"
              strokeWidth="2"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))',
              }}
            />
          </svg>
        );
      })()}

      {/* Draggable Circle with Middleware Logo - shown after middleware selection */}
      {selectedMiddleware && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${middlewareCirclePosition.x}px`,
            top: `${middlewareCirclePosition.y}px`,
            cursor: isDraggingMiddlewareCircle ? 'grabbing' : 'grab',
            transition: isDraggingMiddlewareCircle ? 'none' : 'all 0.3s ease',
            zIndex: 10,
          }}
          onMouseDown={handleMiddlewareCircleMouseDown}
        >
          <div
            className="relative group"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.15))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.05)',
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
                setSelectedMiddleware(null);
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

            <img 
              src={selectedMiddleware === 'Base account' ? '/newbaselogo.png' : '/pythlogo.png'}
              alt={selectedMiddleware === 'Base account' ? 'Base Logo' : 'Pyth Logo'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
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
              {selectedMiddleware}
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
              {selectedMiddleware === 'Base account' ? 'Account' : 'Oracle'}
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Curved Connection Line for Contract - shown after contract selection */}
      {selectedContract && (() => {
        const pathData = getContractCurvedPath();
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
              <linearGradient id="contractLineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgba(59, 130, 246, 0.6)', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(96, 165, 250, 0.3)', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path
              d={pathData}
              stroke="url(#contractLineGradient)"
              strokeWidth="2"
              fill="none"
              style={{
                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))',
              }}
            />
          </svg>
        );
      })()}

      {/* Draggable Circle with Contract Icon - shown after contract selection */}
      {selectedContract && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${contractCirclePosition.x}px`,
            top: `${contractCirclePosition.y}px`,
            cursor: isDraggingContractCircle ? 'grabbing' : 'grab',
            transition: isDraggingContractCircle ? 'none' : 'all 0.3s ease',
            zIndex: 10,
          }}
          onMouseDown={handleContractCircleMouseDown}
        >
          <div
            className="relative group"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.15))',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.05)',
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
                setSelectedContract(null);
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

            <img 
              src="/blockscoutlogo.png" 
              alt="Contract Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
              }}
            />
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
              {selectedContract}
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
              Smart Contract
            </span>
          </div>
        </div>
      )}

      {/* Add font imports */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      {/* Protocol Selection Modal */}
      {showProtocolModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowProtocolModal(false)}
        >
          <div
            className="relative"
            style={{
              width: '400px',
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.95))',
              border: '1px solid rgba(255, 255, 255, 0.2)',
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
              Select Protocol
            </h2>

            <div className="flex flex-col gap-3">
              {protocols.map((protocol) => (
                <button
                  key={protocol}
                  className="w-full transition-all duration-200"
                  style={{
                    padding: '16px 24px',
                    background: selectedProtocol === protocol 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))'
                      : 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))',
                    border: selectedProtocol === protocol
                      ? '1px solid rgba(59, 130, 246, 0.5)'
                      : '1px solid rgba(156, 163, 175, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleProtocolSelect(protocol)}
                  onMouseEnter={(e) => {
                    if (selectedProtocol !== protocol) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.4))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedProtocol !== protocol) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                    }
                  }}
                >
                  {protocol}
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
              onClick={() => setShowProtocolModal(false)}
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

      {/* Middleware Selection Modal */}
      {showMiddlewareModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowMiddlewareModal(false)}
        >
          <div
            className="relative"
            style={{
              width: '400px',
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.95))',
              border: '1px solid rgba(255, 255, 255, 0.2)',
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
              Select Middleware
            </h2>

            <div className="flex flex-col gap-3">
              {middlewares.map((middleware) => (
                <button
                  key={middleware}
                  className="w-full transition-all duration-200"
                  style={{
                    padding: '16px 24px',
                    background: selectedMiddleware === middleware 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))'
                      : 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))',
                    border: selectedMiddleware === middleware
                      ? '1px solid rgba(59, 130, 246, 0.5)'
                      : '1px solid rgba(156, 163, 175, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleMiddlewareSelect(middleware)}
                  onMouseEnter={(e) => {
                    if (selectedMiddleware !== middleware) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.4))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedMiddleware !== middleware) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                    }
                  }}
                >
                  {middleware}
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
              onClick={() => setShowMiddlewareModal(false)}
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

      {/* Smart Contract Selection Modal */}
      {showContractModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
          }}
          onClick={() => setShowContractModal(false)}
        >
          <div
            className="relative"
            style={{
              width: '400px',
              background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95), rgba(20, 20, 30, 0.95))',
              border: '1px solid rgba(255, 255, 255, 0.2)',
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
              Select Smart Contract
            </h2>

            <div className="flex flex-col gap-3">
              {contracts.map((contract) => (
                <button
                  key={contract}
                  className="w-full transition-all duration-200"
                  style={{
                    padding: '16px 24px',
                    background: selectedContract === contract 
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3))'
                      : 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))',
                    border: selectedContract === contract
                      ? '1px solid rgba(59, 130, 246, 0.5)'
                      : '1px solid rgba(156, 163, 175, 0.3)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleContractSelect(contract)}
                  onMouseEnter={(e) => {
                    if (selectedContract !== contract) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.4), rgba(55, 65, 81, 0.4))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedContract !== contract) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(75, 85, 99, 0.2), rgba(55, 65, 81, 0.2))';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                    }
                  }}
                >
                  {contract}
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
              onClick={() => setShowContractModal(false)}
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
