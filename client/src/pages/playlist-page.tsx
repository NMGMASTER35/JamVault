import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AudioPlayer } from "@/components/music/audio-player";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SongList } from "@/components/music/song-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit, Play, MoreVertical, Heart } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Playlist, Song } from "@shared/schema";
import { useAudio } from "@/lib/audioContext";
import { useState } from "react";
import { PlaylistForm } from "@/components/music/playlist-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function PlaylistPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch playlist details
  const { 
    data: playlist, 
    isLoading: isLoadingPlaylist,
    error: playlistError
  } = useQuery<Playlist>({
    queryKey: [`/api/playlists/${id}`],
  });

  // Fetch playlist songs
  const { 
    data: songs, 
    isLoading: isLoadingSongs,
    error: songsError
  } = useQuery<Song[]>({
    queryKey: [`/api/playlists/${id}/songs`],
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/playlists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({
        title: "Playlist deleted",
        description: "Your playlist has been deleted successfully",
      });
      navigate("/library");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      });
    },
  });

  const { playSong, playPlaylist } = useAudio();

  // Loading state
  const isLoading = isLoadingPlaylist || isLoadingSongs;
  const hasError = playlistError || songsError;

  // Calculate total duration
  const totalDuration = songs?.reduce((total, song) => total + song.duration, 0) || 0;
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };
  
  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl mb-2">Error Loading Playlist</h2>
          <p className="text-muted-foreground mb-4">The playlist could not be loaded.</p>
          <Button onClick={() => navigate("/library")}>Back to Library</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-32 relative">
          {/* Top Bar */}
          <TopBar />

          {/* Page Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-6 mb-6 items-start">
                  {/* Playlist Cover */}
                  <div className="w-48 h-48 bg-card flex items-center justify-center rounded-md shadow-lg">
                    {playlist?.cover ? (
                      <img 
                        src={playlist.cover} 
                        alt={playlist.name} 
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                      </svg>
                    )}
                  </div>
                  
                  {/* Playlist Details */}
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground uppercase font-medium">PLAYLIST</div>
                    <h1 className="text-3xl font-bold mt-1">{playlist?.name}</h1>
                    {playlist?.description && (
                      <p className="text-muted-foreground mt-1">{playlist.description}</p>
                    )}
                    <div className="text-sm text-muted-foreground mt-2">
                      {songs?.length} songs • {formatDuration(totalDuration)}
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                      <Button 
                        onClick={() => songs && songs.length > 0 && playPlaylist(songs)}
                        disabled={!songs || songs.length === 0}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        <span>Play</span>
                      </Button>
                      
                      <Button size="icon" variant="ghost">
                        <Heart className="h-5 w-5" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Playlist
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                              {playlist && (
                                <PlaylistForm 
                                  playlist={playlist}
                                  onSuccess={() => {
                                    setIsEditDialogOpen(false);
                                    queryClient.invalidateQueries({ queryKey: [`/api/playlists/${id}`] });
                                  }}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this playlist?")) {
                                deletePlaylistMutation.mutate();
                              }
                            }}
                          >
                            Delete Playlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                
                {/* Song List */}
                {songs && songs.length > 0 ? (
                  <SongList 
                    songs={songs} 
                    onPlay={playSong}
                    playlistId={parseInt(id)}
                  />
                ) : (
                  <div className="text-center py-16 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">This playlist is empty</p>
                    <Button asChild>
                      <a href="/library">Add Songs</a>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Audio Player */}
      <AudioPlayer />

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
