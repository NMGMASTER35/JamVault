import { useEffect, useState } from "react";

interface WaveformProps {
  isActive?: boolean;
  className?: string;
}

export function Waveform({ isActive = false, className = "" }: WaveformProps) {
  const [bars, setBars] = useState<number[]>([]);
  
  // Generate random heights for waveform bars
  useEffect(() => {
    const barCount = 50;
    const heights = Array.from({ length: barCount }, () => Math.floor(Math.random() * 24) + 6);
    setBars(heights);
  }, []);
  
  return (
    <div className={`flex items-end h-8 gap-[2px] ${className}`}>
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-[1px] ${isActive ? 'bg-primary/50' : 'bg-accent-foreground/30'}`}
          style={{ 
            height: `${height}px`,
            transition: 'height 0.2s ease-in-out'
          }}
        ></div>
      ))}
    </div>
  );
}
