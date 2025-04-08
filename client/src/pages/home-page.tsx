import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AudioPlayer } from "@/components/music/audio-player";
import { MobileNav } from "@/components/layout/mobile-nav";
import { FeaturedContent } from "@/components/music/featured-content";
import { SongCard } from "@/components/music/song-card";
import { PlaylistCard } from "@/components/music/playlist-card";
import { useQuery } from "@tanstack/react-query";
import { Song, Playlist } from "@shared/schema";
import { useAudio } from "@/lib/audioContext";
import { Loader2 } from "lucide-react";

export default function HomePage() {
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

  const { playSong, playPlaylist } = useAudio();

  // Loading state
  const isLoading = isLoadingSongs || isLoadingPlaylists;
  const hasError = songsError || playlistsError;
  
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
            {/* Featured Content */}
            <FeaturedContent />

            {/* Recently Added */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recently Added</h2>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : hasError ? (
                <div className="p-4 text-center text-destructive">
                  Error loading songs. Please try again.
                </div>
              ) : songs && songs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {songs.slice(0, 6).map((song) => (
                    <SongCard 
                      key={song.id} 
                      song={song} 
                      onClick={() => playSong(song)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No songs in your library yet. Upload some music to get started!
                </div>
              )}
            </div>

            {/* Your Playlists */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Playlists</h2>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : hasError ? (
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
                <div className="text-center py-8 text-muted-foreground">
                  No playlists created yet. Create a playlist to organize your music!
                </div>
              )}
            </div>
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
