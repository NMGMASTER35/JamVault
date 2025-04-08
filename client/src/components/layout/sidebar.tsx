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
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col bg-black border-r border-neutral-800">
      {/* App Logo */}
      <div className="flex items-center gap-3 p-4">
        <img 
          src="/src/assets/jamvault-logo.png" 
          alt="JamVault Logo" 
          className="h-12 w-12 object-contain" 
        />
        <h1 className="text-xl font-bold gradient-text">JamVault</h1>
      </div>
      
      {/* Navigation */}
      <nav className="space-y-1 p-4">
        <Link href="/">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/" 
              ? "bg-primary text-white font-medium" 
              : "text-gray-300 nav-item"
          }`}>
            <Home className="h-5 w-5" />
            <span>Home</span>
          </a>
        </Link>
        <Link href="/search">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/search" 
              ? "bg-primary text-white font-medium" 
              : "text-gray-300 nav-item"
          }`}>
            <Search className="h-5 w-5" />
            <span>Search</span>
          </a>
        </Link>
        <Link href="/library">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/library" 
              ? "bg-primary text-white font-medium" 
              : "text-gray-300 nav-item"
          }`}>
            <Library className="h-5 w-5" />
            <span>Your Library</span>
          </a>
        </Link>
      </nav>
      
      <div className="mt-2 px-4 py-3 border-t border-neutral-800">
        <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
          <DialogTrigger asChild>
            <a className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-300 nav-item cursor-pointer">
              <PlusSquare className="h-5 w-5" />
              <span>Create Playlist</span>
            </a>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-neutral-800">
            <PlaylistForm onSuccess={() => setIsCreatePlaylistOpen(false)} />
          </DialogContent>
        </Dialog>
        
        <Link href="/song-request">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/song-request" 
              ? "bg-primary text-white font-medium" 
              : "text-gray-300 nav-item"
          }`}>
            <MessageSquare className="h-5 w-5" />
            <span>Song Requests</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
            location === "/profile" 
              ? "bg-primary text-white font-medium" 
              : "text-gray-300 nav-item"
          }`}>
            <UserCircle className="h-5 w-5" />
            <span>Your Profile</span>
          </a>
        </Link>
        
        {user?.isAdmin && (
          <Link href="/upload">
            <a className={`flex items-center gap-3 px-3 py-2 rounded-md ${
              location === "/upload" 
                ? "bg-primary text-white font-medium" 
                : "text-gray-300 nav-item"
            }`}>
              <Upload className="h-5 w-5" />
              <span>Upload Music</span>
            </a>
          </Link>
        )}
      </div>
      
      {/* Playlists */}
      <div className="mt-2 flex-grow overflow-hidden">
        <div className="px-6 mb-2">
          <h2 className="text-sm font-bold text-gray-400">YOUR PLAYLISTS</h2>
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
                      : "text-gray-300 nav-item"
                  }`}>
                    <div className="w-10 h-10 bg-neutral-800 rounded-md flex items-center justify-center card-hover">
                      <Music2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium truncate max-w-[140px]">{playlist.name}</div>
                      <div className="text-xs text-gray-400">Playlist</div>
                    </div>
                  </a>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 px-3 text-gray-400 text-sm">
                No playlists yet
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* User Section */}
      <div className="mt-auto p-4 border-t border-neutral-800">
        <div className="flex items-center gap-3 p-2">
          <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm font-medium truncate text-white">{user?.displayName || user?.username}</div>
          <Button 
            size="icon" 
            variant="ghost" 
            className="ml-auto text-gray-400 hover:text-white hover:bg-neutral-800"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
