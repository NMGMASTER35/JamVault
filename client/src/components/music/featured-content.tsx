import { Button } from "@/components/ui/button";
import { useAudio } from "@/lib/audioContext";
import { useQuery } from "@tanstack/react-query";
import { Song } from "@shared/schema";
import { Play, Heart } from "lucide-react";

export function FeaturedContent() {
  // Fetch user's songs for featured content
  const { data: songs } = useQuery<Song[]>({
    queryKey: ['/api/songs'],
  });
  
  const { playPlaylist } = useAudio();
  
  // Get a random featured song or the most recent one
  const featuredSong = songs && songs.length > 0
    ? songs[Math.floor(Math.random() * songs.length)]
    : null;
  
  return (
    <div className="mb-8">
      <div className="rounded-xl bg-gradient-to-r from-primary/30 to-primary/10 p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-md shadow-lg bg-card flex items-center justify-center">
            {featuredSong?.cover ? (
              <img 
                src={featuredSong.cover} 
                alt="Featured content" 
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
            )}
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-muted-foreground">FEATURED CONTENT</div>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              {songs && songs.length > 0 
                ? "Your Music Collection" 
                : "Welcome to JamVault"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {songs && songs.length > 0 
                ? `Enjoy your personal collection of ${songs.length} songs. Create playlists and enjoy your music.` 
                : "Upload your music and create playlists to enjoy your personal streaming experience."}
            </p>
            <div className="flex gap-4 mt-4">
              {songs && songs.length > 0 ? (
                <>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => playPlaylist(songs)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    <span>Play All</span>
                  </Button>
                  <Button variant="outline" className="border-white/20">
                    <Heart className="h-4 w-4 mr-2" />
                    <span>Favorite</span>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <a href="/upload">Upload Music</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
