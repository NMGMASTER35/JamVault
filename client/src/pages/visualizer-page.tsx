import { useState, useEffect } from "react";
import { useAudio } from "@/lib/audioContext";
import { AudioVisualizer } from "@/components/music/audio-visualizer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Repeat, Shuffle, X
} from "lucide-react";
import { useLocation } from "wouter";

export default function VisualizerPage() {
  const [, setLocation] = useLocation();
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffle,
    isRepeat,
    togglePlayPause,
    nextSong,
    prevSong,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = useAudio();
  
  const [showControls, setShowControls] = useState(true);
  const [visualizerType, setVisualizerType] = useState<'spectrum' | 'waveform' | 'particles'>('spectrum');
  const [colorTheme, setColorTheme] = useState<'red' | 'blue' | 'green' | 'rainbow'>('red');
  
  // Auto-hide controls after period of inactivity
  useEffect(() => {
    let timeout: number;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      
      timeout = window.setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove(); // Initial trigger
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);
  
  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle seeking
  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };
  
  // Get visualizer bar color based on theme
  const getVisualizerColor = () => {
    switch (colorTheme) {
      case 'red': return 'rgb(255, 0, 64)';
      case 'blue': return 'rgb(0, 132, 255)';
      case 'green': return 'rgb(0, 200, 83)';
      case 'rainbow': return 'rgb(255, 0, 64)'; // Rainbow handled in component
      default: return 'rgb(255, 0, 64)';
    }
  };
  
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background/80 z-0" />
      
      {/* Main visualizer */}
      <div className="absolute inset-0 z-10">
        <AudioVisualizer 
          barCount={128} 
          barColor={getVisualizerColor()}
          barSpacing={2} 
          barRadius={3}
        />
      </div>
      
      {/* Song info and controls */}
      <div 
        className={`absolute inset-x-0 bottom-0 p-6 transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Close button */}
        <Button 
          className="absolute top-4 right-4 rounded-full" 
          size="icon" 
          variant="secondary"
          onClick={() => setLocation('/')}
        >
          <X className="h-6 w-6" />
        </Button>
        
        {/* Song info */}
        {currentSong && (
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{currentSong.title}</h1>
            <p className="text-xl text-white/80">{currentSong.artist}</p>
          </div>
        )}
        
        {/* Progress bar */}
        <div className="w-full max-w-3xl mx-auto mb-4 flex items-center gap-2">
          <span className="text-sm text-white/80 w-12 text-right">
            {formatTime(progress)}
          </span>
          <Slider
            value={[progress]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            disabled={!currentSong}
            className="cursor-pointer"
          />
          <span className="text-sm text-white/80 w-12">
            {formatTime(duration || 0)}
          </span>
        </div>
        
        {/* Playback controls */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className={isShuffle ? "text-primary" : "text-white/70 hover:text-white"}
            onClick={toggleShuffle}
            disabled={!currentSong}
          >
            <Shuffle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white"
            onClick={prevSong}
            disabled={!currentSong}
          >
            <SkipBack className="h-8 w-8" />
          </Button>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-white text-black hover:scale-105 transition-transform"
            onClick={togglePlayPause}
            disabled={!currentSong}
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white"
            onClick={nextSong}
            disabled={!currentSong}
          >
            <SkipForward className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={isRepeat ? "text-primary" : "text-white/70 hover:text-white"}
            onClick={toggleRepeat}
            disabled={!currentSong}
          >
            <Repeat className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Volume */}
        <div className="w-full max-w-xs mx-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white"
            onClick={() => volume > 0 ? setVolume(0) : setVolume(0.5)}
          >
            {volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
          />
          <span className="text-sm text-white/80 w-9 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>
        
        {/* Visualizer options */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="flex rounded-full bg-black/50 backdrop-blur-sm p-1">
            <Button 
              variant={colorTheme === 'red' ? 'default' : 'ghost'} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setColorTheme('red')}
            >
              Red
            </Button>
            <Button 
              variant={colorTheme === 'blue' ? 'default' : 'ghost'} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setColorTheme('blue')}
            >
              Blue
            </Button>
            <Button 
              variant={colorTheme === 'green' ? 'default' : 'ghost'} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setColorTheme('green')}
            >
              Green
            </Button>
            <Button 
              variant={colorTheme === 'rainbow' ? 'default' : 'ghost'} 
              size="sm" 
              className="text-xs rounded-full"
              onClick={() => setColorTheme('rainbow')}
            >
              Rainbow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}