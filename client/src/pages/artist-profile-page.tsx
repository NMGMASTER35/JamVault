import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Play, Plus, Music, Disc } from "lucide-react";
import { Artist, Song, Album } from "../../../shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("songs");

  // Fetch artist data
  const { data: artist, isLoading: artistLoading } = useQuery<Artist>({
    queryKey: [`/api/artists/${id}`],
    enabled: !!id,
  });

  // Fetch artist's songs
  const { data: songs, isLoading: songsLoading } = useQuery<Song[]>({
    queryKey: [`/api/artists/${id}/songs`],
    enabled: !!id,
  });

  // Fetch artist's albums
  const { data: albums, isLoading: albumsLoading } = useQuery<Album[]>({
    queryKey: [`/api/artists/${id}/albums`],
    enabled: !!id,
  });

  const isLoading = artistLoading || songsLoading || albumsLoading;

  // Format function for displaying duration in mm:ss format
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate total songs and albums
  const totalSongs = songs?.length || 0;
  const totalAlbums = albums?.length || 0;

  if (!id) {
    return <div>Artist ID is required</div>;
  }

  return (
    <div className="container mx-auto py-8">
      {isLoading ? (
        <div className="flex flex-col gap-8">
          {/* Artist header skeleton */}
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-48 h-48 rounded-lg" />
            <div className="flex flex-col gap-4 flex-1">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
          
          {/* Tabs skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-56" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : artist ? (
        <div className="flex flex-col gap-8">
          {/* Artist header */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-muted">
              {artist.image ? (
                <img 
                  src={artist.image} 
                  alt={artist.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/200x200?text=No+Image")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Music size={64} className="text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <h1 className="text-3xl font-bold">{artist.name}</h1>
              <div className="flex gap-2 text-muted-foreground">
                <span>{totalSongs} songs</span>
                <span>•</span>
                <span>{totalAlbums} albums</span>
                {artist.genres && artist.genres.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{artist.genres.join(", ")}</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-muted-foreground">
                {artist.bio || "No biography available."}
              </p>
              {user && (
                <div className="flex gap-2 mt-4">
                  {songs && songs.length > 0 && (
                    <Button size="sm" className="flex items-center gap-1">
                      <Play size={14} /> Play All
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Tabs content */}
          <Tabs defaultValue="songs" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="songs">Songs</TabsTrigger>
              <TabsTrigger value="albums">Albums</TabsTrigger>
              <TabsTrigger value="featured">Featured On</TabsTrigger>
            </TabsList>
            
            <TabsContent value="songs" className="pt-4">
              {songs && songs.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    {songs.map((song) => (
                      <div 
                        key={song.id} 
                        className="flex items-center p-2 hover:bg-muted/50 rounded-md transition-colors"
                      >
                        <div className="w-12 h-12 rounded overflow-hidden mr-4">
                          {song.cover ? (
                            <img 
                              src={song.cover} 
                              alt={song.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.src = "https://placehold.co/100x100?text=No+Cover")}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Music size={24} className="text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{song.title}</h3>
                          <p className="text-sm text-muted-foreground">{song.album || "Single"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(song.duration)}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Play size={16} />
                          </Button>
                          {user && (
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Plus size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Music size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                  <p>No songs available for this artist</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="albums" className="pt-4">
              {albums && albums.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {albums.map((album) => (
                    <Card key={album.id} className="overflow-hidden">
                      <div className="w-full aspect-square bg-muted">
                        {album.cover ? (
                          <img 
                            src={album.cover} 
                            alt={album.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = "https://placehold.co/300x300?text=No+Cover")}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Disc size={64} className="text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle>{album.title}</CardTitle>
                        <CardDescription>
                          {album.releaseYear || "Unknown year"} • {album.trackCount || 0} tracks
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Play size={14} /> Play
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Disc size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                  <p>No albums available for this artist</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="featured" className="pt-4">
              <div className="text-center py-12 text-muted-foreground">
                <Music size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                <p>Featured songs coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Artist Not Found</h2>
          <p className="text-muted-foreground">The artist you're looking for doesn't exist or has been removed.</p>
        </div>
      )}
    </div>
  );
}