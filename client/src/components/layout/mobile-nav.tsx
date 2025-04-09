
import { Link, useLocation } from "wouter";
import { Home, Search, Library, Upload, UserCircle, MessageSquare, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="md:hidden fixed top-2 left-2 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-sm border-border">
          <Link href="/">
            <DropdownMenuItem className={location === "/" ? "bg-primary/10" : ""}>
              <Home className="h-5 w-5 mr-2" />
              Home
            </DropdownMenuItem>
          </Link>
          <Link href="/search">
            <DropdownMenuItem className={location === "/search" ? "bg-primary/10" : ""}>
              <Search className="h-5 w-5 mr-2" />
              Search
            </DropdownMenuItem>
          </Link>
          <Link href="/library">
            <DropdownMenuItem className={location === "/library" ? "bg-primary/10" : ""}>
              <Library className="h-5 w-5 mr-2" />
              Library
            </DropdownMenuItem>
          </Link>
          <Link href="/song-request">
            <DropdownMenuItem className={location === "/song-request" ? "bg-primary/10" : ""}>
              <MessageSquare className="h-5 w-5 mr-2" />
              Requests
            </DropdownMenuItem>
          </Link>
          <Link href="/profile">
            <DropdownMenuItem className={location === "/profile" ? "bg-primary/10" : ""}>
              <UserCircle className="h-5 w-5 mr-2" />
              Profile
            </DropdownMenuItem>
          </Link>
          {user?.isAdmin && (
            <Link href="/upload">
              <DropdownMenuItem className={location === "/upload" ? "bg-primary/10" : ""}>
                <Upload className="h-5 w-5 mr-2" />
                Upload
              </DropdownMenuItem>
            </Link>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
