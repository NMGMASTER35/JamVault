import { users, songs, playlists, playlistSongs, favorites, songComments, userListeningHistory, artists, games, shortLinks, songRequests } from "@shared/schema";
import type { 
  User, InsertUser, Song, Playlist, PlaylistSong, Favorite, 
  SongComment, UserListeningHistory, Artist, Game, SongRequest, InsertSongRequest,
  ShortLink, InsertShortLink
} from "@shared/schema";
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
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<Omit<User, "id" | "isAdmin" | "createdAt">>): Promise<User | undefined>;
  getUserStats(userId: number): Promise<any>;
  updateUserStats(userId: number, stats: any): Promise<any>;
  createPasswordResetToken(userId: number): Promise<string>;
  validatePasswordResetToken(token: string): Promise<User | undefined>;
  updatePassword(userId: number, newPassword: string): Promise<boolean>;
  getRecentlyRegisteredUsers(limit?: number): Promise<User[]>;
  
  // Artist operations
  getArtist(id: number): Promise<Artist | undefined>;
  getArtistByName(name: string): Promise<Artist | undefined>;
  getAllArtists(): Promise<Artist[]>;
  createArtist(artist: Omit<Artist, "id" | "createdAt">): Promise<Artist>;
  updateArtist(id: number, updates: Partial<Omit<Artist, "id" | "createdAt">>): Promise<Artist | undefined>;
  
  // Song operations
  getSong(id: number): Promise<Song | undefined>;
  getSongsByUser(userId: number): Promise<Song[]>;
  getSongsByArtist(artistId: number): Promise<Song[]>;
  getSongsByGenre(genre: string): Promise<Song[]>;
  getAllSongs(): Promise<Song[]>;
  getRecentlyAddedSongs(limit?: number): Promise<Song[]>;
  createSong(song: Omit<Song, "id" | "uploadedAt">): Promise<Song>;
  updateSong(id: number, updates: Partial<Omit<Song, "id" | "userId" | "uploadedAt">>): Promise<Song | undefined>;
  incrementPlayCount(id: number): Promise<Song | undefined>;
  updateSongLyrics(id: number, lyrics: string): Promise<Song | undefined>;
  deleteSong(id: number): Promise<boolean>;
  
  // Playlist operations
  getPlaylist(id: number): Promise<Playlist | undefined>;
  getPlaylistsByUser(userId: number): Promise<Playlist[]>;
  getCollaborativePlaylists(): Promise<Playlist[]>;
  getCollaborativePlaylistsByUser(userId: number): Promise<Playlist[]>;
  createPlaylist(playlist: Omit<Playlist, "id" | "createdAt">): Promise<Playlist>;
  updatePlaylist(id: number, playlist: Partial<Omit<Playlist, "id" | "userId" | "createdAt">>): Promise<Playlist | undefined>;
  addCollaborator(playlistId: number, userId: number): Promise<Playlist | undefined>;
  removeCollaborator(playlistId: number, userId: number): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
  
  // Playlist song operations
  getPlaylistSongs(playlistId: number): Promise<Song[]>;
  addSongToPlaylist(playlistId: number, songId: number, addedBy: number): Promise<PlaylistSong>;
  removeSongFromPlaylist(playlistId: number, songId: number): Promise<boolean>;
  
  // Favorites operations
  getFavoritesByUser(userId: number): Promise<Song[]>;
  addToFavorites(userId: number, songId: number): Promise<Favorite>;
  removeFromFavorites(userId: number, songId: number): Promise<boolean>;
  isFavorite(userId: number, songId: number): Promise<boolean>;
  
  // Song Comments operations
  getSongComments(songId: number): Promise<SongComment[]>;
  addSongComment(comment: Omit<SongComment, "id" | "createdAt">): Promise<SongComment>;
  deleteSongComment(id: number): Promise<boolean>;
  
  // User Listening History operations
  recordListeningHistory(history: Omit<UserListeningHistory, "id" | "listenDate">): Promise<UserListeningHistory>;
  getUserListeningHistory(userId: number): Promise<UserListeningHistory[]>;
  getUserListeningStats(userId: number): Promise<{
    totalTime: number;
    topSongs: { songId: number; title: string; playCount: number }[];
    topArtists: { artist: string; playCount: number }[];
    topGenres: { genre: string; playCount: number }[];
  }>;
  
  // Games operations
  getAllGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: Omit<Game, "id" | "createdAt">): Promise<Game>;
  updateGame(id: number, updates: Partial<Omit<Game, "id" | "createdAt">>): Promise<Game | undefined>;
  deleteGame(id: number): Promise<boolean>;
  
  // Song Requests operations
  getSongRequest(id: number): Promise<SongRequest | undefined>;
  getSongRequestsByUser(userId: number): Promise<SongRequest[]>;
  getAllSongRequests(): Promise<SongRequest[]>;
  getPendingSongRequests(): Promise<SongRequest[]>;
  createSongRequest(songRequest: InsertSongRequest): Promise<SongRequest>;
  updateSongRequestStatus(id: number, status: 'pending' | 'approved' | 'rejected', adminMessage?: string): Promise<SongRequest | undefined>;
  deleteSongRequest(id: number): Promise<boolean>;
  
  // Short Link operations
  createShortLink(shortLink: InsertShortLink): Promise<ShortLink>;
  getShortLink(shortId: string): Promise<ShortLink | undefined>;
  incrementShortLinkClicks(shortId: string): Promise<ShortLink | undefined>;
  deleteShortLink(id: number): Promise<boolean>;

  // Session store
  sessionStore: any; // Express session store
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private songs: Map<number, Song>;
  private playlists: Map<number, Playlist>;
  private playlistSongs: Map<number, PlaylistSong>;
  private favorites: Map<number, Favorite>;
  private artists: Map<number, Artist>;
  private songComments: Map<number, SongComment>;
  private userListeningHistory: Map<number, UserListeningHistory>;
  private games: Map<number, Game>;
  private songRequests: Map<number, SongRequest>;
  private shortLinks: Map<number, ShortLink>;
  sessionStore: any; // Express session store
  
  private userIdCounter: number;
  private songIdCounter: number;
  private playlistIdCounter: number;
  private playlistSongIdCounter: number;
  private favoriteIdCounter: number;
  private artistIdCounter: number;
  private songCommentIdCounter: number;
  private listeningHistoryIdCounter: number;
  private gameIdCounter: number;
  private songRequestIdCounter: number;
  private shortLinkIdCounter: number;

  constructor() {
    this.users = new Map();
    this.songs = new Map();
    this.playlists = new Map();
    this.playlistSongs = new Map();
    this.favorites = new Map();
    this.artists = new Map();
    this.songComments = new Map();
    this.userListeningHistory = new Map();
    this.games = new Map();
    this.songRequests = new Map();
    this.shortLinks = new Map();
    
    this.userIdCounter = 1;
    this.songIdCounter = 1;
    this.playlistIdCounter = 1;
    this.playlistSongIdCounter = 1;
    this.favoriteIdCounter = 1;
    this.artistIdCounter = 1;
    this.songCommentIdCounter = 1;
    this.listeningHistoryIdCounter = 1;
    this.gameIdCounter = 1;
    this.songRequestIdCounter = 1;
    this.shortLinkIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Create a default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      isAdmin: true,
      profileImage: null,
      bio: null,
      displayName: "Administrator",
      stats: null
    });
    
    // Create a default regular user
    this.createUser({
      username: "user",
      password: "user123",
      isAdmin: false,
      profileImage: null,
      bio: null,
      displayName: "Regular User",
      stats: null
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
      displayName: insertUser.displayName || insertUser.username,
      isAdmin: insertUser.isAdmin || false,
      createdAt: now,
      stats: insertUser.stats || {
        totalListenTime: 0,
        topGenres: [],
        topArtists: [],
        personality: "New Listener"
      }
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUserStats(userId: number): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;
    return user.stats;
  }
  
  async updateUserStats(userId: number, stats: any): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;
    
    const updatedUser = { 
      ...user, 
      stats: {
        ...user.stats,
        ...stats
      }
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser.stats;
  }
  
  // Artist methods
  async getArtist(id: number): Promise<Artist | undefined> {
    return this.artists.get(id);
  }
  
  async getArtistByName(name: string): Promise<Artist | undefined> {
    return Array.from(this.artists.values()).find(
      artist => artist.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async getAllArtists(): Promise<Artist[]> {
    return Array.from(this.artists.values());
  }
  
  async createArtist(artist: Omit<Artist, "id" | "createdAt">): Promise<Artist> {
    const id = this.artistIdCounter++;
    const now = new Date();
    const newArtist: Artist = { ...artist, id, createdAt: now };
    this.artists.set(id, newArtist);
    return newArtist;
  }
  
  async updateArtist(
    id: number,
    updates: Partial<Omit<Artist, "id" | "createdAt">>
  ): Promise<Artist | undefined> {
    const artist = this.artists.get(id);
    if (!artist) return undefined;
    
    const updatedArtist: Artist = { ...artist, ...updates };
    this.artists.set(id, updatedArtist);
    return updatedArtist;
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
  
  async getSongsByArtist(artistId: number): Promise<Song[]> {
    return Array.from(this.songs.values()).filter(
      (song) => song.artistId === artistId,
    );
  }
  
  async getSongsByGenre(genre: string): Promise<Song[]> {
    return Array.from(this.songs.values()).filter(
      (song) => song.genre?.toLowerCase() === genre.toLowerCase(),
    );
  }

  async getAllSongs(): Promise<Song[]> {
    return Array.from(this.songs.values());
  }

  async createSong(song: Omit<Song, "id" | "uploadedAt">): Promise<Song> {
    const id = this.songIdCounter++;
    const now = new Date();
    const newSong: Song = { 
      ...song, 
      id, 
      uploadedAt: now,
      playCount: song.playCount || 0,
      artistId: song.artistId || null,
      genre: song.genre || null,
      year: song.year || null,
      lyrics: song.lyrics || null
    };
    this.songs.set(id, newSong);
    return newSong;
  }
  
  async updateSong(
    id: number,
    updates: Partial<Omit<Song, "id" | "userId" | "uploadedAt">>
  ): Promise<Song | undefined> {
    const song = this.songs.get(id);
    if (!song) return undefined;
    
    const updatedSong: Song = { ...song, ...updates };
    this.songs.set(id, updatedSong);
    return updatedSong;
  }
  
  async incrementPlayCount(id: number): Promise<Song | undefined> {
    const song = this.songs.get(id);
    if (!song) return undefined;
    
    const updatedSong: Song = { 
      ...song, 
      playCount: (song.playCount || 0) + 1 
    };
    this.songs.set(id, updatedSong);
    return updatedSong;
  }
  
  async updateSongLyrics(id: number, lyrics: string): Promise<Song | undefined> {
    const song = this.songs.get(id);
    if (!song) return undefined;
    
    const updatedSong: Song = { ...song, lyrics };
    this.songs.set(id, updatedSong);
    return updatedSong;
  }

  async deleteSong(id: number): Promise<boolean> {
    // Also remove from any playlists
    Array.from(this.playlistSongs.values())
      .filter(ps => ps.songId === id)
      .forEach(ps => this.playlistSongs.delete(ps.id));
    
    // Remove from favorites
    Array.from(this.favorites.values())
      .filter(fav => fav.songId === id)
      .forEach(fav => this.favorites.delete(fav.id));
    
    // Remove comments
    Array.from(this.songComments.values())
      .filter(comment => comment.songId === id)
      .forEach(comment => this.songComments.delete(comment.id));
    
    return this.songs.delete(id);
  }

  // Playlist methods
  async getPlaylist(id: number): Promise<Playlist | undefined> {
    return this.playlists.get(id);
  }

  async getPlaylistsByUser(userId: number): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(
      (playlist) => playlist.userId === userId || 
                    playlist.collaborators?.includes(userId),
    );
  }
  
  async getCollaborativePlaylists(): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(
      (playlist) => playlist.isCollaborative === true,
    );
  }
  
  async getCollaborativePlaylistsByUser(userId: number): Promise<Playlist[]> {
    return Array.from(this.playlists.values()).filter(
      (playlist) => playlist.isCollaborative === true && 
                    (playlist.userId === userId || 
                     playlist.collaborators?.includes(userId)),
    );
  }

  async createPlaylist(playlist: Omit<Playlist, "id" | "createdAt">): Promise<Playlist> {
    const id = this.playlistIdCounter++;
    const now = new Date();
    const newPlaylist: Playlist = { 
      ...playlist, 
      id, 
      createdAt: now,
      isCollaborative: playlist.isCollaborative || false,
      collaborators: playlist.collaborators || []
    };
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
  
  async addCollaborator(playlistId: number, userId: number): Promise<Playlist | undefined> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return undefined;
    
    const currentCollaborators = playlist.collaborators || [];
    
    // Check if user is already a collaborator
    if (currentCollaborators.includes(userId)) {
      return playlist;
    }
    
    const updatedPlaylist: Playlist = {
      ...playlist,
      isCollaborative: true,
      collaborators: [...currentCollaborators, userId]
    };
    
    this.playlists.set(playlistId, updatedPlaylist);
    return updatedPlaylist;
  }
  
  async removeCollaborator(playlistId: number, userId: number): Promise<Playlist | undefined> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return undefined;
    
    const currentCollaborators = playlist.collaborators || [];
    
    // Check if user is a collaborator
    if (!currentCollaborators.includes(userId)) {
      return playlist;
    }
    
    const updatedPlaylist: Playlist = {
      ...playlist,
      collaborators: currentCollaborators.filter(id => id !== userId)
    };
    
    this.playlists.set(playlistId, updatedPlaylist);
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

  async addSongToPlaylist(playlistId: number, songId: number, addedBy: number): Promise<PlaylistSong> {
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
      addedBy,
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
  
  // Song Comments methods
  async getSongComments(songId: number): Promise<SongComment[]> {
    return Array.from(this.songComments.values())
      .filter(comment => comment.songId === songId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async addSongComment(comment: Omit<SongComment, "id" | "createdAt">): Promise<SongComment> {
    const id = this.songCommentIdCounter++;
    const now = new Date();
    const newComment: SongComment = { ...comment, id, createdAt: now };
    this.songComments.set(id, newComment);
    return newComment;
  }
  
  async deleteSongComment(id: number): Promise<boolean> {
    return this.songComments.delete(id);
  }
  
  // User Listening History methods
  async recordListeningHistory(history: Omit<UserListeningHistory, "id" | "listenDate">): Promise<UserListeningHistory> {
    const id = this.listeningHistoryIdCounter++;
    const now = new Date();
    const newHistory: UserListeningHistory = { ...history, id, listenDate: now };
    this.userListeningHistory.set(id, newHistory);
    
    // Also increment the song's play count
    this.incrementPlayCount(history.songId);
    
    return newHistory;
  }
  
  async getUserListeningHistory(userId: number): Promise<UserListeningHistory[]> {
    return Array.from(this.userListeningHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => {
        // Handle null listenDate values
        if (!a.listenDate) return 1;
        if (!b.listenDate) return -1;
        return b.listenDate.getTime() - a.listenDate.getTime();
      }); // Most recent first
  }
  
  async getUserListeningStats(userId: number): Promise<{
    totalTime: number;
    topSongs: { songId: number; title: string; playCount: number }[];
    topArtists: { artist: string; playCount: number }[];
    topGenres: { genre: string; playCount: number }[];
  }> {
    const history = await this.getUserListeningHistory(userId);
    
    // Calculate total listening time
    const totalTime = history.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    // Count song plays
    const songCounts = new Map<number, number>();
    history.forEach(entry => {
      const current = songCounts.get(entry.songId) || 0;
      songCounts.set(entry.songId, current + 1);
    });
    
    // Get top songs
    const songEntries = Array.from(songCounts.entries());
    songEntries.sort((a, b) => b[1] - a[1]); // Sort by play count, descending
    
    const topSongs = await Promise.all(
      songEntries.slice(0, 10).map(async ([songId, playCount]) => {
        const song = await this.getSong(songId);
        return {
          songId,
          title: song?.title || "Unknown",
          playCount
        };
      })
    );
    
    // Count artist plays
    const artistCounts = new Map<string, number>();
    for (const entry of history) {
      const song = await this.getSong(entry.songId);
      if (song?.artist) {
        const current = artistCounts.get(song.artist) || 0;
        artistCounts.set(song.artist, current + 1);
      }
    }
    
    // Get top artists
    const artistEntries = Array.from(artistCounts.entries());
    artistEntries.sort((a, b) => b[1] - a[1]); // Sort by play count, descending
    
    const topArtists = artistEntries.slice(0, 5).map(([artist, playCount]) => ({
      artist,
      playCount
    }));
    
    // Count genre plays
    const genreCounts = new Map<string, number>();
    for (const entry of history) {
      const song = await this.getSong(entry.songId);
      if (song?.genre) {
        const current = genreCounts.get(song.genre) || 0;
        genreCounts.set(song.genre, current + 1);
      }
    }
    
    // Get top genres
    const genreEntries = Array.from(genreCounts.entries());
    genreEntries.sort((a, b) => b[1] - a[1]); // Sort by play count, descending
    
    const topGenres = genreEntries.slice(0, 5).map(([genre, playCount]) => ({
      genre,
      playCount
    }));
    
    return {
      totalTime,
      topSongs,
      topArtists,
      topGenres
    };
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
  
  // Games methods
  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async createGame(game: Omit<Game, "id" | "createdAt">): Promise<Game> {
    const id = this.gameIdCounter++;
    const now = new Date();
    const newGame: Game = { ...game, id, createdAt: now };
    this.games.set(id, newGame);
    return newGame;
  }
  
  async updateGame(
    id: number,
    updates: Partial<Omit<Game, "id" | "createdAt">>
  ): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame: Game = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }
  
  async deleteGame(id: number): Promise<boolean> {
    return this.games.delete(id);
  }

  // Song Request methods
  async getSongRequest(id: number): Promise<SongRequest | undefined> {
    return this.songRequests.get(id);
  }

  async getSongRequestsByUser(userId: number): Promise<SongRequest[]> {
    return Array.from(this.songRequests.values()).filter(
      (request) => request.userId === userId,
    );
  }

  async getAllSongRequests(): Promise<SongRequest[]> {
    return Array.from(this.songRequests.values());
  }

  async getPendingSongRequests(): Promise<SongRequest[]> {
    return Array.from(this.songRequests.values()).filter(
      (request) => request.status === 'pending',
    );
  }

  async createSongRequest(songRequest: InsertSongRequest): Promise<SongRequest> {
    const id = this.songRequestIdCounter++;
    const now = new Date();
    
    const newRequest: SongRequest = {
      ...songRequest,
      id,
      status: 'pending',
      adminMessage: null,
      createdAt: now,
    };
    
    this.songRequests.set(id, newRequest);
    return newRequest;
  }

  async updateSongRequestStatus(
    id: number, 
    status: 'pending' | 'approved' | 'rejected', 
    adminMessage?: string
  ): Promise<SongRequest | undefined> {
    const request = this.songRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest: SongRequest = {
      ...request,
      status,
      adminMessage: adminMessage || request.adminMessage,
    };
    
    this.songRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteSongRequest(id: number): Promise<boolean> {
    return this.songRequests.delete(id);
  }

  // User profile methods
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createPasswordResetToken(userId: number): Promise<string> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Generate a random token
    const token = randomBytes(32).toString('hex');
    
    // Set token expiry for 1 hour from now
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);
    
    // Update user with token and expiry
    const updatedUser = {
      ...user,
      resetToken: token,
      resetTokenExpiry: expiry,
    };
    
    this.users.set(userId, updatedUser);
    return token;
  }

  async validatePasswordResetToken(token: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (user) => user.resetToken === token
    );
    
    if (!user) return undefined;
    
    // Check if token is expired
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return undefined;
    }
    
    return user;
  }

  async updatePassword(userId: number, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user
    const updatedUser = {
      ...user,
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }

  async getRecentlyRegisteredUsers(limit: number = 10): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => {
        // Handle null createdAt values
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);
  }

  async getRecentlyAddedSongs(limit: number = 10): Promise<Song[]> {
    return Array.from(this.songs.values())
      .sort((a, b) => {
        // Handle null uploadedAt values
        if (!a.uploadedAt) return 1;
        if (!b.uploadedAt) return -1;
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      })
      .slice(0, limit);
  }

  // Short Link methods
  async createShortLink(shortLink: InsertShortLink): Promise<ShortLink> {
    const id = this.shortLinkIdCounter++;
    const now = new Date();
    const newShortLink: ShortLink = {
      ...shortLink,
      id,
      createdAt: now,
      clicks: 0
    };
    this.shortLinks.set(id, newShortLink);
    return newShortLink;
  }

  async getShortLink(shortId: string): Promise<ShortLink | undefined> {
    return Array.from(this.shortLinks.values()).find(link => link.shortId === shortId);
  }

  async incrementShortLinkClicks(shortId: string): Promise<ShortLink | undefined> {
    const shortLink = await this.getShortLink(shortId);
    if (!shortLink) return undefined;

    const updatedShortLink: ShortLink = {
      ...shortLink,
      clicks: (shortLink.clicks || 0) + 1
    };
    this.shortLinks.set(shortLink.id, updatedShortLink);
    return updatedShortLink;
  }

  async deleteShortLink(id: number): Promise<boolean> {
    return this.shortLinks.delete(id);
  }
}

export const storage = new MemStorage();
