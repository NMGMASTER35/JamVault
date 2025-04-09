import { useRef, useEffect, useState } from "react";
import { useAudio } from "@/lib/audioContext";

interface AudioVisualizerProps {
  className?: string;
  barCount?: number;
  barColor?: string;
  barSpacing?: number;
  barRadius?: number;
}

export function AudioVisualizer({
  className = "",
  barCount = 64,
  barColor = "rgb(255, 0, 64)",
  barSpacing = 2,
  barRadius = 2,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { howlInstance, isPlaying } = useAudio();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Set up Web Audio API context and analyzer
  useEffect(() => {
    if (!howlInstance) return;

    // Create Audio Context if it doesn't exist
    if (!audioContext) {
      const newAudioContext = new AudioContext();
      setAudioContext(newAudioContext);

      // Create analyzer node
      const newAnalyser = newAudioContext.createAnalyser();
      newAnalyser.fftSize = barCount * 2; // Must be a power of 2
      const bufferLength = newAnalyser.frequencyBinCount;
      const newDataArray = new Uint8Array(bufferLength);
      
      setAnalyser(newAnalyser);
      setDataArray(newDataArray);

      // Connect Howler to our analyzer
      // This is a bit hacky but necessary since Howler doesn't expose the AudioNode directly
      // We need to get the audio element that Howler creates
      const sound = (howlInstance as any)._sounds[0];
      if (sound && sound._node) {
        const source = newAudioContext.createMediaElementSource(sound._node);
        source.connect(newAnalyser);
        newAnalyser.connect(newAudioContext.destination);
      }
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [howlInstance, audioContext, barCount]);

  // Draw visualization based on audio data
  useEffect(() => {
    if (!analyser || !dataArray || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Make sure canvas is sized correctly
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Animation function
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // If not playing, draw a flat line
      if (!isPlaying) {
        ctx.fillStyle = barColor;
        const barHeight = 2;
        ctx.fillRect(0, (canvas.height - barHeight) / 2, canvas.width, barHeight);
        return;
      }

      // Draw frequency bars
      const barWidth = (canvas.width - (barCount - 1) * barSpacing) / barCount;
      
      for (let i = 0; i < barCount; i++) {
        // Use a logarithmic scale to emphasize lower frequencies
        const barIndex = Math.floor(i * dataArray.length / barCount);
        let barHeight = (dataArray[barIndex] / 255) * canvas.height * 0.8;
        
        // Apply some smoothing for aesthetics
        barHeight = Math.max(barHeight, 4); // Minimum bar height
        
        // Get position
        const x = i * (barWidth + barSpacing);
        const y = (canvas.height - barHeight) / 2;

        // Draw rounded bars
        ctx.fillStyle = barColor;
        if (barRadius > 0 && barHeight > barRadius * 2) {
          ctx.beginPath();
          ctx.moveTo(x + barRadius, y);
          ctx.lineTo(x + barWidth - barRadius, y);
          ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + barRadius);
          ctx.lineTo(x + barWidth, y + barHeight - barRadius);
          ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - barRadius, y + barHeight);
          ctx.lineTo(x + barRadius, y + barHeight);
          ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - barRadius);
          ctx.lineTo(x, y + barRadius);
          ctx.quadraticCurveTo(x, y, x + barRadius, y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Regular rectangle for small heights or no radius
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [analyser, dataArray, isPlaying, barCount, barColor, barSpacing, barRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`audio-visualizer w-full h-full ${className}`}
    />
  );
}