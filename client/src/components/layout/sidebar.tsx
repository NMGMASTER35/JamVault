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
  UserCircle,
  MessageSquare,
  Clock,
  LineChart,
  BarChart,
  Heart,
  History,
  ListMusic,
  Radio,
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
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col bg-background border-r border-border">
      {/* App Logo */}
      <div className="flex items-center gap-3 p-4">
        <img 
          src="/src/assets/jamvault-logo.png" 
          alt="JamVault Logo" 
          className="h-12 w-12 object-contain" 
        />
        <h1 className="text-xl font-bold gradient-text">JamVault</h1>
      </div>
      
      {/* Main Navigation */}
      <nav className="space-y-1 p-4">
        <Link href="/">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/" 
              ? "bg-primary text-white font-medium" 
              : "text-foreground/80 nav-item"
          }`}>
            <Home className="h-5 w-5" />
            <span>Home</span>
          </a>
        </Link>
        <Link href="/search">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/search" 
              ? "bg-primary text-white font-medium" 
              : "text-foreground/80 nav-item"
          }`}>
            <Search className="h-5 w-5" />
            <span>Search</span>
          </a>
        </Link>
        <Link href="/library">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/library" 
              ? "bg-primary text-white font-medium" 
              : "text-foreground/80 nav-item"
          }`}>
            <Library className="h-5 w-5" />
            <span>Your Library</span>
          </a>
        </Link>
      </nav>
      
      {/* Your Music Section */}
      <div className="px-4 py-2">
        <h3 className="text-xs uppercase font-bold tracking-wider ml-2 mb-2 text-foreground/60">Your Music</h3>
        <div className="space-y-1">
          <Link href="/stats">
            <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              location === "/stats" 
                ? "bg-primary text-white font-medium" 
                : "text-foreground/80 nav-item"
            }`}>
              <BarChart className="h-5 w-5" />
              <span>Stats</span>
            </a>
          </Link>
          <Link href="/visualizer">
            <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              location === "/visualizer" 
                ? "bg-primary text-white font-medium" 
                : "text-foreground/80 nav-item"
            }`}>
              <Radio className="h-5 w-5" />
              <span>Visualizer</span>
            </a>
          </Link>
          <Link href="/library?tab=favorites">
            <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              location === "/library?tab=favorites" 
                ? "bg-primary text-white font-medium" 
                : "text-foreground/80 nav-item"
            }`}>
              <Heart className="h-5 w-5" />
              <span>Favorites</span>
            </a>
          </Link>
          <Link href="/library?tab=recent">
            <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              location === "/library?tab=recent" 
                ? "bg-primary text-white font-medium" 
                : "text-foreground/80 nav-item"
            }`}>
              <History className="h-5 w-5" />
              <span>Recently Played</span>
            </a>
          </Link>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="px-4 py-2 mt-2 border-t border-border">
        <h3 className="text-xs uppercase font-bold tracking-wider ml-2 mb-2 text-foreground/60">Features</h3>
        <div className="space-y-1">
          <Link href="/remote-control">
            <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              location === "/remote-control" 
                ? "bg-primary text-white font-medium" 
                : "text-foreground/80 nav-item"
            }`}>
              <Radio className="h-5 w-5" />
              <span>Remote Control</span>
            </a>
          </Link>
          
          <Link href="/profile">
            <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              location === "/profile" 
                ? "bg-primary text-white font-medium" 
                : "text-foreground/80 nav-item"
            }`}>
              <UserCircle className="h-5 w-5" />
              <span>Your Profile</span>
            </a>
          </Link>
          
          <Link href="/song-request">
            <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              location === "/song-request" 
                ? "bg-primary text-white font-medium" 
                : "text-foreground/80 nav-item"
            }`}>
              <MessageSquare className="h-5 w-5" />
              <span>Song Requests</span>
            </a>
          </Link>
          
          {user?.isAdmin && (
            <Link href="/upload">
              <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                location === "/upload" 
                  ? "bg-primary text-white font-medium" 
                  : "text-foreground/80 nav-item"
              }`}>
                <Upload className="h-5 w-5" />
                <span>Upload Music</span>
              </a>
            </Link>
          )}
        </div>
      </div>
      
      {/* Playlists */}
      <div className="mt-2 flex-grow overflow-hidden border-t border-border">
        <div className="px-6 py-3 flex items-center justify-between">
          <h2 className="text-xs uppercase font-bold tracking-wider text-foreground/60">Playlists</h2>
          <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                <PlusSquare className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <PlaylistForm onSuccess={() => setIsCreatePlaylistOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="h-full">
          <div className="px-2 pb-6">
            {isLoadingPlaylists ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : playlists && playlists.length > 0 ? (
              playlists.map((playlist) => (
                <Link href={`/playlist/${playlist.id}`} key={playlist.id}>
                  <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
                    location === `/playlist/${playlist.id}` 
                      ? "bg-primary text-white font-medium" 
                      : "text-foreground/80 nav-item"
                  }`}>
                    <div className="w-8 h-8 bg-card rounded-md flex items-center justify-center card-hover">
                      <ListMusic className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-sm font-medium truncate max-w-[160px]">{playlist.name}</div>
                  </a>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 px-3 text-foreground/50 text-sm">
                No playlists yet
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* User Section */}
      <div className="mt-auto p-4 border-t border-border">
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm font-medium truncate text-foreground">{user?.displayName || user?.username}</div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="ml-auto text-foreground/60 hover:text-foreground hover:bg-primary/10"
            onClick={() => logoutMutation.mutate()}
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
