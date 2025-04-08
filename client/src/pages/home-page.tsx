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
import { Loader2, Clock, ListMusic, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function HomePage() {
  const [_, navigate] = useLocation();
  
  // Fetch user's songs
  const { 
    data: songs, 
    isLoading: isLoadingSongs,
    error: songsError
  } = useQuery<Song[]>({
    queryKey: ['/api/songs'],
    queryFn: () => fetch('/api/songs').then(res => {
      if (!res.ok) throw new Error('Failed to fetch songs');
      return res.json();
    }),
  });

  // Fetch recently added songs
  const { 
    data: recentSongs, 
    isLoading: isLoadingRecentSongs,
    error: recentSongsError
  } = useQuery<Song[]>({
    queryKey: ['/api/songs/recent'],
    queryFn: () => fetch('/api/songs/recent').then(res => {
      if (!res.ok) throw new Error('Failed to fetch recent songs');
      return res.json();
    }),
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
  const isLoading = isLoadingSongs || isLoadingRecentSongs || isLoadingPlaylists;
  const hasError = songsError || recentSongsError || playlistsError;
  
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Listening Time Card */}
              <div 
                className="bg-card border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate("/stats")}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium">Your Listening Time</h3>
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Track your music consumption</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/stats");
                  }}
                >
                  View Stats
                </Button>
              </div>

              {/* Top Tracks Card */}
              <div 
                className="bg-card border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate("/stats?tab=tracks")}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium">Your Top Tracks</h3>
                  <ListMusic className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Discover your most played songs</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/stats?tab=tracks");
                  }}
                >
                  See Top Tracks
                </Button>
              </div>

              {/* Listening Personality Card */}
              <div 
                className="bg-card border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate("/stats")}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium">Listening Personality</h3>
                  <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">Your musical zodiac sign</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/stats");
                  }}
                >
                  Discover Yours
                </Button>
              </div>
            </div>

            {/* Recently Added Songs */}
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
              ) : recentSongs && recentSongs.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {recentSongs.slice(0, 6).map((song) => (
                    <SongCard 
                      key={song.id} 
                      song={song} 
                      onClick={() => playSong(song)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recently added songs. Check back soon for new additions!
                </div>
              )}
            </div>

            {/* Your Library */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Library</h2>
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
