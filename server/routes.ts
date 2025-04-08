import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { setupUpload } from "./multer";
import fs from "fs";
import path from "path";
import { insertPlaylistSchema, insertPlaylistSongSchema } from "@shared/schema";

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
    
    const { title, artist, album, duration, cover } = req.body;
    
    const song = await storage.createSong({
      title,
      artist,
      album: album || null,
      duration: parseInt(duration),
      cover: cover || null,
      filePath: req.file.path,
      userId: req.user.id,
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

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
