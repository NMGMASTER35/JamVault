import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Album } from "@shared/schema";

export default function AlbumManagementPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAlbumName, setNewAlbumName] = useState("");

  const { data: albums, isLoading } = useQuery<Album[]>({
    queryKey: ['/api/albums'],
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to create album');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/albums'] });
      setNewAlbumName("");
      toast({ title: "Album created successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to create album", 
        variant: "destructive" 
      });
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Album Management</h1>
        <Button className="flex items-center gap-2" onClick={() => {
          if (newAlbumName.trim()) {
            createAlbumMutation.mutate(newAlbumName.trim());
          }
        }}>
          <Plus size={16} /> Add Album
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-4">Loading albums...</CardContent>
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
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{album.name}</h3>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}