import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Snowflake, 
  RotateCcw, 
  Terminal, 
  Activity, 
  Gauge, 
  Clock, 
  Sliders, 
  CheckCircle2, 
  Layers,
  HelpCircle,
  Sparkles
} from 'lucide-react';

// ==========================================
// Types & Interfaces
// ==========================================
interface Particle {
  id: string;
  type: 'snowflake' | 'balloon';
  left: number; // percentage (5 to 95)
  size: number; // width in pixels
  speed: number; // velocity modifier
  color: string;
  symbol?: string; // used for snowflakes (❄, ❅, ❆)
  swayAmplitude: number; // px horizontal drift
  swayPeriod: number; // duration of drift wave
  createdAt: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'system';
}

// ==========================================
// Custom Sub-Components
// ==========================================

// Realistic vector balloon with radial lighting reflection, knot, and bezier wavy string
const BalloonSVG = ({ color, size }: { color: string; size: number }) => {
  const gradientId = `balloon-grad-${color.replace('#', '')}-${size}`;
  return (
    <svg 
      width={size} 
      height={size * 1.6} 
      viewBox="0 0 100 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="filter drop-shadow-xl"
      id={`balloon-svg-${size}`}
    >
      <defs>
        <radialGradient id={gradientId} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6"/>
          <stop offset="40%" stopColor={color}/>
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45"/>
        </radialGradient>
      </defs>
      
      {/* Balloon String */}
      <path
        d="M 50 94 C 44 110, 56 125, 50 140 C 44 150, 54 155, 50 160"
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Balloon Knot */}
      <path
        d="M 46 90 L 54 90 L 57 94 L 43 94 Z"
        fill={color}
      />
      
      {/* Balloon Body */}
      <path
        d="M 50 90 C 31 90, 15 72, 15 50 C 15 24, 30 10, 50 10 C 70 10, 85 24, 85 50 C 85 72, 69 90, 50 90 Z"
        fill={`url(#${gradientId})`}
      />
      
      {/* Glare Highlight */}
      <ellipse
        cx="35"
        cy="30"
        rx="9"
        ry="5"
        transform="rotate(-15 35 30)"
        fill="white"
        opacity="0.35"
      />
    </svg>
  );
};

// Icy Snowflake with subtle text glow
const SnowflakeComponent = ({ symbol, size, color }: { symbol: string; size: number; color: string }) => {
  return (
    <div
      style={{
        fontSize: size,
        color: color,
        textShadow: `0 0 10px ${color}, 0 0 2px rgba(255, 255, 255, 0.8)`,
      }}
      className="select-none font-sans leading-none flex items-center justify-center filter drop-shadow-lg"
      id={`snowflake-char-${size}`}
    >
      {symbol}
    </div>
  );
};

// ==========================================
// Main Application Component
// ==========================================
export default function App() {
  // Kinetic State
  const [particles, setParticles] = useState<Particle[]>([]);
  const [activeEffect, setActiveEffect] = useState<'snowflakes' | 'balloons' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Real-time local clock
  const [currentTime, setCurrentTime] = useState<string>('');

  // Simulation logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // DOM References for cleanup & logging
  const logsEndRef = useRef<HTMLDivElement>(null);
  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Formatting timestamp
  const getTimestamp = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // Add Log Entry
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'system' = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: getTimestamp(),
      message,
      type,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  // Update clock
  useEffect(() => {
    setCurrentTime(getTimestamp());
    const clockInterval = setInterval(() => {
      setCurrentTime(getTimestamp());
    }, 1000);

    // Initial logs to establish the sophisticated atmosphere
    addLog('AeroKinetic Simulation Kernel initialized.', 'system');
    addLog('Awaiting controller input trigger...', 'info');

    return () => {
      clearInterval(clockInterval);
    };
  }, [addLog]);

  // Auto-scroll logs terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Unified cleanup function to halt intervals
  const stopActiveSimulation = useCallback(() => {
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Flush particle buffer
  const resetConsole = useCallback(() => {
    stopActiveSimulation();
    setActiveEffect(null);
    setCountdown(null);
    setParticles([]);
    addLog('Console reset. Particle system discharge complete.', 'system');
  }, [stopActiveSimulation, addLog]);

  // Start sequence
  const startEffect = (type: 'snowflakes' | 'balloons') => {
    // Gracefully transition or reset current spawners
    stopActiveSimulation();
    
    setActiveEffect(type);
    setCountdown(5.0);
    
    addLog(`Initiating sequence: ${type === 'snowflakes' ? 'CRYSTALLINE_FALL' : 'KINETIC_BALLOON_RISE'}`, 'system');
    addLog(`Generating responsive medium-scale particulate waves...`, 'info');

    // Spawner function
    const spawnParticle = () => {
      const id = Math.random().toString(36).substring(2, 9);
      // Spawn within horizontal boundaries
      const left = Math.random() * 90 + 5; 
      
      if (type === 'snowflakes') {
        const symbols = ['❄', '❅', '❆'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        // Twice the previous medium size range (40px to 64px)
        const size = Math.random() * 24 + 40; 
        const speedMultiplier = Math.random() * 0.4 + 0.8; // subtle speed deviation (80% to 120% speed)
        const sway = Math.random() * 35 + 15; // horizontal amplitude in pixels
        
        // Crisp luxury whites, icy golds, and champagne sparkles
        const snowflakeColors = [
          '#ffffff', // Pristine White
          '#e2e8f0', // Crisp Slate White
          '#F4E8C1', // Champagne Gold Glow
          '#bae6fd', // Polar Sky Blue
        ];
        const color = snowflakeColors[Math.floor(Math.random() * snowflakeColors.length)];
        
        const newParticle: Particle = {
          id,
          type: 'snowflake',
          left,
          size,
          speed: speedMultiplier,
          color,
          symbol,
          swayAmplitude: sway,
          swayPeriod: Math.random() * 1.5 + 2.5, // sway speed
          createdAt: Date.now(),
        };
        setParticles(prev => [...prev, newParticle]);
      } else {
        // Balloons
        // Doubled size range (72px to 92px width)
        const size = Math.random() * 20 + 72;
        const speedMultiplier = Math.random() * 0.3 + 0.85; // floating speed
        const sway = Math.random() * 45 + 20; // gentle horizontal wobble
        
        // Elegant Sophisticated Dark palette - rich velvet tones that pop beautifully on charcoal
        const sophisticatedColors = [
          '#C5A059', // Rich Luxury Gold
          '#be123c', // Deep Crimson Rose
          '#1d4ed8', // Royal Sapphire
          '#0d9488', // Emerald Teal
          '#6d28d9', // Royal Amethyst
          '#b45309', // Dark Amber
          '#e11d48', // Vibrant Velvet Red
          '#0284c7', // Sky Azure
        ];
        const color = sophisticatedColors[Math.floor(Math.random() * sophisticatedColors.length)];
        
        const newParticle: Particle = {
          id,
          type: 'balloon',
          left,
          size,
          speed: speedMultiplier,
          color,
          swayAmplitude: sway,
          swayPeriod: Math.random() * 2 + 3,
          createdAt: Date.now(),
        };
        setParticles(prev => [...prev, newParticle]);
      }
    };

    // Instant spawn first particle
    spawnParticle();
    
    // Spawn loops
    const intervalTime = type === 'snowflakes' ? 120 : 160;
    const spawnInterval = setInterval(spawnParticle, intervalTime);
    spawnIntervalRef.current = spawnInterval;

    // High-resolution countdown timer (updates every 100ms)
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 0.1) {
          clearInterval(countInterval);
          return 0;
        }
        return Math.round((prev - 0.1) * 10) / 10;
      });
    }, 100);
    countdownIntervalRef.current = countInterval;

    // Auto terminate active spawning phase at exactly 5000ms
    const stopTimeout = setTimeout(() => {
      // Clean up spawner interval (stops creating new particles)
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
        spawnIntervalRef.current = null;
      }
      
      setActiveEffect(null);
      setCountdown(null);
      addLog(`Generation complete. Active stream closed. Buffer discharging...`, 'success');
    }, 5000);
    timeoutRef.current = stopTimeout;
  };

  // Remove individual particle once offscreen animation completes
  const removeParticle = useCallback((id: string) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopActiveSimulation();
    };
  }, [stopActiveSimulation]);

  return (
    <div 
      id="root-container" 
      className="min-h-screen bg-[#0A0A0A] text-[#EAEAEA] flex flex-col justify-between relative overflow-hidden font-sans"
      style={{
        background: 'radial-gradient(circle at center, #1A1A1A 0%, #0A0A0A 100%)'
      }}
    >
      {/* Decorative Frame - Sophisticated Fine Accent Border */}
      <div 
        id="decorative-viewport-frame" 
        className="absolute inset-4 md:inset-6 border border-gold/10 pointer-events-none z-10"
      ></div>

      {/* Elegant Technical Grid Overlay with Low Opacity */}
      <div 
        id="bg-grid-overlay"
        className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-screen"
        style={{
          backgroundImage: `
            linear-gradient(to right, #C5A059 1px, transparent 1px),
            linear-gradient(to bottom, #C5A059 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      ></div>

      {/* ==========================================
          IMMERSIVE ANIMATION CONTAINER (z-40)
          ========================================== */}
      <div id="particle-simulation-stage" className="fixed inset-0 pointer-events-none overflow-hidden z-40">
        <AnimatePresence mode="popLayout">
          {particles.map(particle => {
            if (particle.type === 'snowflake') {
              return (
                <motion.div
                  key={particle.id}
                  id={`particle-${particle.id}`}
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: `${particle.left}%`,
                    top: -50,
                  }}
                  initial={{ y: 0, x: 0, rotate: 0, opacity: 0 }}
                  animate={{
                    y: '108vh',
                    x: [0, particle.swayAmplitude, -particle.swayAmplitude, particle.swayAmplitude, 0],
                    rotate: [0, 60, 120, 180, 240],
                    opacity: [0, 1, 1, 0.9, 0],
                  }}
                  transition={{
                    y: { duration: 5 * particle.speed, ease: 'linear' },
                    x: { duration: particle.swayPeriod, ease: 'easeInOut', repeat: Infinity },
                    rotate: { duration: particle.swayPeriod * 1.5, ease: 'linear', repeat: Infinity },
                    opacity: { duration: 5 * particle.speed, ease: 'linear' },
                  }}
                  onAnimationComplete={() => removeParticle(particle.id)}
                >
                  <SnowflakeComponent 
                    symbol={particle.symbol || '❄'} 
                    size={particle.size} 
                    color={particle.color} 
                  />
                </motion.div>
              );
            } else {
              return (
                <motion.div
                  key={particle.id}
                  id={`particle-${particle.id}`}
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: `${particle.left}%`,
                    top: '105vh',
                  }}
                  initial={{ y: 0, x: 0, rotate: -5, opacity: 0 }}
                  animate={{
                    y: '-122vh', // Float entirely off top
                    x: [0, particle.swayAmplitude, -particle.swayAmplitude, particle.swayAmplitude, 0],
                    rotate: [-12, 12, -12, 12, -5],
                    opacity: [0, 1, 1, 1, 0],
                  }}
                  transition={{
                    y: { duration: 5.2 * particle.speed, ease: 'linear' },
                    x: { duration: particle.swayPeriod, ease: 'easeInOut', repeat: Infinity },
                    rotate: { duration: particle.swayPeriod * 0.9, ease: 'easeInOut', repeat: Infinity, repeatType: "reverse" },
                    opacity: { duration: 5.2 * particle.speed, ease: 'linear' },
                  }}
                  onAnimationComplete={() => removeParticle(particle.id)}
                >
                  <BalloonSVG color={particle.color} size={particle.size} />
                </motion.div>
              );
            }
          })}
        </AnimatePresence>
      </div>

      {/* ==========================================
          HEADER PANEL (z-50)
          ========================================== */}
      <header 
        id="app-header-bar" 
        className="w-full bg-black/40 backdrop-blur-md border-b border-zinc-800/80 px-8 py-5 flex items-center justify-between relative z-50"
      >
        <div id="header-branding" className="flex items-center space-x-4">
          <div id="header-icon-box" className="p-2 bg-zinc-900 border border-gold/20 rounded text-gold flex items-center justify-center shadow-[0_0_15px_rgba(197,160,89,0.15)]">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 id="header-main-title" className="font-serif font-medium tracking-wide text-gold text-lg md:text-xl leading-none">
              Atmospheric Controller
            </h1>
            <p id="header-subtitle" className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.25em] mt-1.5">
              Kinetic Parameter Monitor • Sophisticated Core
            </p>
          </div>
        </div>

        <div id="header-clock-panel" className="flex items-center space-x-2.5 text-zinc-300 font-mono text-xs bg-zinc-900/80 border border-zinc-800 px-3.5 py-1.5 rounded-md shadow-lg">
          <Clock className="w-3.5 h-3.5 text-gold" />
          <span id="live-time-display">{currentTime || '00:00:00'}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-gold font-medium uppercase animate-pulse">● active</span>
        </div>
      </header>

      {/* ==========================================
          MAIN EXECUTIVE DASHBOARD (z-50)
          ========================================== */}
      <main id="main-interactive-grid" className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 md:py-16 flex flex-col justify-center items-center relative z-50">
        
        {/* Central Controller Box */}
        <div 
          id="central-controller-card" 
          className="w-full bg-[#121212]/90 border border-zinc-800/90 rounded-xl shadow-[0_30px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col divide-y divide-zinc-800/60"
        >
          {/* Section A: Controller Top-Bar */}
          <div id="card-control-header" className="px-6 py-5 bg-[#161616]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 id="control-panel-heading" className="font-serif text-lg font-medium text-gold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-gold/80" />
                Environmental Controllers
              </h2>
              <p id="control-panel-sub" className="text-xs text-zinc-400 mt-1">
                Calibrate atmospheric density vectors to deploy custom particulate fields within the viewport.
              </p>
            </div>
            
            {/* Status indicators */}
            <div id="status-badge-container" className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium font-mono uppercase tracking-wider">System State:</span>
              <div 
                id="active-status-badge"
                className={`px-3 py-1 rounded-sm text-xs font-mono font-medium flex items-center gap-1.5 border transition-all duration-300 ${
                  activeEffect === 'snowflakes' 
                    ? 'bg-sky-950/40 text-sky-400 border-sky-800/80 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
                    : activeEffect === 'balloons'
                    ? 'bg-gold/10 text-gold border-gold/30 shadow-[0_0_15px_rgba(197,160,89,0.15)]'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  activeEffect === 'snowflakes' 
                    ? 'bg-sky-400 animate-ping' 
                    : activeEffect === 'balloons'
                    ? 'bg-gold animate-ping'
                    : 'bg-zinc-600'
                }`} />
                {activeEffect === 'snowflakes' ? 'CRYSTALLINE_FALL' : activeEffect === 'balloons' ? 'BALLOON_RISE' : 'STANDBY'}
              </div>
            </div>
          </div>

          {/* Section B: Simulation Progress Bar (Only visible during active timers) */}
          <div id="progress-bar-container" className="h-[2px] bg-zinc-900 relative overflow-hidden">
            <AnimatePresence>
              {countdown !== null && (
                <motion.div 
                  id="active-progress-bar"
                  className={`h-full absolute left-0 top-0 transition-colors duration-300 ${
                    activeEffect === 'snowflakes' ? 'bg-sky-500' : 'bg-gold'
                  }`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(countdown / 5.0) * 100}%` }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'linear', duration: 0.1 }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Section C: Master Command Buttons */}
          <div id="action-buttons-rack" className="px-6 py-8 md:py-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Snowflakes Button */}
            <button
              id="trigger-snowflakes-btn"
              onClick={() => startEffect('snowflakes')}
              disabled={activeEffect === 'snowflakes'}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border transition-all duration-300 group select-none relative ${
                activeEffect === 'snowflakes'
                  ? 'bg-sky-950/20 border-sky-800 text-sky-400 shadow-inner'
                  : 'bg-transparent border-gold text-gold hover:bg-gold hover:text-[#0A0A0A] hover:shadow-[0_0_20px_rgba(197,160,89,0.25)] cursor-pointer'
              }`}
            >
              <div 
                className={`p-3 rounded-full mb-3.5 transition-colors duration-300 ${
                  activeEffect === 'snowflakes' 
                    ? 'bg-sky-500 text-black' 
                    : 'bg-zinc-900 border border-zinc-800 text-gold group-hover:bg-transparent group-hover:border-transparent group-hover:text-current'
                }`}
              >
                <Snowflake className="w-6 h-6 animate-spin-slow" />
              </div>
              <span className="font-serif font-medium italic text-lg tracking-wide">
                Snowflakes
              </span>
              <span className="text-[10px] font-mono text-zinc-500 group-hover:text-current mt-1 uppercase tracking-widest">
                Deploy Crystal
              </span>
              
              {activeEffect === 'snowflakes' && (
                <div className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </div>
              )}
            </button>

            {/* Balloons Button */}
            <button
              id="trigger-balloons-btn"
              onClick={() => startEffect('balloons')}
              disabled={activeEffect === 'balloons'}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border transition-all duration-300 group select-none relative ${
                activeEffect === 'balloons'
                  ? 'bg-gold/10 border-gold text-gold shadow-inner'
                  : 'bg-transparent border-gold text-gold hover:bg-gold hover:text-[#0A0A0A] hover:shadow-[0_0_20px_rgba(197,160,89,0.25)] cursor-pointer'
              }`}
            >
              <div 
                className={`p-3 rounded-full mb-3.5 transition-colors duration-300 ${
                  activeEffect === 'balloons' 
                    ? 'bg-gold text-black shadow-inner' 
                    : 'bg-zinc-900 border border-zinc-800 text-gold group-hover:bg-transparent group-hover:border-transparent group-hover:text-current'
                }`}
              >
                <BalloonSVG color="currentColor" size={24} />
              </div>
              <span className="font-serif font-medium italic text-lg tracking-wide">
                Balloons
              </span>
              <span className="text-[10px] font-mono text-zinc-500 group-hover:text-current mt-1 uppercase tracking-widest">
                Deploy Float
              </span>

              {activeEffect === 'balloons' && (
                <div className="absolute top-3 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold/50 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
                </div>
              )}
            </button>

            {/* Clear/Reset Control */}
            <button
              id="abort-simulation-btn"
              onClick={resetConsole}
              disabled={particles.length === 0 && activeEffect === null}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border transition-all duration-300 group select-none ${
                particles.length === 0 && activeEffect === null
                  ? 'bg-zinc-950/40 border-zinc-900 text-zinc-700 shadow-none cursor-not-allowed'
                  : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-gold hover:text-gold hover:bg-zinc-900/40 active:bg-zinc-900 cursor-pointer'
              }`}
            >
              <div 
                className={`p-3 rounded-full mb-3.5 transition-colors duration-300 ${
                  particles.length === 0 && activeEffect === null
                    ? 'bg-transparent text-zinc-800'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:bg-zinc-800 group-hover:text-gold'
                }`}
              >
                <RotateCcw className={`w-6 h-6 ${particles.length > 0 ? 'group-hover:rotate-[-45deg] transition-transform' : ''}`} />
              </div>
              <span className="font-serif font-medium text-base tracking-wide">
                Reset Stage
              </span>
              <span className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-widest">
                Clear Viewport
              </span>
            </button>

          </div>

          {/* Section D: Simulation Real-time Diagnostics HUD */}
          <div id="diagnostics-hud-panel" className="px-6 py-6 bg-[#161616]/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center divide-x-0 sm:divide-x divide-zinc-800/80">
            <div id="hud-metric-countdown" className="flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-gold/60" /> Active Clock
              </span>
              <span className="font-serif text-xl md:text-2xl text-gold">
                {countdown !== null ? `${countdown.toFixed(1)}s` : '0.0s'}
              </span>
            </div>
            
            <div id="hud-metric-count" className="flex flex-col items-center justify-center pt-2 sm:pt-0">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-gold/60" /> Active Particles
              </span>
              <span className="font-serif text-xl md:text-2xl text-zinc-100">
                {particles.length}
              </span>
            </div>

            <div id="hud-metric-load" className="flex flex-col items-center justify-center pt-2 sm:pt-0">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Gauge className="w-3.5 h-3.5 text-gold/60" /> Engine Core
              </span>
              <span className="font-serif text-xs md:text-sm text-gold bg-gold/10 px-2.5 py-1 rounded border border-gold/20 flex items-center gap-1.5 justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" /> HTML5-WebGL
              </span>
            </div>

            <div id="hud-metric-efficiency" className="flex flex-col items-center justify-center pt-2 sm:pt-0">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-gold/60" /> Thread Rate
              </span>
              <span className="font-serif text-xl md:text-2xl text-zinc-100">
                60.0 <span className="text-xs font-mono text-zinc-500 font-normal">FPS</span>
              </span>
            </div>
          </div>

          {/* Section E: Live Simulation Audit Log Terminal */}
          <div id="audit-log-terminal" className="p-6 bg-black/60 relative">
            <div className="flex items-center justify-between mb-3 text-zinc-500">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-gold/80" />
                <span className="text-xxs font-mono uppercase tracking-widest text-zinc-400">Simulation Log Output</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">STREAM_ON</span>
              </div>
            </div>
            
            <div 
              id="terminal-output-viewport"
              className="font-mono text-xs text-zinc-300 h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar bg-black/50 p-4 rounded border border-zinc-800/80 shadow-inner"
            >
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="text-zinc-600 select-none">[{log.timestamp}]</span>
                  <span className={`flex-1 ${
                    log.type === 'system' 
                      ? 'text-gold font-medium' 
                      : log.type === 'success' 
                      ? 'text-emerald-400' 
                      : 'text-zinc-400'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Informational notice below card */}
        <div id="console-brief-notice" className="mt-5 flex items-center gap-2 text-zinc-500 hover:text-zinc-400 transition-colors text-xs select-none font-mono">
          <HelpCircle className="w-4 h-4 text-gold/50" />
          <span>Each particle is managed on its own rendering thread with custom sway and rotation dynamics.</span>
        </div>

      </main>

      {/* ==========================================
          FOOTER COPYRIGHT & TELEMETRY RAIL (z-50)
          ========================================== */}
      <footer 
        id="app-footer-rail" 
        className="w-full bg-black/40 border-t border-zinc-800/80 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-zinc-500 uppercase tracking-wider relative z-50"
      >
        <span id="footer-copyright-text" className="hover:text-gold transition-colors duration-300">
          © 2026 AeroKinetics Enterprise Solutions. All rights reserved.
        </span>
        <div id="footer-diagnostics-meta" className="flex items-center gap-4">
          <span>HOST: PORT_3000</span>
          <span>•</span>
          <span>LATENCY: 0.12ms</span>
          <span>•</span>
          <span>BUFFER: FLUSHABLE</span>
        </div>
      </footer>
    </div>
  );
}
