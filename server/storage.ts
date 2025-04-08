import { users, songs, playlists, playlistSongs, favorites } from "@shared/schema";
import type { User, InsertUser, Song, Playlist, PlaylistSong, Favorite } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const MemoryStore = createMemoryStore(session);

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<Omit<User, "id" | "isAdmin" | "createdAt">>): Promise<User | undefined>;
  
  // Song operations
  getSong(id: number): Promise<Song | undefined>;
  getSongsByUser(userId: number): Promise<Song[]>;
  getAllSongs(): Promise<Song[]>;
  createSong(song: Omit<Song, "id" | "uploadedAt">): Promise<Song>;
  deleteSong(id: number): Promise<boolean>;
  
  // Playlist operations
  getPlaylist(id: number): Promise<Playlist | undefined>;
  getPlaylistsByUser(userId: number): Promise<Playlist[]>;
  createPlaylist(playlist: Omit<Playlist, "id" | "createdAt">): Promise<Playlist>;
  updatePlaylist(id: number, playlist: Partial<Omit<Playlist, "id" | "userId" | "createdAt">>): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
  
  // Playlist song operations
  getPlaylistSongs(playlistId: number): Promise<Song[]>;
  addSongToPlaylist(playlistId: number, songId: number): Promise<PlaylistSong>;
  removeSongFromPlaylist(playlistId: number, songId: number): Promise<boolean>;
  
  // Favorites operations
  getFavoritesByUser(userId: number): Promise<Song[]>;
  addToFavorites(userId: number, songId: number): Promise<Favorite>;
  removeFromFavorites(userId: number, songId: number): Promise<boolean>;
  isFavorite(userId: number, songId: number): Promise<boolean>;

  // Session store
  sessionStore: any; // Express session store
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private songs: Map<number, Song>;
  private playlists: Map<number, Playlist>;
  private playlistSongs: Map<number, PlaylistSong>;
  private favorites: Map<number, Favorite>;
  sessionStore: any; // Express session store
  
  private userIdCounter: number;
  private songIdCounter: number;
  private playlistIdCounter: number;
  private playlistSongIdCounter: number;
  private favoriteIdCounter: number;

  constructor() {
    this.users = new Map();
    this.songs = new Map();
    this.playlists = new Map();
    this.playlistSongs = new Map();
    this.favorites = new Map();
    
    this.userIdCounter = 1;
    this.songIdCounter = 1;
    this.playlistIdCounter = 1;
    this.playlistSongIdCounter = 1;
    this.favoriteIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create a default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true
    });
    
    // Create a default regular user
    this.createUser({
      username: "user",
      password: "user123",
      isAdmin: false
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Hash the password before storing
    const hashedPassword = await hashPassword(insertUser.password);
    
    const user: User = { 
      ...insertUser, 
      password: hashedPassword,
      id, 
      displayName: insertUser.username,
      isAdmin: insertUser.isAdmin || false,
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  // Song methods
  async getSong(id: number): Promise<Song | undefined> {
    return this.songs.get(id);
  }

  async getSongsByUser(userId: number): Promise<Song[]> {
    return Array.from(this.songs.values()).filter(
      (song) => song.userId === userId,
    );
  }

  async getAllSongs(): Promise<Song[]> {
    return Array.from(this.songs.values());
  }

  async createSong(song: Omit<Song, "id" | "uploadedAt">): Promise<Song> {
    const id = this.songIdCounter++;
    const now = new Date();
    const newSong: Song = { ...song, id, uploadedAt: now };
    this.songs.set(id, newSong);
    return newSong;
  }

  async deleteSong(id: number): Promise<boolean> {
    // Also remove from any playlists
    Array.from(this.playlistSongs.values())
      .filter(ps => ps.songId === id)
      .forEach(ps => this.playlistSongs.delete(ps.id));
    
    return this.songs.delete(id);
  }

  // Playlist methods
  async getPlaylist(id: number): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getPlaylistsByUser(userId: number): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(
      (playlist) => playlist.userId === userId,
    );
  }

  async createPlaylist(playlist: Omit<Playlist, "id" | "createdAt">): Promise<Playlist> {
    const id = this.playlistIdCounter++;
    const now = new Date();
    const newPlaylist: Playlist = { ...playlist, id, createdAt: now };
    this.playlists.set(id, newPlaylist);
    return newPlaylist;
  }

  async updatePlaylist(
    id: number, 
    updates: Partial<Omit<Playlist, "id" | "userId" | "createdAt">>
  ): Promise<Playlist | undefined> {
    const playlist = this.playlists.get(id);
    if (!playlist) return undefined;
    
    const updatedPlaylist: Playlist = { ...playlist, ...updates };
    this.playlists.set(id, updatedPlaylist);
    return updatedPlaylist;
  }

  async deletePlaylist(id: number): Promise<boolean> {
    // Also remove all playlist songs
    Array.from(this.playlistSongs.values())
      .filter(ps => ps.playlistId === id)
      .forEach(ps => this.playlistSongs.delete(ps.id));
    
    return this.playlists.delete(id);
  }

  // Playlist song methods
  async getPlaylistSongs(playlistId: number): Promise<Song[]> {
    const playlistSongRecords = Array.from(this.playlistSongs.values()).filter(
      (ps) => ps.playlistId === playlistId,
    );
    
    const songIds = playlistSongRecords.map(ps => ps.songId);
    return Array.from(this.songs.values()).filter(song => songIds.includes(song.id));
  }

  async addSongToPlaylist(playlistId: number, songId: number): Promise<PlaylistSong> {
    // Check if already in playlist
    const existing = Array.from(this.playlistSongs.values()).find(
      ps => ps.playlistId === playlistId && ps.songId === songId
    );
    
    if (existing) return existing;
    
    const id = this.playlistSongIdCounter++;
    const now = new Date();
    const playlistSong: PlaylistSong = {
      id,
      playlistId,
      songId,
      addedAt: now,
    };
    
    this.playlistSongs.set(id, playlistSong);
    return playlistSong;
  }

  async removeSongFromPlaylist(playlistId: number, songId: number): Promise<boolean> {
    const playlistSong = Array.from(this.playlistSongs.values()).find(
      ps => ps.playlistId === playlistId && ps.songId === songId
    );
    
    if (!playlistSong) return false;
    return this.playlistSongs.delete(playlistSong.id);
  }

  // User update
  async updateUser(
    id: number, 
    updates: Partial<Omit<User, "id" | "isAdmin" | "createdAt">>
  ): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Favorites methods
  async getFavoritesByUser(userId: number): Promise<Song[]> {
    const favoriteRecords = Array.from(this.favorites.values()).filter(
      (fav) => fav.userId === userId,
    );
    
    const songIds = favoriteRecords.map(fav => fav.songId);
    return Array.from(this.songs.values()).filter(song => songIds.includes(song.id));
  }

  async addToFavorites(userId: number, songId: number): Promise<Favorite> {
    // Check if already in favorites
    const existing = Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.songId === songId
    );
    
    if (existing) return existing;
    
    const id = this.favoriteIdCounter++;
    const now = new Date();
    const favorite: Favorite = {
      id,
      userId,
      songId,
      addedAt: now,
    };
    
    this.favorites.set(id, favorite);
    return favorite;
  }

  async removeFromFavorites(userId: number, songId: number): Promise<boolean> {
    const favorite = Array.from(this.favorites.values()).find(
      fav => fav.userId === userId && fav.songId === songId
    );
    
    if (!favorite) return false;
    return this.favorites.delete(favorite.id);
  }

  async isFavorite(userId: number, songId: number): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      fav => fav.userId === userId && fav.songId === songId
    );
  }
}

export const storage = new MemStorage();
