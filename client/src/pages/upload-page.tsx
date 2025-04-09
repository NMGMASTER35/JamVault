import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AudioPlayer } from "@/components/music/audio-player";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UploadForm } from "@/components/music/upload-form";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function UploadPage() {
  const [, navigate] = useLocation();
  return (
    <div className="bg-background text-foreground flex flex-col h-screen overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-32 relative">
          {/* Top Bar */}
          <TopBar />

          {/* Page Content */}
          <div className="p-6">
            <div className="flex items-center mb-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="mr-4"
                size="sm"
              >
                Back
              </Button>
            </div>
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold">Upload Music</h1>
                <p className="text-muted-foreground mt-2">Add MP3 files to your library</p>
              </div>
              <Button 
                onClick={() => navigate('/artists/manage')}
                variant="outline"
                className="flex items-center gap-2"
              >
                Manage Artists
              </Button>
            </div>
            
            <UploadForm />
          </div>
        </main>
      </div>

      {/* Audio Player */}
      <AudioPlayer />

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
