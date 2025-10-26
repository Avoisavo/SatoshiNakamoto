'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';
import Header from '../../../component/Header';
import ChatBox from './promptComponents/ChatBox';
import WorkflowBuilder from './promptComponents/WorkflowBuilder';
import TemplateSidebar from '../../../component/TemplateSidebar';

// Floating dust particles component (same as landing page)
function FloatingDust() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 1000;
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 30;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 25;
      
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.015;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions, velocities };
  }, []);
  
  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      positions[i3] += particles.velocities[i3];
      positions[i3 + 1] += particles.velocities[i3 + 1];
      positions[i3 + 2] += particles.velocities[i3 + 2];
      
      positions[i3 + 1] += Math.sin(time + i * 0.1) * 0.002;
      
      if (positions[i3] > 15) positions[i3] = -15;
      if (positions[i3] < -15) positions[i3] = 15;
      if (positions[i3 + 1] > 10) positions[i3 + 1] = -10;
      if (positions[i3 + 1] < -10) positions[i3 + 1] = 10;
      if (positions[i3 + 2] > 12) positions[i3 + 2] = -12;
      if (positions[i3 + 2] < -12) positions[i3 + 2] = 12;
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
          args={[particles.positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#8ab4f8"
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// 3D Background Scene
function BackgroundScene() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, -8]} intensity={30} color="#4a9fff" distance={20} />
      <pointLight position={[5, 3, -6]} intensity={15} color="#6ab7ff" distance={15} />
      <pointLight position={[-5, 3, -6]} intensity={15} color="#6ab7ff" distance={15} />
      <FloatingDust />
      <Environment preset="night" />
      <color attach="background" args={['#000000']} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

// Interactive cursor component
function InteractiveCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const trailIdRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      const newTrailPoint = {
        x: e.clientX,
        y: e.clientY,
        id: trailIdRef.current++
      };
      
      setTrail(prev => [...prev, newTrailPoint].slice(-15));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrail(prev => prev.slice(1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div
        className="fixed pointer-events-none z-50 mix-blend-screen"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(180, 200, 220, 0.1) 40%, transparent 70%)',
          transition: 'width 0.2s, height 0.2s',
        }}
      />

      {trail.map((point, index) => {
        const opacity = (index + 1) / trail.length;
        const scale = (index + 1) / trail.length;
        return (
          <div
            key={point.id}
            className="fixed pointer-events-none z-40"
            style={{
              left: point.x,
              top: point.y,
              transform: 'translate(-50%, -50%)',
              width: `${8 * scale}px`,
              height: `${8 * scale}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255, 255, 255, ${0.6 * opacity}) 0%, rgba(180, 200, 220, ${0.3 * opacity}) 50%, transparent 100%)`,
              opacity: opacity * 0.7,
              mixBlendMode: 'screen',
            }}
          />
        );
      })}

      <div
        className="fixed pointer-events-none z-50"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'width 0.15s, height 0.15s, opacity 0.15s',
        }}
      />
    </>
  );
}

export default function ChatPage() {
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');

  const handleSendMessage = (message: string) => {
    // Handle the message here (e.g., send to API, update state, etc.)
    console.log('Message sent:', message);
    setUserPrompt(message);
    setShowWorkflow(true);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden" style={{ cursor: 'none' }}>
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 60 }}
          gl={{ 
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0
          }}
        >
          <Suspense fallback={null}>
            <BackgroundScene />
          </Suspense>
        </Canvas>
      </div>

      {/* Header */}
      <Header showBackButton={showWorkflow} />

      {/* Interactive Cursor */}
      <InteractiveCursor />

      {/* Chat Interface */}
      {!showWorkflow ? (
        <div className="relative z-10 flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)', paddingTop: '64px' }}>
          <ChatBox 
            onSend={handleSendMessage}
            walletAddress="0x32322423..."
          />
        </div>
      ) : (
        <div className="relative z-10 flex flex-col p-4 animate-fade-in" style={{ minHeight: 'calc(100vh - 64px)', paddingTop: '64px' }}>
          {/* Workflow Builder View */}
          <div className="flex-1 flex gap-4">
            <WorkflowBuilder prompt={userPrompt} />
            <TemplateSidebar />
          </div>

          {/* Chatbox at Bottom */}
          <div 
            className="w-full max-w-4xl mx-auto mt-4 animate-slide-up"
            style={{
              animationDelay: '0.3s',
              animationFillMode: 'both',
            }}
          >
            <ChatBox 
              onSend={handleSendMessage}
              walletAddress="0x32322423..."
              compact={true}
            />
          </div>
        </div>
      )}

      {/* Fonts */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.7s ease-out;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
