import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlaylistForm } from "@/components/music/playlist-form";
import { useQuery } from "@tanstack/react-query";
import { Playlist } from "@shared/schema";
import { useState } from "react";
import {
  Home,
  Search,
  Library,
  PlusSquare,
  Upload,
  User,
  LogOut,
  Music2,
  Loader2,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  
  // Fetch user's playlists for the sidebar
  const { 
    data: playlists, 
    isLoading: isLoadingPlaylists,
  } = useQuery<Playlist[]>({
    queryKey: ['/api/playlists'],
  });
  
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col bg-card border-r border-border">
      {/* App Logo */}
      <div className="flex items-center gap-2 p-4">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
          <Music2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-semibold">SoundStream</h1>
      </div>
      
      {/* Navigation */}
      <nav className="space-y-1 p-4">
        <Link href="/">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/" 
              ? "bg-primary text-primary-foreground font-medium" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}>
            <Home className="h-5 w-5" />
            <span>Home</span>
          </a>
        </Link>
        <Link href="/search">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/search" 
              ? "bg-primary text-primary-foreground font-medium" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}>
            <Search className="h-5 w-5" />
            <span>Search</span>
          </a>
        </Link>
        <Link href="/library">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/library" 
              ? "bg-primary text-primary-foreground font-medium" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}>
            <Library className="h-5 w-5" />
            <span>Your Library</span>
          </a>
        </Link>
      </nav>
      
      <div className="mt-2 px-4 py-3 border-t border-border">
        <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
          <DialogTrigger asChild>
            <a className="flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <PlusSquare className="h-5 w-5" />
              <span>Create Playlist</span>
            </a>
          </DialogTrigger>
          <DialogContent>
            <PlaylistForm onSuccess={() => setIsCreatePlaylistOpen(false)} />
          </DialogContent>
        </Dialog>
        <Link href="/upload">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/upload" 
              ? "bg-primary text-primary-foreground font-medium" 
              : "text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          }`}>
            <Upload className="h-5 w-5" />
            <span>Upload Music</span>
          </a>
        </Link>
      </div>
      
      {/* Playlists */}
      <div className="mt-2 flex-grow overflow-hidden">
        <div className="px-6 mb-2">
          <h2 className="text-sm font-semibold text-muted-foreground">YOUR PLAYLISTS</h2>
        </div>
        <ScrollArea className="h-full">
          <div className="px-2 pb-6">
            {isLoadingPlaylists ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Link href={`/playlist/${playlist.id}`} key={playlist.id}>
                  <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    location === `/playlist/${playlist.id}` 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  }`}>
                    <div className="w-10 h-10 bg-accent rounded-md flex items-center justify-center">
                      <Music2 className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium truncate max-w-[140px]">{playlist.name}</div>
                      <div className="text-xs text-muted-foreground">Playlist</div>
                    </div>
                  </a>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 px-3 text-muted-foreground text-sm">
                No playlists yet
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* User Section */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <User className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="text-sm font-medium truncate">{user?.displayName || user?.username}</div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
