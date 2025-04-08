import { Playlist } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Link } from "wouter";

interface PlaylistCardProps {
  playlist: Playlist;
  onPlay: () => void;
}

export function PlaylistCard({ playlist, onPlay }: PlaylistCardProps) {
  return (
    <div className="bg-card rounded-md p-4 hover:bg-accent transition-colors flex gap-4 items-center">
      <Link href={`/playlist/${playlist.id}`} className="flex-shrink-0">
        <div className="w-16 h-16 bg-accent rounded-md flex items-center justify-center">
          {playlist.cover ? (
            <img 
              src={playlist.cover} 
              alt={playlist.name} 
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          )}
        </div>
      </Link>
      <Link href={`/playlist/${playlist.id}`} className="flex-grow">
        <div className="text-sm font-medium">{playlist.name}</div>
        <div className="text-xs text-muted-foreground">Playlist</div>
      </Link>
      <Button 
        size="icon"
        className="rounded-full w-10 h-10 opacity-90 hover:opacity-100 transition-opacity bg-primary text-primary-foreground"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPlay();
        }}
      >
        <Play className="h-5 w-5" />
      </Button>
    </div>
  );
}
