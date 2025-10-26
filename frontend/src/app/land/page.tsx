'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Sphere, MeshTransmissionMaterial } from '@react-three/drei';
import { Suspense, useRef, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

// Crystal/Rock formation component
function Rock({ position, rotation, scale = 1, isAnimating, direction }: { 
  position: [number, number, number], 
  rotation: [number, number, number], 
  scale?: number,
  isAnimating?: boolean,
  direction?: 'left' | 'right'
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (isAnimating && groupRef.current) {
      const speed = 0.15;
      if (direction === 'left') {
        groupRef.current.position.x -= speed;
      } else if (direction === 'right') {
        groupRef.current.position.x += speed;
      }
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Main crystal structure */}
      <mesh castShadow>
        <coneGeometry args={[1.5, 4, 6]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.7}
          emissive="#0a0a0a"
        />
      </mesh>
      
      {/* Additional crystal shards */}
      <mesh position={[-0.8, -0.5, 0.5]} rotation={[0, 0, -0.3]} castShadow>
        <coneGeometry args={[0.8, 2.5, 6]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.4}
          metalness={0.6}
          emissive="#050505"
        />
      </mesh>
      
      <mesh position={[0.7, -0.3, -0.4]} rotation={[0, 0, 0.2]} castShadow>
        <coneGeometry args={[0.6, 2, 6]} />
        <meshStandardMaterial
          color="#252525"
          roughness={0.35}
          metalness={0.65}
          emissive="#0a0a0a"
        />
      </mesh>

      <mesh position={[0.3, -1, 0.8]} rotation={[0, 0.5, -0.15]} castShadow>
        <coneGeometry args={[0.5, 1.8, 6]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.7}
          emissive="#0a0a0a"
        />
      </mesh>
    </group>
  );
}

// Central glass/metallic sphere
function CenterSphere({ isAnimating, animationFrame }: { isAnimating?: boolean, animationFrame?: number }) {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (isAnimating && sphereRef.current && animationFrame && animationFrame > 60) {
      // Ball starts dropping after 1 second (60 frames at 60fps)
      sphereRef.current.position.y -= 0.12;
    }
  });
  
  return (
    <Sphere ref={sphereRef} args={[1.6, 64, 64]} castShadow>
      <MeshTransmissionMaterial
        backside
        samples={16}
        resolution={256}
        transmission={0.95}
        roughness={0.15}
        thickness={1.5}
        ior={1.5}
        chromaticAberration={0.06}
        anisotropy={0.3}
        distortion={0.2}
        distortionScale={0.5}
        temporalDistortion={0.1}
        clearcoat={1}
        attenuationDistance={0.5}
        attenuationColor="#ffffff"
        color="#ffffff"
      />
    </Sphere>
  );
}

// Floating dust particles component
function FloatingDust({ isAnimating, animationFrame }: { isAnimating?: boolean, animationFrame?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 1500;
  
  // Generate random particle positions
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Spread particles in a large volume around the scene
      positions[i3] = (Math.random() - 0.5) * 30; // x
      positions[i3 + 1] = (Math.random() - 0.5) * 20; // y
      positions[i3 + 2] = (Math.random() - 0.5) * 25; // z
      
      // Random slow velocities for floating effect
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.015;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions, velocities };
  }, []);
  
  // Animate particles
  useFrame((state) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.getElapsedTime();
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // If animating and after frame 60, particles move upward
      if (isAnimating && animationFrame && animationFrame > 60) {
        positions[i3 + 1] += 0.15; // Move up
      } else {
        // Normal slow drift movement
        positions[i3] += particles.velocities[i3];
        positions[i3 + 1] += particles.velocities[i3 + 1];
        positions[i3 + 2] += particles.velocities[i3 + 2];
        
        // Add subtle wave motion
        positions[i3 + 1] += Math.sin(time + i * 0.1) * 0.002;
      }
      
      // Wrap particles around when they go too far
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
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Camera controller component
function CameraController({ isAnimating, animationFrame }: { isAnimating?: boolean, animationFrame?: number }) {
  useFrame(({ camera }) => {
    if (isAnimating && animationFrame && animationFrame > 60) {
      // Camera follows the ball down after 1 second
      camera.position.y -= 0.12;
    }
  });
  
  return null;
}

// Scene component with all 3D elements
function Scene({ isAnimating, animationFrame }: { isAnimating?: boolean, animationFrame?: number }) {
  return (
    <>
      {/* Camera controller */}
      <CameraController isAnimating={isAnimating} animationFrame={animationFrame} />
      
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.1} />
      
      {/* Back rim light - creates the glowing edge effect */}
      <pointLight position={[0, 0, -8]} intensity={50} color="#4a9fff" distance={20} />
      
      {/* Additional back lights for atmosphere */}
      <pointLight position={[5, 3, -6]} intensity={20} color="#6ab7ff" distance={15} />
      <pointLight position={[-5, 3, -6]} intensity={20} color="#6ab7ff" distance={15} />
      
      {/* Subtle front fill light */}
      <pointLight position={[0, 5, 5]} intensity={5} color="#ffffff" />
      
      {/* Directional light for shadows */}
      <directionalLight
        position={[3, 10, 5]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Central sphere */}
      <CenterSphere isAnimating={isAnimating} animationFrame={animationFrame} />

      {/* Left rock formation */}
      <Rock 
        position={[-7, 0, 2]} 
        rotation={[0, 0.3, 0]}
        scale={3.8}
        isAnimating={isAnimating}
        direction="left"
      />

      {/* Right rock formation */}
      <Rock 
        position={[7, 0, 2]} 
        rotation={[0, -0.3, 0]}
        scale={3.8}
        isAnimating={isAnimating}
        direction="right"
      />

      {/* Floating dust particles */}
      <FloatingDust isAnimating={isAnimating} animationFrame={animationFrame} />

      {/* Environment for reflections */}
      <Environment preset="night" />
      
      {/* Black background */}
      <color attach="background" args={['#000000']} />
      
      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
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
      
      // Add to trail
      const newTrailPoint = {
        x: e.clientX,
        y: e.clientY,
        id: trailIdRef.current++
      };
      
      setTrail(prev => [...prev, newTrailPoint].slice(-15)); // Keep last 15 points
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Clean up old trail points
  useEffect(() => {
    const interval = setInterval(() => {
      setTrail(prev => prev.slice(1));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Custom cursor glow */}
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

      {/* Cursor trail particles */}
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

      {/* Outer cursor ring */}
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

// Animation frame tracker component
function AnimationFrameTracker({ isAnimating, onFrameUpdate }: { isAnimating: boolean, onFrameUpdate: (frame: number) => void }) {
  const frameRef = useRef(0);
  
  useFrame(() => {
    if (isAnimating) {
      frameRef.current += 1;
      onFrameUpdate(frameRef.current);
    }
  });
  
  return null;
}

// Main page component
export default function LandingPage() {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);

  const handleStartClick = () => {
    setIsAnimating(true);
    // Navigate after 2 seconds to allow for full animation
    setTimeout(() => {
      router.push('/prompt');
    }, 2000);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" style={{ cursor: 'none' }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 1, 10], fov: 60 }}
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        <Suspense fallback={null}>
          <AnimationFrameTracker isAnimating={isAnimating} onFrameUpdate={setAnimationFrame} />
          <Scene isAnimating={isAnimating} animationFrame={animationFrame} />
        </Suspense>
      </Canvas>

      {/* Futuristic Title */}
      <div 
        className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isAnimating ? 0 : 1
        }}
      >
        <h1 
          className="text-5xl font-bold tracking-[0.3em] text-center mb-4"
          style={{
            fontFamily: "'Orbitron', 'Exo 2', sans-serif",
            background: 'linear-gradient(to bottom, #ffffff 0%, #e0e8f0 30%, #9fb5cc 70%, #6b8ba8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 20px rgba(140, 180, 220, 0.2))',
            animation: 'subtleShimmer 3s ease-in-out infinite alternate'
          }}
        >
          LinkedOut
        </h1>
        <p 
          className="text-lg text-center tracking-wide"
          style={{
            fontFamily: "'Inter', 'system-ui', sans-serif",
            color: '#c0d0e0',
            fontWeight: '300',
            letterSpacing: '0.05em',
            textShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
          }}
        >
          Make your work come true
        </p>
      </div>

      {/* Start Button */}
      <div 
        className="absolute bottom-[18%] left-1/2 -translate-x-1/2 pointer-events-auto transition-opacity duration-500"
        style={{
          opacity: isAnimating ? 0 : 1,
          pointerEvents: isAnimating ? 'none' : 'auto'
        }}
      >
        <button
          onClick={handleStartClick}
          className="px-10 py-4 text-lg font-semibold tracking-widest uppercase transition-all duration-300"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            borderRadius: '2px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)',
            cursor: 'pointer',
            letterSpacing: '0.2em'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1), inset 0 0 20px rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          Start
        </button>
      </div>

      {/* Interactive Cursor Effects */}
      <InteractiveCursor />

      {/* Add keyframes for subtle shimmer animation */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');
        
        @keyframes subtleShimmer {
          from {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 20px rgba(140, 180, 220, 0.2));
          }
          to {
            filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.5)) drop-shadow(0 0 30px rgba(140, 180, 220, 0.35)) drop-shadow(0 0 40px rgba(100, 150, 200, 0.15));
          }
        }
      `}</style>

    </div>
  );
}

