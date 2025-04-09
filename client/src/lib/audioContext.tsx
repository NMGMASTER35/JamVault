import { Song } from "@shared/schema";
import { createContext, ReactNode, useContext, useEffect, useState, useRef } from "react";
import { Howl } from "howler";

type AudioContextType = {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  queue: Song[];
  howlInstance: Howl | null;
  playSong: (song: Song) => void;
  playPlaylist: (songs: Song[], startIndex?: number) => void;
  togglePlayPause: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seekTo: (position: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  // State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  
  // Audio player ref
  const howl = useRef<Howl | null>(null);
  const progressTimer = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (howl.current) {
        howl.current.unload();
      }
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
    };
  }, []);

  // Setup progress tracking
  const startProgressTracking = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
    }
    
    progressTimer.current = window.setInterval(() => {
      if (howl.current && howl.current.playing()) {
        const currentTime = howl.current.seek() as number;
        setProgress(currentTime);
      }
    }, 1000);
  };
  
  // Handle playing a song
  const playSong = (song: Song) => {
    // Stop current song
    if (howl.current) {
      howl.current.stop();
      howl.current.unload();
    }
    
    // Create new Howl
    howl.current = new Howl({
      src: [`/api/songs/${song.id}/stream`],
      html5: true,
      volume: volume,
      preload: true,
      xhr: {
        withCredentials: true
      },
      format: ['mp3'],
      pool: 1,
      onplay: () => {
        setIsPlaying(true);
        startProgressTracking();
      },
      onpause: () => {
        setIsPlaying(false);
      },
      onstop: () => {
        setIsPlaying(false);
        setProgress(0);
      },
      onend: () => {
        if (isRepeat) {
          // Repeat the same song
          howl.current?.play();
        } else {
          // Go to next song
          nextSong();
        }
      },
      onload: () => {
        setDuration(howl.current?.duration() || 0);
      },
    });
    
    // Update state
    setCurrentSong(song);
    
    // Start playing
    howl.current.play();
  };
  
  // Play a list of songs
  const playPlaylist = (songs: Song[], startIndex = 0) => {
    if (songs.length === 0) return;
    
    // Set queue
    setQueue(songs);
    setQueueIndex(startIndex);
    
    // Play first song
    playSong(songs[startIndex]);
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (!howl.current) return;
    
    if (isPlaying) {
      howl.current.pause();
    } else {
      howl.current.play();
    }
  };
  
  // Next song
  const nextSong = () => {
    if (queue.length === 0) return;
    
    let newIndex;
    
    if (isShuffle) {
      // Random song
      newIndex = Math.floor(Math.random() * queue.length);
    } else {
      // Next song in order
      newIndex = (queueIndex + 1) % queue.length;
    }
    
    setQueueIndex(newIndex);
    playSong(queue[newIndex]);
  };
  
  // Previous song
  const prevSong = () => {
    if (queue.length === 0) return;
    
    // If progress > 3 seconds, restart current song
    if (progress > 3) {
      seekTo(0);
      return;
    }
    
    let newIndex;
    
    if (isShuffle) {
      // Random song
      newIndex = Math.floor(Math.random() * queue.length);
    } else {
      // Previous song in order
      newIndex = (queueIndex - 1 + queue.length) % queue.length;
    }
    
    setQueueIndex(newIndex);
    playSong(queue[newIndex]);
  };
  
  // Seek to position
  const seekTo = (position: number) => {
    if (!howl.current) return;
    
    howl.current.seek(position);
    setProgress(position);
  };
  
  // Change volume
  const changeVolume = (newVolume: number) => {
    if (!howl.current) return;
    
    howl.current.volume(newVolume);
    setVolume(newVolume);
  };
  
  // Toggle shuffle
  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };
  
  // Toggle repeat
  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
  };
  
  return (
    <AudioContext.Provider
      value={{
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        isShuffle,
        isRepeat,
        queue,
        howlInstance: howl.current,
        playSong,
        playPlaylist,
        togglePlayPause,
        nextSong,
        prevSong,
        seekTo,
        setVolume: changeVolume,
        toggleShuffle,
        toggleRepeat,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  
  return context;
}
