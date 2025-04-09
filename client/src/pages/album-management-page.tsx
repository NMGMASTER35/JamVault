import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Album } from "@shared/schema";

export default function AlbumManagementPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false);
  const [albumForm, setAlbumForm] = useState({
    name: "",
    releaseYear: "",
    image: ""
  });

  const { data: albums, isLoading } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
    enabled: !!user?.isAdmin
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (album: { name: string; releaseYear?: string; image?: string }) => {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(album)
      });
      if (!res.ok) throw new Error('Failed to create album');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
      setAlbumForm({ name: "", releaseYear: "", image: "" });
      setIsAddAlbumOpen(false);
      toast({ title: "Album created successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to create album", 
        variant: "destructive" 
      });
    }
  });

  const handleCreateAlbum = () => {
    if (albumForm.name.trim()) {
      createAlbumMutation.mutate(albumForm);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Album Management</h1>
        <Button 
          onClick={() => setIsAddAlbumOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Add Album
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-4 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        ) : albums?.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
              No albums created yet
            </CardContent>
          </Card>
        ) : (
          albums?.map(album => (
            <Card key={album.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{album.name}</h3>
                    {album.releaseYear && (
                      <p className="text-sm text-muted-foreground">
                        Released: {album.releaseYear}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isAddAlbumOpen} onOpenChange={setIsAddAlbumOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Album</DialogTitle>
            <DialogDescription>
              Create a new album by filling out the information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name">Album Name</label>
              <Input
                id="name"
                value={albumForm.name}
                onChange={(e) => setAlbumForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="releaseYear">Release Year</label>
              <Input
                id="releaseYear"
                value={albumForm.releaseYear}
                onChange={(e) => setAlbumForm(prev => ({ ...prev, releaseYear: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="image">Cover Image URL</label>
              <Input
                id="image"
                value={album.image}
                onChange={(e) => setAlbumForm(prev => ({ ...prev, image: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddAlbumOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlbum}>
              Create Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}