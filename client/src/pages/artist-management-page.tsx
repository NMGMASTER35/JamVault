import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Edit, Plus, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Artist } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function ArtistManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isAddArtistOpen, setIsAddArtistOpen] = useState(false);
  const [isEditArtistOpen, setIsEditArtistOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [artistForm, setArtistForm] = useState({
    name: "",
    bio: "",
    image: "",
    genres: [] as string[]
  });
  const [genreInput, setGenreInput] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "Only administrators can access artist management.",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast]);

  // Get all artists
  const { data: artists, isLoading, error } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    enabled: !!user?.isAdmin,
  });

  // Create artist mutation
  const createArtistMutation = useMutation({
    mutationFn: async (artist: {
      name: string;
      bio: string;
      image: string;
      genres: string[];
    }) => {
      const res = await apiRequest("POST", "/api/artists", artist);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast({
        title: "Artist Created",
        description: "The artist has been created successfully.",
      });
      setIsAddArtistOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Artist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update artist mutation
  const updateArtistMutation = useMutation({
    mutationFn: async ({
      id,
      artist,
    }: {
      id: number;
      artist: {
        name: string;
        bio: string;
        image: string;
        genres: string[];
      };
    }) => {
      const res = await apiRequest("PATCH", `/api/artists/${id}`, artist);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast({
        title: "Artist Updated",
        description: "The artist has been updated successfully.",
      });
      setIsEditArtistOpen(false);
      setSelectedArtist(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Artist",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setArtistForm({
      name: "",
      bio: "",
      image: "",
      genres: []
    });
    setGenreInput("");
  };

  const handleEditArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setArtistForm({
      name: artist.name,
      bio: artist.bio || "",
      image: artist.image || "",
      genres: artist.genres || []
    });
    setIsEditArtistOpen(true);
  };

  const handleAddGenre = () => {
    if (genreInput.trim() && !artistForm.genres.includes(genreInput.trim())) {
      setArtistForm({
        ...artistForm,
        genres: [...artistForm.genres, genreInput.trim()]
      });
      setGenreInput("");
    }
  };

  const handleRemoveGenre = (genre: string) => {
    setArtistForm({
      ...artistForm,
      genres: artistForm.genres.filter(g => g !== genre)
    });
  };

  const handleCreateArtist = (e: React.FormEvent) => {
    e.preventDefault();
    createArtistMutation.mutate(artistForm);
  };

  const handleUpdateArtist = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedArtist) {
      updateArtistMutation.mutate({
        id: selectedArtist.id,
        artist: artistForm
      });
    }
  };

  if (!user) {
    return null;
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
          <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Artist Management</h1>
        <Button 
          onClick={() => setIsAddArtistOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Artist
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load artists. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Skeleton className="h-10 w-20" />
              </CardFooter>
            </Card>
          ))
        ) : artists && artists.length > 0 ? (
          artists.map((artist) => (
            <Card key={artist.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{artist.name}</CardTitle>
                <CardDescription>
                  {artist.genres && artist.genres.length > 0 
                    ? artist.genres.join(", ") 
                    : "No genres specified"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {artist.image && (
                    <div className="h-40 overflow-hidden rounded-md">
                      <img 
                        src={artist.image} 
                        alt={artist.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = "https://placehold.co/200x200?text=No+Image")}
                      />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {artist.bio || "No biography available."}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => handleEditArtist(artist)}
                >
                  <Edit size={14} /> Edit
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex justify-center items-center p-8">
            <p className="text-muted-foreground">No artists found. Add your first artist!</p>
          </div>
        )}
      </div>

      {/* Add Artist Dialog */}
      <Dialog open={isAddArtistOpen} onOpenChange={setIsAddArtistOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Artist</DialogTitle>
            <DialogDescription>
              Enter the details of the new artist.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateArtist}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={artistForm.name}
                  onChange={(e) => setArtistForm({ ...artistForm, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="image"
                  value={artistForm.image}
                  onChange={(e) => setArtistForm({ ...artistForm, image: e.target.value })}
                  className="col-span-3"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="bio" className="text-right">
                  Biography
                </Label>
                <Textarea
                  id="bio"
                  value={artistForm.bio}
                  onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })}
                  className="col-span-3"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="genre" className="text-right">
                  Genres
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="genre"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    className="flex-1"
                    placeholder="Add a genre"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGenre();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddGenre} size="sm">
                    Add
                  </Button>
                </div>
              </div>
              {artistForm.genres.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="col-start-2 col-span-3 flex flex-wrap gap-2">
                    {artistForm.genres.map((genre) => (
                      <div 
                        key={genre} 
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {genre}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveGenre(genre)}
                          className="text-secondary-foreground/70 hover:text-secondary-foreground ml-1"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddArtistOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!artistForm.name || createArtistMutation.isPending}
              >
                {createArtistMutation.isPending ? "Creating..." : "Create Artist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Artist Dialog */}
      <Dialog open={isEditArtistOpen} onOpenChange={setIsEditArtistOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Artist</DialogTitle>
            <DialogDescription>
              Update the details of this artist.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateArtist}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={artistForm.name}
                  onChange={(e) => setArtistForm({ ...artistForm, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-image" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="edit-image"
                  value={artistForm.image}
                  onChange={(e) => setArtistForm({ ...artistForm, image: e.target.value })}
                  className="col-span-3"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="edit-bio" className="text-right">
                  Biography
                </Label>
                <Textarea
                  id="edit-bio"
                  value={artistForm.bio}
                  onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })}
                  className="col-span-3"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-genre" className="text-right">
                  Genres
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="edit-genre"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    className="flex-1"
                    placeholder="Add a genre"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGenre();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddGenre} size="sm">
                    Add
                  </Button>
                </div>
              </div>
              {artistForm.genres.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="col-start-2 col-span-3 flex flex-wrap gap-2">
                    {artistForm.genres.map((genre) => (
                      <div 
                        key={genre} 
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {genre}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveGenre(genre)}
                          className="text-secondary-foreground/70 hover:text-secondary-foreground ml-1"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditArtistOpen(false);
                  setSelectedArtist(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!artistForm.name || updateArtistMutation.isPending}
              >
                {updateArtistMutation.isPending ? "Updating..." : "Update Artist"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
            </div>
          </main>
        </div>
      </div>
    );
}