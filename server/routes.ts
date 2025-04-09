import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";

// Add global type declaration for remote tokens
declare global {
  var __remote_tokens: {
    [key: string]: {
      userId: number;
      username: string;
      expires: number;
    }
  };
}
import { storage } from "./storage";
import { setupUpload } from "./multer";
import fs from "fs";
import path from "path";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { 
  insertPlaylistSchema, 
  insertPlaylistSongSchema, 
  insertSongRequestSchema, 
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
  passwordSchema,
  insertShortLinkSchema,
  insertAlbumSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup auth routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // Setup file upload middleware
  const upload = setupUpload();
  
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Song routes
  app.get("/api/songs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    // Return all songs for everyone
    const songs = await storage.getAllSongs();
    return res.json(songs);
  });
  
  app.get("/api/songs/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const song = await storage.getSong(parseInt(req.params.id));
    if (!song) return res.status(404).send("Song not found");
    
    return res.json(song);
  });
  
  app.post("/api/songs", upload.single("file"), async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.user.isAdmin) return res.status(403).send("Only administrators can upload songs");
    if (!req.file) return res.status(400).send("No file uploaded");
    
    const { title, artist, album, duration, cover, genre, year, lyrics } = req.body;
    
    const song = await storage.createSong({
      title,
      artist,
      album: album || null,
      duration: parseInt(duration),
      cover: cover || null,
      filePath: req.file.path,
      userId: req.user.id,
      genre: genre || null,
      year: year ? parseInt(year) : null,
      lyrics: lyrics || null,
      artistId: null, // For now, we're not linking to artist records
      playCount: 0,
    });
    
    return res.status(201).json(song);
  });
  
  app.delete("/api/songs/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.user.isAdmin) return res.status(403).send("Only administrators can delete songs");
    
    const song = await storage.getSong(parseInt(req.params.id));
    if (!song) return res.status(404).send("Song not found");
    
    // Delete the file
    try {
      if (fs.existsSync(song.filePath)) {
        fs.unlinkSync(song.filePath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
    
    const success = await storage.deleteSong(song.id);
    if (success) {
      return res.status(204).send();
    } else {
      return res.status(500).send("Failed to delete song");
    }
  });
  
  // Stream song file
  app.get("/api/songs/:id/stream", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const song = await storage.getSong(parseInt(req.params.id));
    if (!song) return res.status(404).send("Song not found");
    
    if (!fs.existsSync(song.filePath)) {
      return res.status(404).send("File not found");
    }
    
    const stat = fs.statSync(song.filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(song.filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      });
      
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      });
      
      fs.createReadStream(song.filePath).pipe(res);
    }
  });
  
  // Playlist routes
  app.get("/api/playlists", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const playlists = await storage.getPlaylistsByUser(req.user.id);
    return res.json(playlists);
  });
  
  app.get("/api/playlists/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const playlist = await storage.getPlaylist(parseInt(req.params.id));
    if (!playlist) return res.status(404).send("Playlist not found");
    
    if (playlist.userId !== req.user.id) {
      return res.status(403).send("Forbidden");
    }
    
    return res.json(playlist);
  });
  
  app.post("/api/playlists", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const validatedData = insertPlaylistSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      const playlist = await storage.createPlaylist(validatedData);
      return res.status(201).json(playlist);
    } catch (error) {
      return res.status(400).json({ error: "Invalid playlist data" });
    }
  });
  
  app.patch("/api/playlists/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const playlist = await storage.getPlaylist(parseInt(req.params.id));
    if (!playlist) return res.status(404).send("Playlist not found");
    
    if (playlist.userId !== req.user.id) {
      return res.status(403).send("Forbidden");
    }
    
    const updatedPlaylist = await storage.updatePlaylist(playlist.id, req.body);
    return res.json(updatedPlaylist);
  });
  
  app.delete("/api/playlists/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const playlist = await storage.getPlaylist(parseInt(req.params.id));
    if (!playlist) return res.status(404).send("Playlist not found");
    
    if (playlist.userId !== req.user.id) {
      return res.status(403).send("Forbidden");
    }
    
    const success = await storage.deletePlaylist(playlist.id);
    if (success) {
      return res.status(204).send();
    } else {
      return res.status(500).send("Failed to delete playlist");
    }
  });
  
  // Playlist song management
  app.get("/api/playlists/:id/songs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const playlist = await storage.getPlaylist(parseInt(req.params.id));
    if (!playlist) return res.status(404).send("Playlist not found");
    
    if (playlist.userId !== req.user.id) {
      return res.status(403).send("Forbidden");
    }
    
    const songs = await storage.getPlaylistSongs(playlist.id);
    return res.json(songs);
  });
  
  app.post("/api/playlists/:id/songs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const playlistId = parseInt(req.params.id);
    const playlist = await storage.getPlaylist(playlistId);
    if (!playlist) return res.status(404).send("Playlist not found");
    
    if (playlist.userId !== req.user.id) {
      return res.status(403).send("Forbidden");
    }
    
    try {
      const validatedData = insertPlaylistSongSchema.parse({
        playlistId: playlistId,
        songId: req.body.songId,
      });
      
      // Validate song exists
      const song = await storage.getSong(validatedData.songId);
      if (!song) return res.status(404).send("Song not found");
      
      const playlistSong = await storage.addSongToPlaylist(validatedData.playlistId, validatedData.songId);
      return res.status(201).json(playlistSong);
    } catch (error) {
      return res.status(400).json({ error: "Invalid data" });
    }
  });
  
  app.delete("/api/playlists/:playlistId/songs/:songId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const playlistId = parseInt(req.params.playlistId);
    const songId = parseInt(req.params.songId);
    
    const playlist = await storage.getPlaylist(playlistId);
    if (!playlist) return res.status(404).send("Playlist not found");
    
    if (playlist.userId !== req.user.id) {
      return res.status(403).send("Forbidden");
    }
    
    const success = await storage.removeSongFromPlaylist(playlistId, songId);
    if (success) {
      return res.status(204).send();
    } else {
      return res.status(404).send("Song not in playlist");
    }
  });

  // Favorites routes
  app.get("/api/favorites", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const songs = await storage.getFavoritesByUser(req.user.id);
    res.json(songs);
  });
  
  app.post("/api/favorites/:songId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const songId = parseInt(req.params.songId);
    
    // Check if the song exists
    const song = await storage.getSong(songId);
    if (!song) {
      return res.status(404).send("Song not found");
    }
    
    const favorite = await storage.addToFavorites(req.user.id, songId);
    res.status(201).json(favorite);
  });
  
  app.delete("/api/favorites/:songId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const songId = parseInt(req.params.songId);
    
    const result = await storage.removeFromFavorites(req.user.id, songId);
    if (result) {
      res.status(204).send();
    } else {
      res.status(404).send("Song not found in favorites");
    }
  });
  
  app.get("/api/favorites/:songId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const songId = parseInt(req.params.songId);
    
    const isFavorite = await storage.isFavorite(req.user.id, songId);
    res.json({ isFavorite });
  });

  // Recently added songs - make sure this endpoint comes AFTER /api/songs/:id handlers
  app.get("/api/songs/recent", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const songs = await storage.getRecentlyAddedSongs(limit);
      return res.json(songs);
    } catch (error) {
      console.error("Error fetching recent songs:", error);
      return res.status(500).send("Error fetching recent songs");
    }
  });
  
  // User's personal library (just songs they've added to their library)
  app.get("/api/library", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const songs = await storage.getUserLibrary(req.user.id);
      return res.json(songs);
    } catch (error) {
      console.error("Error fetching user library:", error);
      return res.status(500).send("Error fetching user library");
    }
  });
  
  // Add a song to user's library
  app.post("/api/library/:songId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const songId = parseInt(req.params.songId);
      const song = await storage.getSong(songId);
      
      if (!song) {
        return res.status(404).send("Song not found");
      }
      
      const libraryEntry = await storage.addToLibrary(req.user.id, songId);
      return res.status(201).json(libraryEntry);
    } catch (error) {
      console.error("Error adding to library:", error);
      return res.status(500).send("Error adding to library");
    }
  });
  
  // Remove a song from user's library
  app.delete("/api/library/:songId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const songId = parseInt(req.params.songId);
      const success = await storage.removeFromLibrary(req.user.id, songId);
      
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(404).send("Song not found in library");
      }
    } catch (error) {
      console.error("Error removing from library:", error);
      return res.status(500).send("Error removing from library");
    }
  });
  
  // Check if a song is in user's library
  app.get("/api/library/:songId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const songId = parseInt(req.params.songId);
      const isInLibrary = await storage.isInLibrary(req.user.id, songId);
      return res.json({ isInLibrary });
    } catch (error) {
      console.error("Error checking library status:", error);
      return res.status(500).send("Error checking library status");
    }
  });

  // Album routes
  app.get("/api/albums", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const albums = await storage.getAllAlbums();
      return res.json(albums);
    } catch (error) {
      console.error("Error fetching albums:", error);
      return res.status(500).send("Error fetching albums");
    }
  });
  
  app.get("/api/albums/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const albumId = parseInt(req.params.id);
      const album = await storage.getAlbum(albumId);
      
      if (!album) {
        return res.status(404).send("Album not found");
      }
      
      return res.json(album);
    } catch (error) {
      console.error("Error fetching album:", error);
      return res.status(500).send("Error fetching album");
    }
  });
  
  app.get("/api/albums/:id/songs", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const albumId = parseInt(req.params.id);
      const songs = await storage.getSongsByAlbum(albumId);
      return res.json(songs);
    } catch (error) {
      console.error("Error fetching album songs:", error);
      return res.status(500).send("Error fetching album songs");
    }
  });
  
  app.get("/api/artists/:id/albums", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const artistId = parseInt(req.params.id);
      const albums = await storage.getAlbumsByArtist(artistId);
      return res.json(albums);
    } catch (error) {
      console.error("Error fetching artist albums:", error);
      return res.status(500).send("Error fetching artist albums");
    }
  });
  
  app.post("/api/albums", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.user.isAdmin) return res.status(403).send("Only administrators can create albums");
    
    try {
      const validatedData = insertAlbumSchema.parse(req.body);
      const album = await storage.createAlbum(validatedData);
      return res.status(201).json(album);
    } catch (error) {
      console.error("Error creating album:", error);
      return res.status(400).json({ error: "Invalid album data" });
    }
  });
  
  app.patch("/api/albums/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.user.isAdmin) return res.status(403).send("Only administrators can update albums");
    
    try {
      const albumId = parseInt(req.params.id);
      const album = await storage.getAlbum(albumId);
      
      if (!album) {
        return res.status(404).send("Album not found");
      }
      
      const updatedAlbum = await storage.updateAlbum(albumId, req.body);
      return res.json(updatedAlbum);
    } catch (error) {
      console.error("Error updating album:", error);
      return res.status(500).send("Error updating album");
    }
  });
  
  app.delete("/api/albums/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.user.isAdmin) return res.status(403).send("Only administrators can delete albums");
    
    try {
      const albumId = parseInt(req.params.id);
      const album = await storage.getAlbum(albumId);
      
      if (!album) {
        return res.status(404).send("Album not found");
      }
      
      const success = await storage.deleteAlbum(albumId);
      
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(500).send("Failed to delete album");
      }
    } catch (error) {
      console.error("Error deleting album:", error);
      return res.status(500).send("Error deleting album");
    }
  });

  // User profile routes
  app.get("/api/profile", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(404).send("User not found");
    
    // Don't send password
    const { password, ...safeUser } = user;
    return res.json(safeUser);
  });
  
  // User listening stats
  app.get("/api/user/stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const userId = req.user.id;
    
    try {
      // Fetch user listening statistics from storage
      const stats = await storage.getUserListeningStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).send("Error fetching listening statistics");
    }
  });

  app.patch("/api/profile", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      
      if (!user) return res.status(404).send("User not found");
      
      // If changing password, verify current password
      if (validatedData.newPassword) {
        // Verify current password is correct
        const scryptAsync = promisify(scrypt);
        const [hashedPassword, salt] = user.password.split('.');
        const hashedBuffer = Buffer.from(hashedPassword, 'hex');
        const suppliedBuffer = (await scryptAsync(validatedData.currentPassword, salt, 64)) as Buffer;
        
        const passwordsMatch = timingSafeEqual(hashedBuffer, suppliedBuffer);
        
        if (!passwordsMatch) {
          return res.status(400).json({ 
            error: "Current password is incorrect",
            field: "currentPassword" 
          });
        }
        
        // Update the password
        await storage.updatePassword(user.id, validatedData.newPassword);
      }
      
      // Update other profile fields
      const updates: any = {};
      if (validatedData.displayName) updates.displayName = validatedData.displayName;
      if (validatedData.firstName) updates.firstName = validatedData.firstName;
      if (validatedData.lastName) updates.lastName = validatedData.lastName;
      if (validatedData.bio) updates.bio = validatedData.bio;
      if (validatedData.email) updates.email = validatedData.email;
      if (validatedData.profileImage) updates.profileImage = validatedData.profileImage;
      if (validatedData.dateOfBirth) updates.dateOfBirth = validatedData.dateOfBirth;
      if (validatedData.favoriteArtists) updates.favoriteArtists = validatedData.favoriteArtists;
      if (validatedData.favoriteSongs) updates.favoriteSongs = validatedData.favoriteSongs;
      
      if (Object.keys(updates).length > 0) {
        await storage.updateUser(user.id, updates);
      }
      
      // Get updated user
      const updatedUser = await storage.getUser(user.id);
      if (!updatedUser) return res.status(404).send("User not found");
      
      // Don't send password
      const { password, ...safeUser } = updatedUser;
      return res.json(safeUser);
      
    } catch (error) {
      return res.status(400).json({ error: "Invalid profile data" });
    }
  });

  // Password reset routes
  app.post("/api/password-reset/request", async (req: Request, res: Response) => {
    try {
      const { email } = requestPasswordResetSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.status(200).json({ message: "If your email is associated with an account, you will receive a password reset link shortly." });
      }
      
      // Generate reset token
      const token = await storage.createPasswordResetToken(user.id);
      
      // In a real application, send an email with the reset link
      // For demo purposes, just return the token in the response
      return res.status(200).json({ 
        message: "If your email is associated with an account, you will receive a password reset link shortly.",
        // In a real app, don't include the token in the response
        // This is for demo purposes only
        token: token
      });
      
    } catch (error) {
      return res.status(400).json({ error: "Invalid email" });
    }
  });

  app.post("/api/password-reset/reset", async (req: Request, res: Response) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      // Validate token
      const user = await storage.validatePasswordResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      
      // Update password
      await storage.updatePassword(user.id, password);
      
      return res.status(200).json({ message: "Password updated successfully" });
      
    } catch (error) {
      return res.status(400).json({ error: "Invalid reset request" });
    }
  });

  // Song request routes
  app.get("/api/song-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    // If admin, return all requests, otherwise return only user's requests
    const requests = req.user.isAdmin 
      ? await storage.getAllSongRequests()
      : await storage.getSongRequestsByUser(req.user.id);
      
    return res.json(requests);
  });

  app.get("/api/song-requests/pending", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.user.isAdmin) return res.status(403).send("Only administrators can view pending song requests");
    
    const requests = await storage.getPendingSongRequests();
    return res.json(requests);
  });

  app.post("/api/song-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const validatedData = insertSongRequestSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const request = await storage.createSongRequest(validatedData);
      return res.status(201).json(request);
      
    } catch (error) {
      return res.status(400).json({ error: "Invalid song request data" });
    }
  });

  app.patch("/api/song-requests/:id/status", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!req.user.isAdmin) return res.status(403).send("Only administrators can update song request status");
    
    const id = parseInt(req.params.id);
    const { status, adminMessage } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const updatedRequest = await storage.updateSongRequestStatus(id, status, adminMessage);
    if (!updatedRequest) {
      return res.status(404).send("Song request not found");
    }
    
    return res.json(updatedRequest);
  });

  app.delete("/api/song-requests/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const id = parseInt(req.params.id);
    const request = await storage.getSongRequest(id);
    
    if (!request) {
      return res.status(404).send("Song request not found");
    }
    
    // Only the owner or an admin can delete a request
    if (request.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).send("Forbidden");
    }
    
    const success = await storage.deleteSongRequest(id);
    if (success) {
      return res.status(204).send();
    } else {
      return res.status(500).send("Failed to delete song request");
    }
  });

  // Short Link routes
  app.post("/api/shortlinks", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const { targetUrl, type, referenceId } = req.body;
    
    if (!targetUrl) {
      return res.status(400).send("Target URL is required");
    }
    
    // Generate a short unique ID
    const shortId = Math.random().toString(36).substring(2, 8);
    
    try {
      const validatedData = insertShortLinkSchema.parse({
        shortId,
        targetUrl,
        userId: req.user.id,
        type: type || "song",
        referenceId: referenceId || null,
      });
      
      const shortLink = await storage.createShortLink(validatedData);
      
      return res.status(201).json(shortLink);
    } catch (error) {
      console.error("Error creating short link:", error);
      return res.status(500).send("Failed to create short link");
    }
  });
  
  app.get("/api/shortlinks/:shortId", async (req: Request, res: Response) => {
    const shortId = req.params.shortId;
    
    if (!shortId) {
      return res.status(400).send("Short ID is required");
    }
    
    try {
      const shortLink = await storage.getShortLink(shortId);
      
      if (!shortLink) {
        return res.status(404).send("Short link not found");
      }
      
      // If we're just retrieving info, don't increment counter
      return res.json(shortLink);
    } catch (error) {
      console.error("Error fetching short link:", error);
      return res.status(500).send("Failed to fetch short link");
    }
  });
  
  // Redirect endpoint for short links
  app.get("/s/:shortId", async (req: Request, res: Response) => {
    const shortId = req.params.shortId;
    
    try {
      const shortLink = await storage.getShortLink(shortId);
      
      if (!shortLink) {
        return res.status(404).send("Short link not found");
      }
      
      // Increment the click counter
      await storage.incrementShortLinkClicks(shortId);
      
      // Redirect to the target URL
      return res.redirect(shortLink.targetUrl);
    } catch (error) {
      console.error("Error processing short link redirect:", error);
      return res.status(500).send("Failed to process redirect");
    }
  });
  
  app.delete("/api/shortlinks/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const id = parseInt(req.params.id);
    
    try {
      const success = await storage.deleteShortLink(id);
      
      if (success) {
        return res.status(204).send();
      } else {
        return res.status(404).send("Short link not found");
      }
    } catch (error) {
      console.error("Error deleting short link:", error);
      return res.status(500).send("Failed to delete short link");
    }
  });

  // Remote control music system via WebSocket
  app.get("/api/remote-control/info", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    // Return the necessary info to connect to this server remotely
    // This includes the server IP, a temporary token, and user info
    const token = Math.random().toString(36).substring(2, 15);
    
    // Store the token for verification when WebSocket connects
    // In a real system, you'd store this in Redis or a proper session store with expiry
    if (!global.__remote_tokens) {
      global.__remote_tokens = {};
    }
    
    global.__remote_tokens[token] = {
      userId: req.user.id,
      username: req.user.username,
      expires: Date.now() + (30 * 60 * 1000) // 30 minutes
    };

    return res.json({
      token,
      userId: req.user.id,
      username: req.user.username,
      // Include WebSocket path and server location
      wsPath: '/ws',
      host: req.headers.host
    });
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for remote control
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Connected playback devices that can be controlled
  const connectedDevices = new Map();
  
  // Connected remote controllers
  const remoteControllers = new Map();

  // Set of active user sessions
  const userSessions = new Map();
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Initialize connection state
    let userId = null;
    let deviceId = null;
    let isController = false;
    let isPlayer = false;
    let token = null;
    
    // Handle messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          // Validate the token
          if (data.token && global.__remote_tokens && global.__remote_tokens[data.token]) {
            const tokenData = global.__remote_tokens[data.token];
            
            // Check if token is expired
            if (tokenData.expires < Date.now()) {
              ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Token expired'
              }));
              return;
            }
            
            userId = tokenData.userId;
            token = data.token;
            
            // Check if this is a playback device or a controller
            if (data.deviceType === 'player') {
              isPlayer = true;
              deviceId = `player-${userId}-${Date.now()}`;
              connectedDevices.set(deviceId, {
                ws,
                userId,
                name: data.deviceName || 'Unknown Device',
                currentSong: null,
                isPlaying: false,
                volume: 100,
                timestamp: Date.now()
              });
              
              // Add this device to user's session
              if (!userSessions.has(userId)) {
                userSessions.set(userId, { 
                  players: new Set(), 
                  controllers: new Set() 
                });
              }
              userSessions.get(userId).players.add(deviceId);
              
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'auth_success',
                deviceId,
                message: 'Player registered successfully'
              }));
              
              // Notify all controllers for this user about the new player
              broadcastToUserControllers(userId, {
                type: 'player_connected',
                deviceId,
                name: data.deviceName || 'Unknown Device'
              });
            }
            else if (data.deviceType === 'controller') {
              isController = true;
              deviceId = `controller-${userId}-${Date.now()}`;
              remoteControllers.set(deviceId, {
                ws,
                userId,
                name: data.deviceName || 'Remote Control',
                timestamp: Date.now()
              });
              
              // Add this controller to user's session
              if (!userSessions.has(userId)) {
                userSessions.set(userId, { 
                  players: new Set(), 
                  controllers: new Set() 
                });
              }
              userSessions.get(userId).controllers.add(deviceId);
              
              // Send confirmation
              ws.send(JSON.stringify({
                type: 'auth_success',
                deviceId,
                message: 'Controller registered successfully'
              }));
              
              // Send list of available players to the controller
              const availablePlayers = [];
              if (userSessions.has(userId)) {
                for (const playerId of userSessions.get(userId).players) {
                  const player = connectedDevices.get(playerId);
                  if (player) {
                    availablePlayers.push({
                      deviceId: playerId,
                      name: player.name,
                      currentSong: player.currentSong,
                      isPlaying: player.isPlaying,
                      volume: player.volume
                    });
                  }
                }
              }
              
              ws.send(JSON.stringify({
                type: 'available_players',
                players: availablePlayers
              }));
            }
          } else {
            ws.send(JSON.stringify({
              type: 'auth_error',
              message: 'Invalid token'
            }));
          }
        }
        // Handle controller commands
        else if (isController && data.type === 'command') {
          // Forward command to the specified device
          if (data.targetDeviceId && connectedDevices.has(data.targetDeviceId)) {
            // Check if the target device belongs to this user
            const targetDevice = connectedDevices.get(data.targetDeviceId);
            if (targetDevice.userId === userId) {
              // Forward the command
              targetDevice.ws.send(JSON.stringify({
                type: 'command',
                action: data.action,
                params: data.params
              }));
            }
          }
        }
        // Handle player status updates
        else if (isPlayer && data.type === 'status_update') {
          // Update the player's status
          if (connectedDevices.has(deviceId)) {
            const device = connectedDevices.get(deviceId);
            device.currentSong = data.currentSong || device.currentSong;
            device.isPlaying = data.isPlaying !== undefined ? data.isPlaying : device.isPlaying;
            device.volume = data.volume !== undefined ? data.volume : device.volume;
            
            // Broadcast the status update to all controllers for this user
            broadcastToUserControllers(userId, {
              type: 'player_status',
              deviceId,
              name: device.name,
              currentSong: device.currentSong,
              isPlaying: device.isPlaying,
              volume: device.volume
            });
          }
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      if (isPlayer && deviceId) {
        // Remove from connected devices
        connectedDevices.delete(deviceId);
        
        // Remove from user session
        if (userId && userSessions.has(userId)) {
          userSessions.get(userId).players.delete(deviceId);
          
          // Notify controllers
          broadcastToUserControllers(userId, {
            type: 'player_disconnected',
            deviceId
          });
        }
      }
      else if (isController && deviceId) {
        // Remove from controllers
        remoteControllers.delete(deviceId);
        
        // Remove from user session
        if (userId && userSessions.has(userId)) {
          userSessions.get(userId).controllers.delete(deviceId);
        }
      }
      
      // Cleanup token if it was the last connection using it
      if (token && userId) {
        let otherConnections = false;
        
        // Check if there are other connections using this token
        if (userSessions.has(userId)) {
          const userSession = userSessions.get(userId);
          
          // Check each player
          for (const playerId of userSession.players) {
            const device = connectedDevices.get(playerId);
            if (device && device.token === token) {
              otherConnections = true;
              break;
            }
          }
          
          // Check each controller
          if (!otherConnections) {
            for (const controllerId of userSession.controllers) {
              const controller = remoteControllers.get(controllerId);
              if (controller && controller.token === token) {
                otherConnections = true;
                break;
              }
            }
          }
        }
        
        // Remove token if no other connections are using it
        if (!otherConnections && global.__remote_tokens && global.__remote_tokens[token]) {
          delete global.__remote_tokens[token];
        }
      }
    });
  });
  
  // Helper function to broadcast to all controllers for a specific user
  function broadcastToUserControllers(userId, message) {
    if (userSessions.has(userId)) {
      for (const controllerId of userSessions.get(userId).controllers) {
        const controller = remoteControllers.get(controllerId);
        if (controller && controller.ws.readyState === WebSocket.OPEN) {
          controller.ws.send(JSON.stringify(message));
        }
      }
    }
  }
  
  return httpServer;
}
