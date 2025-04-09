
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AudioPlayer } from "@/components/music/audio-player";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SongList } from "@/components/music/song-list";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Song } from "@shared/schema";
import { useAudio } from "@/lib/audioContext";
import { Loader2, Search as SearchIcon, Music, User, Disc } from "lucide-react";

interface SearchResults {
  songs: Song[];
  artists: { id: number; name: string; image?: string }[];
  albums: { name: string; songs: Song[] }[];
}

export default function SearchPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const query = searchParams.get('q') || '';
  
  const { 
    data: results, 
    isLoading
  } = useQuery<SearchResults>({
    queryKey: [`/api/search?q=${query}`],
    enabled: !!query
  });
  
  const { playSong } = useAudio();
  
  return (
    <div className="bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <div className="flex h-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-32 relative">
          <TopBar />
          <div className="p-6">
            {query ? (
              isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : results ? (
                <div className="space-y-8">
                  {/* Songs Section */}
                  <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Music className="h-6 w-6" />
                      Songs
                    </h2>
                    {results.songs.length > 0 ? (
                      <SongList songs={results.songs} onPlay={playSong} />
                    ) : (
                      <p className="text-muted-foreground">No songs found</p>
                    )}
                  </section>

                  {/* Artists Section */}
                  <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <User className="h-6 w-6" />
                      Artists
                    </h2>
                    {results.artists.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {results.artists.map(artist => (
                          <div
                            key={artist.id}
                            className="bg-card p-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => navigate(`/artist/${artist.id}`)}
                          >
                            <div className="aspect-square rounded-full bg-accent mb-3 overflow-hidden">
                              {artist.image ? (
                                <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-center">{artist.name}</h3>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No artists found</p>
                    )}
                  </section>

                  {/* Albums Section */}
                  <section>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Disc className="h-6 w-6" />
                      Albums
                    </h2>
                    {results.albums.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {results.albums.map(album => (
                          <div
                            key={album.name}
                            className="bg-card p-4 rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <h3 className="font-medium mb-2">{album.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {album.songs.length} songs
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No albums found</p>
                    )}
                  </section>
                </div>
              ) : null
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Search for songs, artists, or albums
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      <AudioPlayer />
      <MobileNav />
    </div>
  );
}
