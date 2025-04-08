import { Link, useLocation } from "wouter";
import { Home, Search, Library, Upload, UserCircle, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="md:hidden fixed bottom-[72px] left-0 right-0 bg-black border-t border-neutral-800 z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center py-3 px-2 ${
            location === "/" ? "text-primary" : "text-muted-foreground"
          }`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/search">
          <a className={`flex flex-col items-center py-3 px-2 ${
            location === "/search" ? "text-primary" : "text-muted-foreground"
          }`}>
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Search</span>
          </a>
        </Link>
        <Link href="/library">
          <a className={`flex flex-col items-center py-3 px-2 ${
            location === "/library" ? "text-primary" : "text-muted-foreground"
          }`}>
            <Library className="h-5 w-5" />
            <span className="text-xs mt-1">Library</span>
          </a>
        </Link>
        <Link href="/song-request">
          <a className={`flex flex-col items-center py-3 px-2 ${
            location === "/song-request" ? "text-primary" : "text-muted-foreground"
          }`}>
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Requests</span>
          </a>
        </Link>
        <Link href="/profile">
          <a className={`flex flex-col items-center py-3 px-2 ${
            location === "/profile" ? "text-primary" : "text-muted-foreground"
          }`}>
            <UserCircle className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
        {user?.isAdmin && (
          <Link href="/upload">
            <a className={`flex flex-col items-center py-3 px-2 ${
              location === "/upload" ? "text-primary" : "text-muted-foreground"
            }`}>
              <Upload className="h-5 w-5" />
              <span className="text-xs mt-1">Upload</span>
            </a>
          </Link>
        )}
      </div>
    </div>
  );
}
