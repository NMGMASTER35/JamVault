import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useOfflineMode } from "@/hooks/use-offline-mode";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Upload,
  User,
  LogOut,
  UserCircle,
  Settings,
  MessageSquare,
  Wifi,
  WifiOff,
  BarChart,
  LineChart,
} from "lucide-react";

export function TopBar() {
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { user, logoutMutation } = useAuth();
  const { isOffline, setOfflineMode } = useOfflineMode();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate("/search");
    }
  };

  // Add dark mode class to body on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-4 py-3 border-b border-border flex items-center gap-3">
      {/* Mobile menu button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent/10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-background border-r border-border">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* App Logo for mobile */}
      <div className="md:hidden flex items-center gap-2">
        <img 
          src="/src/assets/jamvault-logo.png" 
          alt="JamVault Logo" 
          className="h-9 w-9 object-contain" 
        />
        <h1 className="text-lg font-bold gradient-text">JamVault</h1>
      </div>

      {/* Navigation buttons */}
      <div className="hidden sm:flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => window.history.forward()}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <form 
        className="relative flex-grow max-w-md"
        onSubmit={handleSearch}
      >
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          className="bg-card pl-10 pr-4 py-2 text-sm border border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {/* Stats button */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:flex"
        title="Your Stats"
        onClick={() => navigate("/stats")}
      >
        <BarChart className="h-5 w-5" />
      </Button>


      {/* Upload button - admin only */}
      {user?.isAdmin && (
        <Button 
          className="hidden sm:flex items-center gap-2"
          onClick={() => navigate("/upload")}
          variant="outline"
        >
          <Upload className="h-4 w-4" />
          <span>Upload</span>
        </Button>
      )}

      {/* Offline mode indicator */}
      {isOffline && (
        <div className="hidden sm:flex items-center gap-2 ml-1 text-amber-500 bg-amber-950/30 px-3 py-1 rounded-full text-sm">
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline</span>
        </div>
      )}

      {/* User menu */}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-9 w-9 bg-card hover:bg-card/90"
            >
              <UserCircle className="h-5 w-5 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName || user?.username}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/stats")}>
                <BarChart className="mr-2 h-4 w-4" />
                <span>Stats</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/song-request")}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Song Requests</span>
              </DropdownMenuItem>
              {user?.isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/upload")}>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload Music</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setOfflineMode(!isOffline)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {isOffline ? (
                    <WifiOff className="mr-2 h-4 w-4 text-amber-500" />
                  ) : (
                    <Wifi className="mr-2 h-4 w-4" />
                  )}
                  <span>Offline Mode</span>
                </div>
                <Switch
                  checked={isOffline}
                  onCheckedChange={setOfflineMode}
                  className="ml-2"
                />
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}