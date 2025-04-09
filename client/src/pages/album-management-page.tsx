import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Edit, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Album } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default function AlbumManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false);
  const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumForm, setAlbumForm] = useState({
    name: "",
    releaseYear: "",
    image: ""
  });

  const { data: albums, isLoading, error } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
    enabled: !!user?.isAdmin,
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (album: { name: string; releaseYear?: string; image?: string }) => {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(album),
      });
      if (!res.ok) throw new Error('Failed to create album');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      toast({
        title: "Album Created",
        description: "The album has been created successfully.",
      });
      setIsAddAlbumOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Album",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAlbumMutation = useMutation({
    mutationFn: async ({
      id,
      album,
    }: {
      id: number;
      album: { name: string; releaseYear?: string; image?: string };
    }) => {
      const res = await fetch(`/api/albums/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(album),
      });
      if (!res.ok) throw new Error('Failed to update album');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      toast({
        title: "Album Updated",
        description: "The album has been updated successfully.",
      });
      setIsEditAlbumOpen(false);
      setSelectedAlbum(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Album",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAlbumForm({
      name: "",
      releaseYear: "",
      image: ""
    });
  };

  const handleEditAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setAlbumForm({
      name: album.name,
      releaseYear: album.releaseYear?.toString() || "",
      image: album.image || ""
    });
    setIsEditAlbumOpen(true);
  };

  const handleCreateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    createAlbumMutation.mutate(albumForm);
  };

  const handleUpdateAlbum = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAlbum) {
      updateAlbumMutation.mutate({
        id: selectedAlbum.id,
        album: albumForm
      });
    }
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <div className="flex h-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-32 relative">
          <TopBar />
          <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Album Management</h1>
              <Button 
                onClick={() => setIsAddAlbumOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} /> Add Album
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load albums. Please try again.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : albums && albums.length > 0 ? (
                albums.map((album) => (
                  <Card key={album.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle>{album.name}</CardTitle>
                      <CardDescription>
                        Release Year: {album.releaseYear || "Not specified"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        {album.image && (
                          <div className="h-40 overflow-hidden rounded-md">
                            <img 
                              src={album.image} 
                              alt={album.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.src = "https://placehold.co/200x200?text=No+Image")}
                            />
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => handleEditAlbum(album)}
                        >
                          <Edit size={14} /> Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex justify-center items-center p-8">
                  <p className="text-muted-foreground">No albums found. Add your first album!</p>
                </div>
              )}
            </div>

            <Dialog open={isAddAlbumOpen} onOpenChange={setIsAddAlbumOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Album</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new album.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAlbum}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={albumForm.name}
                        onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="year" className="text-right">
                        Release Year
                      </Label>
                      <Input
                        id="year"
                        type="number"
                        value={albumForm.releaseYear}
                        onChange={(e) => setAlbumForm({ ...albumForm, releaseYear: e.target.value })}
                        className="col-span-3"
                        placeholder="YYYY"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="image" className="text-right">
                        Image URL
                      </Label>
                      <Input
                        id="image"
                        value={albumForm.image}
                        onChange={(e) => setAlbumForm({ ...albumForm, image: e.target.value })}
                        className="col-span-3"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsAddAlbumOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!albumForm.name || createAlbumMutation.isPending}
                    >
                      {createAlbumMutation.isPending ? "Creating..." : "Create Album"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isEditAlbumOpen} onOpenChange={setIsEditAlbumOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Album</DialogTitle>
                  <DialogDescription>
                    Update the details of this album.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateAlbum}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="edit-name"
                        value={albumForm.name}
                        onChange={(e) => setAlbumForm({ ...albumForm, name: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-year" className="text-right">
                        Release Year
                      </Label>
                      <Input
                        id="edit-year"
                        type="number"
                        value={albumForm.releaseYear}
                        onChange={(e) => setAlbumForm({ ...albumForm, releaseYear: e.target.value })}
                        className="col-span-3"
                        placeholder="YYYY"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-image" className="text-right">
                        Image URL
                      </Label>
                      <Input
                        id="edit-image"
                        value={albumForm.image}
                        onChange={(e) => setAlbumForm({ ...albumForm, image: e.target.value })}
                        className="col-span-3"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditAlbumOpen(false);
                        setSelectedAlbum(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={!albumForm.name || updateAlbumMutation.isPending}
                    >
                      {updateAlbumMutation.isPending ? "Updating..." : "Update Album"}
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