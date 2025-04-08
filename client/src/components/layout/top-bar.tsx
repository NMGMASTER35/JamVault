import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Upload,
  User,
} from "lucide-react";

export function TopBar() {
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate("/search");
    }
  };
  
  return (
    <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm px-4 py-3 border-b border-border flex items-center gap-3">
      {/* Mobile menu button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
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
          className="bg-accent pl-10 pr-4 py-2 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>
      
      {/* Upload button */}
      <Button 
        className="hidden sm:flex items-center gap-2"
        onClick={() => navigate("/upload")}
      >
        <Upload className="h-4 w-4" />
        <span>Upload</span>
      </Button>
      
      {/* User menu (mobile only) */}
      <div className="md:hidden">
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
