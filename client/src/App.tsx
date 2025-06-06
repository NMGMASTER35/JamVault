import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { OfflineModeProvider } from "@/hooks/use-offline-mode";
import { AudioProvider } from "@/lib/audioContext";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/lib/protected-route";
import AlbumManagementPage from "@/pages/album-management-page";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LibraryPage from "@/pages/library-page";
import PlaylistPage from "@/pages/playlist-page";
import UploadPage from "@/pages/upload-page";
import SearchPage from "@/pages/search-page";
import ProfilePage from "@/pages/profile-page";
import SongRequestPage from "@/pages/song-request-page";
import StatsPage from "@/pages/stats-page";
import RemotePlayerPage from "@/pages/remote-player-page";
import RemoteControlPage from "@/pages/remote-control-page";
import VisualizerPage from "@/pages/visualizer-page";
import ArtistManagementPage from "@/pages/artist-management-page";
import ArtistProfilePage from "@/pages/artist-profile-page";


function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/library" component={LibraryPage} />
      <ProtectedRoute path="/playlist/:id" component={PlaylistPage} />
      <ProtectedRoute path="/upload" component={UploadPage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/song-request" component={SongRequestPage} />
      <ProtectedRoute path="/stats" component={StatsPage} />
      <ProtectedRoute path="/remote-player" component={RemotePlayerPage} />
      <ProtectedRoute path="/remote-control" component={RemoteControlPage} />
      <ProtectedRoute path="/visualizer" component={VisualizerPage} />
      <ProtectedRoute path="/albums/manage" component={AlbumManagementPage} />
      <ProtectedRoute path="/artists/manage" component={ArtistManagementPage} />
      <ProtectedRoute path="/artists/:id" component={ArtistProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineModeProvider>
          <AudioProvider>
            <Router />
            <Toaster />
          </AudioProvider>
        </OfflineModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;