import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
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
  passwordSchema 
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
    
    // If admin, return own songs, otherwise return all songs
    const songs = req.user.isAdmin 
      ? await storage.getSongsByUser(req.user.id)
      : await storage.getAllSongs();
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

  // Recently added songs
  app.get("/api/songs/recent", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const songs = await storage.getRecentlyAddedSongs(limit);
    return res.json(songs);
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
