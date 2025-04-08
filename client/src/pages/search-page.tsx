import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AudioPlayer } from "@/components/music/audio-player";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SongList } from "@/components/music/song-list";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Song } from "@shared/schema";
import { useAudio } from "@/lib/audioContext";
import { Loader2, Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all songs
  const { 
    data: allSongs, 
    isLoading,
    error
  } = useQuery<Song[]>({
    queryKey: ['/api/songs'],
  });
  
  // Filter songs based on search term
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  
  useEffect(() => {
    if (allSongs && searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = allSongs.filter(song => 
        song.title.toLowerCase().includes(term) || 
        song.artist.toLowerCase().includes(term) || 
        (song.album && song.album.toLowerCase().includes(term))
      );
      setFilteredSongs(filtered);
    } else {
      setFilteredSongs([]);
    }
  }, [searchTerm, allSongs]);
  
  const { playSong } = useAudio();
  
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
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">Search</h1>
              
              <div className="max-w-2xl relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for songs, artists, or albums..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-destructive">
                Error loading songs. Please try again.
              </div>
            ) : searchTerm ? (
              <>
                <h2 className="text-xl font-semibold mt-6 mb-4">
                  Results for "{searchTerm}"
                </h2>
                
                {filteredSongs.length > 0 ? (
                  <SongList 
                    songs={filteredSongs} 
                    onPlay={playSong}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No songs found matching your search.
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Search for songs in your library
                </p>
              </div>
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
