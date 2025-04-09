
import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle,
  Volume2, VolumeX, Heart, Download, ListMusic, Mic,
  FileText, Maximize2, Minimize2, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/lib/audioContext";
import { Waveform } from "@/components/music/waveform";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { io } from "socket.io-client";

export function AudioPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [deviceId] = useState(() => crypto.randomUUID());
  const { toast } = useToast();
  
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isShuffle,
    isRepeat,
    queue,
    togglePlayPause,
    nextSong,
    prevSong,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = useAudio();

  // Socket connection for multi-device control
  useEffect(() => {
    const socket = io(window.location.origin);
    
    socket.on('connect', () => {
      socket.emit('register-device', deviceId);
    });

    socket.on('player-command', (command) => {
      if (command.sourceDevice !== deviceId) {
        switch (command.action) {
          case 'play': togglePlayPause(); break;
          case 'next': nextSong(); break;
          case 'prev': prevSong(); break;
          case 'seek': seekTo(command.value); break;
          case 'volume': setVolume(command.value); break;
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [deviceId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    seekTo(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const handleDownload = () => {
    if (!currentSong) return;
    
    const link = document.createElement('a');
    link.href = `/api/songs/${currentSong.id}/stream`;
    link.download = `${currentSong.title} - ${currentSong.artist}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareDevice = () => {
    navigator.clipboard.writeText(`${window.location.origin}/remote/${deviceId}`);
    toast({
      title: "Device Link Copied",
      description: "Share this link to control music from another device",
    });
  };

  return (
    <>
      <div className="fixed bottom-0 w-full bg-card border-t border-border p-3 z-20">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setExpanded(true)}
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
              
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
                      <ListMusic className="h-6 w-6" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-medium truncate">{currentSong.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{currentSong.artist}</div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No song playing</div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col items-center">
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
                  className="w-10 h-10 rounded-full bg-white text-black hover:scale-105 transition-transform"
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
            
            <div className="w-1/4 min-w-[140px] flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowLyrics(true)}
                disabled={!currentSong}
              >
                <FileText className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowQueue(true)}
              >
                <ListMusic className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleShareDevice}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded View Dialog */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-3xl">
          <div className="flex flex-col items-center p-6 space-y-6">
            <div className="w-64 h-64 rounded-lg overflow-hidden">
              {currentSong?.cover ? (
                <img
                  src={currentSong.cover}
                  alt={`${currentSong.title} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent flex items-center justify-center">
                  <ListMusic className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold">{currentSong?.title}</h2>
              <p className="text-muted-foreground">{currentSong?.artist}</p>
            </div>
            
            {/* Player controls from mini player */}
            <div className="w-full max-w-md">
              {/* ... same controls as mini player ... */}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lyrics Sheet */}
      <Sheet open={showLyrics} onOpenChange={setShowLyrics}>
        <SheetContent>
          <ScrollArea className="h-[80vh]">
            <div className="space-y-4 p-6">
              <h3 className="text-lg font-medium">Lyrics</h3>
              <div className="whitespace-pre-line">
                {currentSong?.lyrics || "No lyrics available"}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Queue Sheet */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent>
          <ScrollArea className="h-[80vh]">
            <div className="space-y-4 p-6">
              <h3 className="text-lg font-medium">Queue</h3>
              <div className="space-y-2">
                {queue.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                  >
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      {song.cover ? (
                        <img
                          src={song.cover}
                          alt={song.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <ListMusic className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{song.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {song.artist}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
