"use client";

import { useSimulatorStore } from '@/stores/useSimulatorStore';
import { Cpu, Zap, Waves } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SimulatorStatus() {
  const activeSimulators = useSimulatorStore(state => state.activeSimulators);
  const activeCount = activeSimulators.size;
  const [iconIndex, setIconIndex] = useState(0);
  
  // Rotate through different icons
  useEffect(() => {
    if (activeCount > 0) {
      const interval = setInterval(() => {
        setIconIndex((prev) => (prev + 1) % 3);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeCount]);

  if (activeCount === 0) return null;

  const icons = [
    <Cpu key="cpu" size={16} className="animate-pulse" />,
    <Zap key="zap" size={16} className="animate-bounce" />,
    <Waves key="waves" size={16} className="animate-pulse" />
  ];
  
  return (
    <div className="relative flex items-center gap-2 text-sm px-3 py-1.5 rounded-full 
                    bg-indigo-950 dark:bg-indigo-900 text-indigo-200 dark:text-indigo-100
                    border border-indigo-500/30 shadow-lg shadow-indigo-500/20
                    transition-all duration-500 hover:bg-indigo-900 dark:hover:bg-indigo-800">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse" />
      <div className="relative flex items-center gap-2">
        {icons[iconIndex]}
        <span className="font-medium tracking-wide">
          {activeCount} simulation{activeCount !== 1 ? 's' : ''} running
        </span>
      </div>
    </div>
  );
}