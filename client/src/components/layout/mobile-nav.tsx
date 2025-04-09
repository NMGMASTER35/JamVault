
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
    <div className="md:hidden fixed top-4 left-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="bg-background/95 backdrop-blur-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-sm">
          <Link href="/">
            <DropdownMenuItem>
              <Home className="h-5 w-5 mr-2" />
              Home
            </DropdownMenuItem>
          </Link>
          <Link href="/search">
            <DropdownMenuItem>
              <Search className="h-5 w-5 mr-2" />
              Search
            </DropdownMenuItem>
          </Link>
          <Link href="/library">
            <DropdownMenuItem>
              <Library className="h-5 w-5 mr-2" />
              Library
            </DropdownMenuItem>
          </Link>
          <Link href="/song-request">
            <DropdownMenuItem>
              <MessageSquare className="h-5 w-5 mr-2" />
              Requests
            </DropdownMenuItem>
          </Link>
          <Link href="/profile">
            <DropdownMenuItem>
              <UserCircle className="h-5 w-5 mr-2" />
              Profile
            </DropdownMenuItem>
          </Link>
          {user?.isAdmin && (
            <>
              <Link href="/upload">
                <DropdownMenuItem>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Music
                </DropdownMenuItem>
              </Link>
              <Link href="/album-management">
                <DropdownMenuItem>
                  <AlbumIcon className="h-5 w-5 mr-2" />
                  Manage Albums
                </DropdownMenuItem>
              </Link>
            </>
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
