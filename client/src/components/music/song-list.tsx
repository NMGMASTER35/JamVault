import { Song } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { 
  MoreHorizontal, 
  Play,
  Share2,
  Plus,
  Check,
  Library
} from "lucide-react";
import { FavoriteButton } from "./favorite-button";
import { ShareDialog } from "./share-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { useLibrary } from "@/hooks/use-library";
import { useAuth } from "@/hooks/use-auth";

interface SongListProps {
  songs: Song[];
  onPlay: (song: Song) => void;
  playlistId?: number;
  isLibraryView?: boolean;
}

export function SongList({ songs, onPlay, playlistId, isLibraryView = false }: SongListProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    librarySongs, 
    addToLibraryMutation, 
    removeFromLibraryMutation 
  } = useLibrary();
  
  // Create a lookup object for quick status checks
  const libraryStatus = useMemo(() => {
    const statusMap: Record<number, boolean> = {};
    librarySongs.forEach(song => {
      statusMap[song.id] = true;
    });
    return statusMap;
  }, [librarySongs]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [showAddToPlaylistDialog, setShowAddToPlaylistDialog] = useState(false);
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Delete song mutation
  const deleteSongMutation = useMutation({
    mutationFn: async (songId: number) => {
      await apiRequest("DELETE", `/api/songs/${songId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/songs'] });
      toast({
        title: "Song deleted",
        description: "The song has been removed from your library",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete song",
        variant: "destructive",
      });
    },
  });
  
  // Remove song from playlist mutation
  const removeSongFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, songId }: { playlistId: number, songId: number }) => {
      await apiRequest("DELETE", `/api/playlists/${playlistId}/songs/${songId}`);
    },
    onSuccess: () => {
      if (playlistId) {
        queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlistId}/songs`] });
      }
      toast({
        title: "Song removed",
        description: "The song has been removed from the playlist",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove song from playlist",
        variant: "destructive",
      });
    },
  });
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full mt-4">
        <thead>
          <tr className="text-left text-xs text-muted-foreground border-b border-border">
            <th className="pb-3 pl-4">#</th>
            <th className="pb-3">TITLE</th>
            <th className="pb-3 hidden md:table-cell">ALBUM</th>
            <th className="pb-3 hidden lg:table-cell">DATE ADDED</th>
            <th className="pb-3 text-right pr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => (
            <tr key={song.id} className="group hover:bg-accent transition-colors">
              <td className="py-3 pl-4 text-muted-foreground">{index + 1}</td>
              <td>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent rounded flex items-center justify-center">
                    {song.cover ? (
                      <img 
                        src={song.cover}
                        alt={`${song.title} cover`}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                    )}
                  </div>
                  <div>
                    <div 
                      className="group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => onPlay(song)}
                    >
                      {song.title}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-sm text-muted-foreground">{song.artist}</div>
                      {user && libraryStatus[song.id] && (
                        <Library className="h-3 w-3 text-primary ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="hidden md:table-cell text-muted-foreground">
                {song.album || '-'}
              </td>
              <td className="hidden lg:table-cell text-muted-foreground">
                {song.uploadedAt ? formatDistance(new Date(song.uploadedAt), new Date(), { addSuffix: true }) : '-'}
              </td>
              <td className="text-right pr-4">
                <div className="flex items-center justify-end gap-4">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <FavoriteButton songId={song.id} />
                  </div>
                  <span className="text-muted-foreground">{formatDuration(song.duration)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onPlay(song)}>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </DropdownMenuItem>
                      
                      {!playlistId && (
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedSong(song);
                            setShowAddToPlaylistDialog(true);
                          }}
                        >
                          Add to Playlist
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem>
                        Download
                      </DropdownMenuItem>

                      {user && !isLibraryView && (
                        libraryStatus[song.id] ? (
                          <DropdownMenuItem
                            onClick={() => removeFromLibraryMutation.mutate(song.id)}
                          >
                            <Check className="h-4 w-4 mr-2 text-primary" />
                            In Your Library
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => addToLibraryMutation.mutate(song.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Library
                          </DropdownMenuItem>
                        )
                      )}

                      <DropdownMenuItem asChild>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                          <div className="flex items-center">
                            <Share2 className="h-4 w-4 mr-2" />
                            <span>Share</span>
                          </div>
                          <ShareDialog 
                            songId={song.id} 
                            songTitle={song.title} 
                            songArtist={song.artist} 
                          />
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {playlistId && (
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm("Remove this song from the playlist?")) {
                              removeSongFromPlaylistMutation.mutate({ 
                                playlistId, 
                                songId: song.id 
                              });
                            }
                          }}
                        >
                          Remove from Playlist
                        </DropdownMenuItem>
                      )}
                      
                      {isLibraryView && (
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this song from your library? This cannot be undone.")) {
                              deleteSongMutation.mutate(song.id);
                            }
                          }}
                        >
                          Delete from Library
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Add to Playlist Dialog - This would need to be implemented */}
      <Dialog open={showAddToPlaylistDialog} onOpenChange={setShowAddToPlaylistDialog}>
        <DialogContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add to Playlist</h3>
            <p className="text-muted-foreground">
              This feature will be implemented soon...
            </p>
            <Button 
              onClick={() => setShowAddToPlaylistDialog(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
