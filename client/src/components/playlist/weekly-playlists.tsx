import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Playlist, Song } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Music2 } from "lucide-react";
import { useAudio } from "@/lib/audioContext";
import { useLocation } from "wouter";

export function WeeklyPlaylists() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { playSong, playPlaylist } = useAudio();
  const [activeTab, setActiveTab] = useState<string>("discover");
  
  // Get the current week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const currentWeek = getWeekNumber(new Date());
  
  // Query for the weekly playlists
  const { data: weeklyPlaylists, isLoading: isLoadingPlaylists } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists', 'weekly'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/playlists');
        const playlists = await response.json();
        
        // Filter playlists that have "Week" in their name
        return playlists.filter((playlist: Playlist) => 
          playlist.name.includes('Week') || 
          playlist.name.includes('Discover') || 
          playlist.name.includes('Recommended')
        );
      } catch (error) {
        console.error("Error fetching weekly playlists:", error);
        return [];
      }
    },
  });
  
  // Query for songs to generate playlists from
  const { data: allSongs, isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ['/api/songs'],
  });
  
  // Mutation to create a new weekly playlist
  const createWeeklyPlaylistMutation = useMutation({
    mutationFn: async (playlistData: { name: string; description: string; songs: number[] }) => {
      const response = await apiRequest('POST', '/api/playlists', {
        name: playlistData.name,
        description: playlistData.description,
      });
      
      const newPlaylist = await response.json();
      
      // Add songs to the playlist
      for (const songId of playlistData.songs) {
        await apiRequest('POST', `/api/playlists/${newPlaylist.id}/songs`, { songId });
      }
      
      return newPlaylist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      toast({
        title: "Playlist created",
        description: "Your weekly playlist has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating playlist",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to generate a new weekly playlist
  const generateWeeklyPlaylist = (type: 'discover' | 'recap' | 'mood' | 'genre' | 'trending') => {
    if (!allSongs || allSongs.length === 0) {
      toast({
        title: "No songs available",
        description: "There are no songs available to create a playlist.",
        variant: "destructive",
      });
      return;
    }
    
    // Shuffle songs array to get random selections
    const shuffled = [...allSongs].sort(() => 0.5 - Math.random());
    
    // Get date for name formatting
    const date = new Date();
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    
    let playlistName = "";
    let playlistDescription = "";
    let selectedSongs: number[] = [];
    
    switch (type) {
      case 'discover':
        playlistName = `Discover Weekly (Week ${currentWeek})`;
        playlistDescription = `New music recommendations for the week of ${formattedDate}`;
        // Pick 10 random songs
        selectedSongs = shuffled.slice(0, 10).map(song => song.id);
        break;
        
      case 'recap':
        playlistName = `Weekly Recap (Week ${currentWeek})`;
        playlistDescription = `Your most played tracks from this week`;
        // Simulate most played (in real app would come from user's history)
        selectedSongs = shuffled.slice(0, 8).map(song => song.id);
        break;
        
      case 'mood':
        const moods = ['Energetic', 'Chill', 'Focus', 'Workout', 'Relaxation'];
        const selectedMood = moods[Math.floor(Math.random() * moods.length)];
        playlistName = `${selectedMood} Mix (Week ${currentWeek})`;
        playlistDescription = `${selectedMood} vibes for your week`;
        selectedSongs = shuffled.slice(0, 12).map(song => song.id);
        break;
        
      case 'genre':
        // Get a random genre from available songs
        const genres = allSongs
          .map(song => song.genre)
          .filter((genre, index, self) => genre && self.indexOf(genre) === index);
        
        const selectedGenre = genres[Math.floor(Math.random() * genres.length)] || 'Mixed';
        playlistName = `${selectedGenre} Selections (Week ${currentWeek})`;
        playlistDescription = `The best ${selectedGenre} tracks this week`;
        
        // Filter songs by the selected genre
        const genreSongs = allSongs.filter(song => song.genre === selectedGenre);
        selectedSongs = (genreSongs.length > 0 ? genreSongs : shuffled)
          .slice(0, 10)
          .map(song => song.id);
        break;
        
      case 'trending':
        playlistName = `Trending Now (Week ${currentWeek})`;
        playlistDescription = `Popular tracks from around JamVault`;
        selectedSongs = shuffled.slice(0, 15).map(song => song.id);
        break;
    }
    
    createWeeklyPlaylistMutation.mutate({
      name: playlistName,
      description: playlistDescription,
      songs: selectedSongs,
    });
  };
  
  const playlistTypes = [
    { id: 'discover', name: 'Discover Weekly', description: 'Fresh music recommendations based on your taste' },
    { id: 'recap', name: 'Weekly Recap', description: 'Your most played tracks from this week' },
    { id: 'mood', name: 'Mood Mix', description: 'Playlists curated to match your mood' },
    { id: 'genre', name: 'Genre Selections', description: 'Best tracks from your favorite genres' },
    { id: 'trending', name: 'Trending Now', description: 'Popular tracks from around JamVault' },
  ];
  
  const handlePlaylist = (playlist: Playlist) => {
    // Fetch the songs for this playlist and play them
    const getSongsAndPlay = async () => {
      try {
        const response = await apiRequest('GET', `/api/playlists/${playlist.id}/songs`);
        const songs = await response.json();
        if (songs.length > 0) {
          playPlaylist(songs);
        } else {
          toast({
            title: "Empty playlist",
            description: "This playlist doesn't have any songs.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching playlist songs:", error);
        toast({
          title: "Error",
          description: "Could not play this playlist.",
          variant: "destructive",
        });
      }
    };
    
    getSongsAndPlay();
  };
  
  const getPlaylistsForType = (type: string): Playlist[] => {
    if (!weeklyPlaylists) return [];
    
    switch (type) {
      case 'discover':
        return weeklyPlaylists.filter(p => p.name.includes('Discover'));
      case 'recap':
        return weeklyPlaylists.filter(p => p.name.includes('Recap'));
      case 'mood':
        return weeklyPlaylists.filter(p => 
          p.name.includes('Chill') || 
          p.name.includes('Energetic') || 
          p.name.includes('Focus') ||
          p.name.includes('Workout') ||
          p.name.includes('Relaxation')
        );
      case 'genre':
        return weeklyPlaylists.filter(p => p.name.includes('Selections'));
      case 'trending':
        return weeklyPlaylists.filter(p => p.name.includes('Trending'));
      default:
        return [];
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Weekly Playlists</h2>
        <p className="text-muted-foreground">
          Discover new music with playlists updated every week
        </p>
      </div>
      
      <Tabs defaultValue="discover" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
          {playlistTypes.map(type => (
            <TabsTrigger key={type.id} value={type.id}>
              {type.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {playlistTypes.map(type => (
          <TabsContent key={type.id} value={type.id} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Create new playlist card */}
              <Card className="bg-card/50 backdrop-blur border-dashed hover:bg-card/80 transition-colors group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    Create New {type.name}
                  </CardTitle>
                  <CardDescription>
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pb-0">
                  <div className="aspect-square bg-card rounded-md flex items-center justify-center overflow-hidden">
                    <div className="text-6xl text-muted-foreground/30 flex items-center justify-center h-full w-full group-hover:text-muted-foreground/50 transition-colors">
                      <Plus className="h-12 w-12" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4">
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => generateWeeklyPlaylist(type.id as any)}
                    disabled={createWeeklyPlaylistMutation.isPending || isLoadingSongs}
                  >
                    {createWeeklyPlaylistMutation.isPending ? "Creating..." : "Generate New Playlist"}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Existing playlists */}
              {isLoadingPlaylists ? (
                <>
                  <PlaylistCardSkeleton />
                  <PlaylistCardSkeleton />
                </>
              ) : (
                getPlaylistsForType(type.id).map((playlist) => (
                  <Card key={playlist.id} className="group hover:shadow-md transition-shadow overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{playlist.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {playlist.description || "Custom weekly playlist"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <div className="aspect-square bg-card rounded-md relative flex items-center justify-center overflow-hidden">
                        {playlist.cover ? (
                          <img
                            src={playlist.cover}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-6xl text-primary/30 flex items-center justify-center h-full w-full">
                            <Music2 className="h-20 w-20" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="icon" 
                            className="rounded-full w-12 h-12 hover:scale-110 transition-transform"
                            onClick={() => handlePlaylist(playlist)}
                          >
                            <Play className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 flex gap-2">
                      <Button 
                        className="w-full" 
                        variant="ghost"
                        onClick={() => navigate(`/playlist/${playlist.id}`)}
                      >
                        View
                      </Button>
                      <Button 
                        className="w-full" 
                        onClick={() => handlePlaylist(playlist)}
                      >
                        Play
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PlaylistCardSkeleton() {
  return (
    <Card className="h-[360px]">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full" />
      </CardContent>
      <CardFooter className="flex gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}