
import { Link, useLocation } from "wouter";
import { Home, Search, Library, Upload, UserCircle, MessageSquare, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="md:hidden fixed bottom-[72px] left-4 right-4 z-50">
      <Menubar className="w-full bg-black/95 backdrop-blur-sm border-neutral-800">
        <MenubarMenu>
          <MenubarTrigger className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              <span>Menu</span>
            </span>
          </MenubarTrigger>
          <MenubarContent className="bg-black/95 backdrop-blur-sm border-neutral-800 w-[calc(100vw-2rem)]">
            <Link href="/">
              <MenubarItem className={location === "/" ? "bg-primary text-primary-foreground" : ""}>
                <Home className="h-5 w-5 mr-2" />
                Home
              </MenubarItem>
            </Link>
            <Link href="/search">
              <MenubarItem className={location === "/search" ? "bg-primary text-primary-foreground" : ""}>
                <Search className="h-5 w-5 mr-2" />
                Search
              </MenubarItem>
            </Link>
            <Link href="/library">
              <MenubarItem className={location === "/library" ? "bg-primary text-primary-foreground" : ""}>
                <Library className="h-5 w-5 mr-2" />
                Library
              </MenubarItem>
            </Link>
            <Link href="/song-request">
              <MenubarItem className={location === "/song-request" ? "bg-primary text-primary-foreground" : ""}>
                <MessageSquare className="h-5 w-5 mr-2" />
                Requests
              </MenubarItem>
            </Link>
            <Link href="/profile">
              <MenubarItem className={location === "/profile" ? "bg-primary text-primary-foreground" : ""}>
                <UserCircle className="h-5 w-5 mr-2" />
                Profile
              </MenubarItem>
            </Link>
            {user?.isAdmin && (
              <Link href="/upload">
                <MenubarItem className={location === "/upload" ? "bg-primary text-primary-foreground" : ""}>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload
                </MenubarItem>
              </Link>
            )}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  );
}
