import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Playlist } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ImagePlus, Loader2 } from "lucide-react";

// Define validation schema
const playlistFormSchema = z.object({
  name: z.string().min(1, "Playlist name is required"),
  description: z.string().optional(),
  cover: z.string().optional(),
});

type PlaylistFormValues = z.infer<typeof playlistFormSchema>;

interface PlaylistFormProps {
  playlist?: Playlist;
  onSuccess?: () => void;
}

export function PlaylistForm({ playlist, onSuccess }: PlaylistFormProps) {
  const { toast } = useToast();
  const [coverPreview, setCoverPreview] = useState<string | null>(playlist?.cover || null);
  
  // Initialize form with existing values if editing
  const form = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistFormSchema),
    defaultValues: {
      name: playlist?.name || "",
      description: playlist?.description || "",
      cover: playlist?.cover || "",
    },
  });
  
  // Create or update playlist mutation
  const playlistMutation = useMutation({
    mutationFn: async (values: PlaylistFormValues) => {
      if (playlist) {
        // Update existing playlist
        await apiRequest("PATCH", `/api/playlists/${playlist.id}`, values);
      } else {
        // Create new playlist
        await apiRequest("POST", "/api/playlists", values);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/playlists'] });
      if (playlist) {
        queryClient.invalidateQueries({ queryKey: [`/api/playlists/${playlist.id}`] });
      }
      
      // Show success toast
      toast({
        title: playlist ? "Playlist updated" : "Playlist created",
        description: playlist 
          ? "Your playlist has been updated successfully" 
          : "Your playlist has been created successfully",
      });
      
      // Run success callback
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${playlist ? "update" : "create"} playlist: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: PlaylistFormValues) => {
    playlistMutation.mutate(values);
  };
  
  // Not implementing actual file upload for the cover as it wasn't in the requirements
  // This would just update the form state to show what would happen
  const handleCoverChange = () => {
    // In a real implementation, this would upload the file and get a URL
    // For now, we'll just update the preview with a placeholder
    const placeholderUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop";
    setCoverPreview(placeholderUrl);
    form.setValue("cover", placeholderUrl);
  };
  
  return (
    <div className="space-y-4 py-2 pb-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-center">
          {playlist ? "Edit Playlist" : "Create Playlist"}
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          {playlist 
            ? "Update your playlist information" 
            : "Create a new playlist to organize your music"}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-24 h-24 rounded-md bg-accent flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={handleCoverChange}
            >
              {coverPreview ? (
                <img 
                  src={coverPreview} 
                  alt="Playlist cover preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <ImagePlus className="h-8 w-8 mb-1" />
                  <span className="text-xs text-center">Add Cover</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Click the image to choose playlist cover
              </p>
              <p className="text-xs text-muted-foreground">
                Recommended size: 300x300px
              </p>
            </div>
          </div>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Playlist Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Awesome Playlist" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your playlist..." 
                    {...field} 
                    className="resize-none h-20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={onSuccess}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={playlistMutation.isPending}
            >
              {playlistMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {playlist ? "Save Changes" : "Create Playlist"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
