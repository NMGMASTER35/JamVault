import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  BarChart3, 
  Music2, 
  Users, 
  ListMusic, 
  Disc, 
  Share2, 
  UserCircle
} from "lucide-react";

// Define types for user listening stats
interface TopSong {
  songId: number;
  title: string;
  artist: string;
  playCount: number;
}

interface TopArtist {
  artist: string;
  playCount: number;
}

interface TopGenre {
  genre: string;
  playCount: number;
}

interface UserListeningStats {
  totalTime: number;
  totalPlays: number;
  topSongs: TopSong[];
  topArtists: TopArtist[];
  topGenres: TopGenre[];
}

// Personality types based on listening habits
const PERSONALITY_TYPES = [
  {
    type: "Explorer",
    description: "You love discovering new artists and genres, never settling for the same sound for too long."
  },
  {
    type: "Loyal Listener",
    description: "You find your favorites and stick with them, building deep connections with specific artists."
  },
  {
    type: "Mood Maven",
    description: "Your listening habits change with your moods, creating a diverse and emotional musical journey."
  },
  {
    type: "Nostalgia Seeker",
    description: "You often return to the classics and tracks that hold special memories for you."
  },
  {
    type: "Rhythm Enthusiast",
    description: "You prioritize beats and rhythm, gravitating toward danceable and energetic tracks."
  }
];

// Colors for charts
const COLORS = ['#FF6B8B', '#4BC0C0', '#9966FF', '#FFCE56', '#36A2EB'];

export default function StatsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [personalityType, setPersonalityType] = useState<string>("");
  const [, navigate] = useLocation(); 

  // Fetch user listening stats
  const { data: stats, isLoading } = useQuery<UserListeningStats>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  // Determine personality type based on listening habits
  useEffect(() => {
    if (stats) {
      // This would be more sophisticated in a real app, using actual listening patterns
      // For now, we'll choose a random personality type
      const randomIndex = Math.floor(Math.random() * PERSONALITY_TYPES.length);
      setPersonalityType(PERSONALITY_TYPES[randomIndex].type);
    }
  }, [stats]);

  // Handle generating a shareable playlist
  const generateShareablePlaylist = () => {
    // This would integrate with a sharing API in a real implementation
    alert("Your shareable playlist has been created! You can now share it with your friends.");
  };

  if (isLoading) {
    return (
      <div className="container py-10 max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading your listening stats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || (!stats.totalTime && !stats.totalPlays)) {
    return (
      <div className="container py-10 max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Listening Data Available</h2>
            <p className="text-muted-foreground">Start listening to music to see your stats!</p>
          </div>
        </div>
      </div>
    );
  }

  // Create placeholder data if no real data is available
  const topSongs = stats?.topSongs || [] as TopSong[];
  const topArtists = stats?.topArtists || [] as TopArtist[];
  const topGenres = stats?.topGenres || [] as TopGenre[];
  const totalMinutes = stats?.totalTime ? Math.floor(stats.totalTime / 60) : 0;

  return (
    <div className="container py-10 max-w-6xl mx-auto px-4 md:px-6">
      <div className="flex items-center mb-2">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')}
          className="mr-4"
          size="sm"
        >
          Back
        </Button>
      </div>
      <h1 className="text-4xl font-bold mb-2">Your Listening Stats</h1>
      <p className="text-muted-foreground mb-8">
        Explore your personal music journey based on your listening habits
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracks">Top Tracks</TabsTrigger>
          <TabsTrigger value="artists">Top Artists</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total listening time card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Total Listening Time
                </CardTitle>
                <CardDescription>Your total music consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6">
                  <span className="text-5xl font-bold">{totalMinutes}</span>
                  <span className="text-muted-foreground mt-1">minutes</span>
                </div>
              </CardContent>
            </Card>

            {/* Personality type card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <UserCircle className="mr-2 h-5 w-5 text-primary" />
                  Your Listening Personality
                </CardTitle>
                <CardDescription>Your musical zodiac sign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <span className="text-3xl font-bold text-primary">{personalityType}</span>
                  <p className="text-muted-foreground mt-3">
                    {PERSONALITY_TYPES.find(p => p.type === personalityType)?.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Music2 className="mr-2 h-5 w-5 text-primary" />
                  Top Track
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topSongs && topSongs.length > 0 ? (
                  <>
                    <p className="font-semibold">{topSongs[0].title}</p>
                    <p className="text-sm text-muted-foreground">{topSongs[0].artist}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No listening data available yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Top Artist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{topArtists[0]?.artist || "No data yet"}</p>
                <p className="text-sm text-muted-foreground">{topArtists[0]?.playCount || 0} plays</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Disc className="mr-2 h-5 w-5 text-primary" />
                  Favorite Genre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{topGenres[0]?.genre || "No data yet"}</p>
                <p className="text-sm text-muted-foreground">{Math.round((topGenres[0]?.playCount || 0) / (stats?.totalPlays || 1) * 100)}% of your plays</p>
              </CardContent>
            </Card>
          </div>

          {/* Create shareable playlist card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="mr-2 h-5 w-5 text-primary" />
                Share Your Musical Taste
              </CardTitle>
              <CardDescription>Generate a playlist based on your top tracks</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generateShareablePlaylist}
                className="w-full"
              >
                Create "My Top Tracks" Playlist
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Tracks Tab */}
        <TabsContent value="tracks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ListMusic className="mr-2 h-5 w-5 text-primary" />
                Your Top Tracks
              </CardTitle>
              <CardDescription>
                The songs you've played most frequently
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topSongs.length > 0 ? (
                <div className="space-y-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={topSongs.slice(0, 10)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="title" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80} 
                        tick={{ fontSize: 12 }} 
                      />
                      <YAxis />
                      <Tooltip labelStyle={{ color: '#000' }} />
                      <Bar dataKey="playCount" fill="#FF6B8B" name="Play Count" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {topSongs.slice(0, 10).map((song: TopSong, index: number) => (
                      <div key={index} className="flex justify-between items-center border-b pb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-semibold text-muted-foreground">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{song.title}</p>
                            <p className="text-sm text-muted-foreground">{song.artist}</p>
                          </div>
                        </div>
                        <div className="text-muted-foreground">{song.playCount} plays</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No listening data available yet. Start listening to see your stats!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Artists Tab */}
        <TabsContent value="artists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Your Top Artists
              </CardTitle>
              <CardDescription>
                The artists you've listened to most frequently
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topArtists.length > 0 ? (
                <div className="space-y-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={topArtists.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="playCount"
                        nameKey="artist"
                      >
                        {topArtists.slice(0, 5).map((entry: TopArtist, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {topArtists.slice(0, 10).map((artist: TopArtist, index: number) => (
                      <div key={index} className="flex justify-between items-center border-b pb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-semibold text-muted-foreground">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{artist.artist}</p>
                          </div>
                        </div>
                        <div className="text-muted-foreground">{artist.playCount} plays</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No listening data available yet. Start listening to see your stats!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Genres Tab */}
        <TabsContent value="genres" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Your Genre Breakdown
              </CardTitle>
              <CardDescription>
                The genres that define your musical taste
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topGenres.length > 0 ? (
                <div className="space-y-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={topGenres.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="playCount"
                        nameKey="genre"
                      >
                        {topGenres.slice(0, 5).map((entry: TopGenre, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {topGenres.slice(0, 10).map((genre: TopGenre, index: number) => (
                      <div key={index} className="flex justify-between items-center border-b pb-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-semibold text-muted-foreground">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium">{genre.genre}</p>
                          </div>
                        </div>
                        <div className="text-muted-foreground">{genre.playCount} plays</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No listening data available yet. Start listening to see your stats!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}