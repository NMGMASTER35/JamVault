import { Link, useLocation } from "wouter";
import { Home, Search, Library, Upload } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();
  
  return (
    <div className="md:hidden fixed bottom-[72px] left-0 right-0 bg-card border-t border-border z-10">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center py-3 px-4 ${
            location === "/" ? "text-primary" : "text-muted-foreground"
          }`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/search">
          <a className={`flex flex-col items-center py-3 px-4 ${
            location === "/search" ? "text-primary" : "text-muted-foreground"
          }`}>
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Search</span>
          </a>
        </Link>
        <Link href="/library">
          <a className={`flex flex-col items-center py-3 px-4 ${
            location === "/library" ? "text-primary" : "text-muted-foreground"
          }`}>
            <Library className="h-5 w-5" />
            <span className="text-xs mt-1">Library</span>
          </a>
        </Link>
        <Link href="/upload">
          <a className={`flex flex-col items-center py-3 px-4 ${
            location === "/upload" ? "text-primary" : "text-muted-foreground"
          }`}>
            <Upload className="h-5 w-5" />
            <span className="text-xs mt-1">Upload</span>
          </a>
        </Link>
      </div>
    </div>
  );
}
