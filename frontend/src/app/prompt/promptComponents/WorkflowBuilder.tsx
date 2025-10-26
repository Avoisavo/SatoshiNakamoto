'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WorkflowNode {
  id: string;
  type: 'action' | 'condition';
  label: string;
  position: { x: number; y: number };
}

interface WorkflowBuilderProps {
  prompt?: string;
}

export default function WorkflowBuilder({ prompt }: WorkflowBuilderProps) {
  const router = useRouter();
  const [nodes] = useState<WorkflowNode[]>([
    { id: '1', type: 'action', label: 'Bridge USDC', position: { x: 80, y: 80 } },
    { id: '2', type: 'action', label: 'Ethereum → Polygon', position: { x: 80, y: 160 } },
    { id: '3', type: 'action', label: 'Deposit to Aave', position: { x: 80, y: 240 } },
  ]);

  return (
    <div className="flex-1 flex items-center justify-center p-6 animate-fade-in">
      {/* Workflow Canvas */}
      <div 
        className="w-full h-full rounded-xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(40, 40, 50, 0.3), rgba(20, 20, 30, 0.5))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 15px 40px 0 rgba(0, 0, 0, 0.6),
            inset 0 1px 2px 0 rgba(255, 255, 255, 0.1),
            0 0 60px rgba(100, 150, 200, 0.15)
          `,
        }}
      >
        {/* Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 animate-fade-in"
          style={{
            backgroundImage: `
              linear-gradient(rgba(100, 150, 200, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100, 150, 200, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px',
            animationDelay: '0.2s',
            animationFillMode: 'both',
          }}
        />

        {/* Workflow Title */}
        <div 
          className="absolute top-4 left-4 z-10 animate-slide-in-left"
          style={{
            animationDelay: '0.3s',
            animationFillMode: 'both',
          }}
        >
          <h2 
            className="text-lg font-bold mb-1.5"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(to bottom, #ffffff 0%, #e0e8f0 50%, #9fb5cc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Workflow Builder
          </h2>
          {prompt && (
            <p 
              className="text-xs max-w-md"
              style={{
                color: '#8ab4f8',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {prompt}
            </p>
          )}
        </div>

        {/* Workflow Nodes */}
        <div className="relative w-full h-full p-8">
          <svg className="absolute inset-0 w-full h-full pointer-events-none animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
            {/* Connection lines */}
            <line
              x1="150"
              y1="110"
              x2="150"
              y2="155"
              stroke="rgba(138, 180, 248, 0.5)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <line
              x1="150"
              y1="185"
              x2="150"
              y2="235"
              stroke="rgba(138, 180, 248, 0.5)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>

          {nodes.map((node, index) => (
            <div
              key={node.id}
              className="absolute cursor-move animate-scale-in"
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                animationDelay: `${0.5 + index * 0.2}s`,
                animationFillMode: 'both',
              }}
            >
              <div
                className="px-4 py-2.5 rounded-lg min-w-[160px] transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(100, 150, 200, 0.4), rgba(80, 120, 180, 0.5))',
                  border: '1px solid rgba(150, 180, 220, 0.4)',
                  backdropFilter: 'blur(15px)',
                  boxShadow: `
                    0 8px 24px rgba(0, 0, 0, 0.4),
                    0 4px 12px rgba(80, 120, 180, 0.2),
                    inset 0 1px 2px rgba(255, 255, 255, 0.2),
                    0 0 20px rgba(100, 150, 200, 0.15)
                  `,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                      {index + 1}
                    </span>
                  </div>
                  <p 
                    className="text-xs font-semibold"
                    style={{
                      color: '#e0e8f0',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {node.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Action Button */}
        <div 
          className="absolute bottom-4 right-4 animate-slide-in-up"
          style={{
            animationDelay: '1.2s',
            animationFillMode: 'both',
          }}
        >
          <button
            onClick={() => router.push('/workflow')}
            className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all hover:scale-105"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              background: 'linear-gradient(135deg, rgba(100, 150, 200, 0.5), rgba(80, 120, 180, 0.6))',
              border: '1px solid rgba(150, 180, 220, 0.4)',
              color: '#ffffff',
              backdropFilter: 'blur(15px)',
              boxShadow: '0 4px 12px rgba(80, 120, 180, 0.3)',
              fontSize: '12px',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Action
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.7s ease-out;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

