import { Song } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Play, Plus, Check, Share } from "lucide-react";
import { ShareDialog } from "./share-dialog";
import { useLibrary } from "@/hooks/use-library";
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SongCardProps {
  song: Song;
  onClick: () => void;
}

export function SongCard({ song, onClick }: SongCardProps) {
  const { user } = useAuth();
  const { 
    addToLibraryMutation, 
    removeFromLibraryMutation
  } = useLibrary();
  
  const { data: libraryStatus } = useLibrary().checkInLibraryQuery(song.id);
  const isInLibrary = libraryStatus?.isInLibrary || false;
  
  const handleLibraryAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    if (isInLibrary) {
      removeFromLibraryMutation.mutate(song.id);
    } else {
      addToLibraryMutation.mutate(song.id);
    }
  };
  
  return (
    <div className="bg-card p-3 rounded-md hover:bg-accent transition-colors group cursor-pointer">
      <div className="relative mb-3">
        <div className="aspect-square bg-accent rounded-md flex items-center justify-center">
          {song.cover ? (
            <img 
              src={song.cover} 
              alt={`${song.title} cover`} 
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"></path>
              <circle cx="6" cy="18" r="3"></circle>
              <circle cx="18" cy="16" r="3"></circle>
            </svg>
          )}
        </div>
        <div className="absolute right-2 bottom-2 flex gap-1">
          {user && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={isInLibrary ? "default" : "outline"}
                    className="w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleLibraryAction}
                    disabled={addToLibraryMutation.isPending || removeFromLibraryMutation.isPending}
                  >
                    {isInLibrary ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isInLibrary ? "Remove from Library" : "Add to Library"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <ShareDialog 
            songId={song.id} 
            songTitle={song.title} 
            songArtist={song.artist} 
          />
          <Button 
            size="icon"
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="text-sm font-medium truncate">{song.title}</div>
      <div className="text-xs text-muted-foreground truncate">{song.artist}</div>
    </div>
  );
}
