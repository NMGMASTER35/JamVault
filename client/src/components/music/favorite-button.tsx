import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FavoriteButtonProps {
  songId: number;
  variant?: "default" | "ghost" | "outline" | "secondary" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function FavoriteButton({ songId, variant = "ghost", size = "icon" }: FavoriteButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get favorite status for this song
  const { data, isLoading } = useQuery<{ isFavorite: boolean }>({
    queryKey: ['/api/favorites', songId],
    queryFn: async () => {
      const res = await fetch(`/api/favorites/${songId}`);
      if (!res.ok) throw new Error("Failed to fetch favorite status");
      return res.json();
    },
  });
  
  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (data?.isFavorite) {
        // Remove from favorites
        await apiRequest("DELETE", `/api/favorites/${songId}`);
      } else {
        // Add to favorites
        await apiRequest("POST", `/api/favorites/${songId}`);
      }
    },
    onSuccess: () => {
      // Update both the single item query and the favorites list
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      
      // Update UI immediately
      queryClient.setQueryData(
        ['/api/favorites', songId], 
        { isFavorite: !data?.isFavorite }
      );
      
      // Show toast
      toast({
        title: data?.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: data?.isFavorite 
          ? "Song has been removed from your favorites" 
          : "Song has been added to your favorites",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${data?.isFavorite ? 'remove from' : 'add to'} favorites. ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const isFavorite = data?.isFavorite || false;
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavoriteMutation.mutate();
      }}
      disabled={isLoading || toggleFavoriteMutation.isPending}
      className="group"
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart 
        className={`h-5 w-5 transition-colors 
          ${isFavorite 
            ? 'text-red-500 fill-red-500' 
            : 'text-muted-foreground group-hover:text-red-500'}`} 
      />
    </Button>
  );
}