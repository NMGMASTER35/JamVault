import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Heart,
  Download,
  ListMusic,
  Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/lib/audioContext";
import { Waveform } from "@/components/music/waveform";

export function AudioPlayer() {
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

  // Convert seconds to mm:ss format
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

  // Download current song
  const handleDownload = () => {
    if (!currentSong) return;
    
    const link = document.createElement('a');
    link.href = `/api/songs/${currentSong.id}/stream`;
    link.download = `${currentSong.title} - ${currentSong.artist}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed bottom-0 w-full bg-card border-t border-border p-3 z-20">
      <div className="flex flex-col">
        {/* Player controls and info */}
        <div className="flex items-center gap-3">
          {/* Song info */}
          <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
            {currentSong ? (
              <>
                <div className="w-14 h-14 rounded-md bg-accent flex items-center justify-center">
                  {currentSong.cover ? (
                    <img
                      src={currentSong.cover}
                      alt={`${currentSong.title} cover`}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-medium truncate">{currentSong.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{currentSong.artist}</div>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto text-muted-foreground hover:text-foreground">
                  <Heart className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                No song playing
              </div>
            )}
          </div>
          
          {/* Player controls */}
          <div className="flex-1 flex flex-col items-center">
            {/* Control buttons */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className={isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                onClick={toggleShuffle}
                disabled={!currentSong}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={prevSong}
                disabled={!currentSong}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="w-10 h-10 rounded-full bg-white text-black hover:scale-105 transition-transform disabled:opacity-50"
                onClick={togglePlayPause}
                disabled={!currentSong}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={nextSong}
                disabled={!currentSong}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={isRepeat ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                onClick={toggleRepeat}
                disabled={!currentSong}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Progress bar */}
            <div className="w-full flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(progress)}
              </span>
              <div className="flex-grow relative">
                {currentSong && (
                  <>
                    <Waveform isActive={isPlaying} className="mb-1" />
                    <Slider
                      value={[progress]}
                      max={duration || 100}
                      step={1}
                      onValueChange={handleSeek}
                      disabled={!currentSong}
                      className="cursor-pointer"
                    />
                  </>
                )}
              </div>
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(duration || 0)}
              </span>
            </div>
          </div>
          
          {/* Volume and extra controls */}
          <div className="w-1/4 min-w-[140px] flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
            >
              <ListMusic className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleDownload}
              disabled={!currentSong}
            >
              <Download className="h-5 w-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 w-24">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
