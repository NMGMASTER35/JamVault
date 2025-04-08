import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AudioPlayer } from "@/components/music/audio-player";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SongList } from "@/components/music/song-list";
import { PlaylistCard } from "@/components/music/playlist-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Song, Playlist } from "@shared/schema";
import { useAudio } from "@/lib/audioContext";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlaylistForm } from "@/components/music/playlist-form";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<"songs" | "playlists" | "favorites">("songs");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch user's songs
  const { 
    data: songs, 
    isLoading: isLoadingSongs,
    error: songsError
  } = useQuery<Song[]>({
    queryKey: ['/api/songs'],
  });

  // Fetch user's playlists
  const { 
    data: playlists, 
    isLoading: isLoadingPlaylists,
    error: playlistsError
  } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });
  
  // Fetch user's favorite songs
  const {
    data: favorites,
    isLoading: isLoadingFavorites,
    error: favoritesError
  } = useQuery<Song[]>({
    queryKey: ['/api/favorites'],
  });

  const { playSong, playPlaylist } = useAudio();

  // Loading state
  const isLoading = isLoadingSongs || isLoadingPlaylists || isLoadingFavorites;
  const hasError = songsError || playlistsError || favoritesError;
  
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h1 className="text-3xl font-bold mb-2 md:mb-0">Your Library</h1>
              
              <div className="flex space-x-2">
                {activeTab === "playlists" && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Playlist
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <PlaylistForm onSuccess={() => setIsCreateDialogOpen(false)} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            
            <Tabs 
              defaultValue="songs" 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as "songs" | "playlists" | "favorites")}
              className="w-full"
            >
              <TabsList className="mb-6">
                <TabsTrigger value="songs">Songs</TabsTrigger>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>
              
              <TabsContent value="songs">
                {isLoadingSongs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : songsError ? (
                  <div className="p-4 text-center text-destructive">
                    Error loading songs. Please try again.
                  </div>
                ) : songs && songs.length > 0 ? (
                  <SongList 
                    songs={songs} 
                    onPlay={playSong}
                    isLibraryView={true}
                  />
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="mb-4">No songs in your library yet.</p>
                    <Button asChild>
                      <a href="/upload">Upload Music</a>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="playlists">
                {isLoadingPlaylists ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : playlistsError ? (
                  <div className="p-4 text-center text-destructive">
                    Error loading playlists. Please try again.
                  </div>
                ) : playlists && playlists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {playlists.map((playlist) => (
                      <PlaylistCard 
                        key={playlist.id} 
                        playlist={playlist}
                        onPlay={async () => {
                          try {
                            const res = await fetch(`/api/playlists/${playlist.id}/songs`);
                            if (!res.ok) throw new Error('Failed to fetch playlist songs');
                            const playlistSongs = await res.json();
                            if (playlistSongs.length > 0) {
                              playPlaylist(playlistSongs);
                            }
                          } catch (error) {
                            console.error('Error playing playlist:', error);
                          }
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="mb-4">No playlists created yet.</p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      Create Playlist
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="favorites">
                {isLoadingFavorites ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : favoritesError ? (
                  <div className="p-4 text-center text-destructive">
                    Error loading favorites. Please try again.
                  </div>
                ) : favorites && favorites.length > 0 ? (
                  <SongList 
                    songs={favorites} 
                    onPlay={playSong}
                    isLibraryView={true}
                  />
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="mb-4">No favorite songs yet.</p>
                    <p>Add songs to your favorites by clicking the heart icon.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
