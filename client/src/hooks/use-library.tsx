import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { Song } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState, useEffect } from "react";

export function useLibrary() {
  const { toast } = useToast();
  const [songIds, setSongIds] = useState<number[]>([]);

  // Get all songs in user's library
  const {
    data: librarySongs = [],
    isLoading: isLoadingLibrary,
    error: libraryError,
  } = useQuery<Song[]>({
    queryKey: ["/api/library"],
  });
  
  // Create a songIds array from the fetched songs
  useEffect(() => {
    if (librarySongs.length > 0) {
      setSongIds(librarySongs.map(song => song.id));
    }
  }, [librarySongs]);
  
  // Create a lookup object for quick status checks
  const libraryStatus = useMemo(() => {
    const statusMap: Record<number, boolean> = {};
    librarySongs.forEach(song => {
      statusMap[song.id] = true;
    });
    return statusMap;
  }, [librarySongs]);

  const addToLibraryMutation = useMutation({
    mutationFn: async (songId: number) => {
      const res = await apiRequest("POST", `/api/library/${songId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      toast({
        title: "Added to Library",
        description: "Song has been added to your library",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to library",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeFromLibraryMutation = useMutation({
    mutationFn: async (songId: number) => {
      await apiRequest("DELETE", `/api/library/${songId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library"] });
      toast({
        title: "Removed from Library",
        description: "Song has been removed from your library",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove from library",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkInLibraryQuery = (songId: number) => {
    return useQuery<{ isInLibrary: boolean }>({
      queryKey: ["/api/library", songId],
      enabled: !!songId,
    });
  };
  
  return {
    librarySongs,
    isLoadingLibrary,
    libraryError,
    addToLibraryMutation,
    removeFromLibraryMutation,
    checkInLibraryQuery,
    libraryStatus,
    songIds
  };
}