import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  dateOfBirth: timestamp("date_of_birth"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  profileImage: text("profile_image"),
  bio: text("bio"),
  favoriteArtists: text("favorite_artists").array(),
  favoriteSongs: integer("favorite_songs").array(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  stats: jsonb("stats").$type<{
    totalListenTime: number;
    topGenres: { genre: string; count: number }[];
    topArtists: { artist: string; count: number }[];
    personality: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  image: text("image"),
  genres: text("genres").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artistId: integer("artist_id").notNull(),
  cover: text("cover"),
  releaseYear: integer("release_year"),
  genre: text("genre"),
  description: text("description"),
  trackCount: integer("track_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(), // Keep for backwards compatibility
  artistId: integer("artist_id").notNull(), // Main artist ID reference
  featuredArtists: integer("featured_artists").array(), // Array of featured artist IDs
  album: text("album"),
  albumId: integer("album_id"), // Album ID reference
  genre: text("genre"),
  year: integer("year"),
  duration: integer("duration").notNull(), // in seconds
  cover: text("cover"),
  filePath: text("file_path").notNull(),
  lyrics: text("lyrics"),
  userId: integer("user_id").notNull(),
  playCount: integer("play_count").default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  barcode: text("barcode").unique(), // Unique song identifier/barcode
});

export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  cover: text("cover"),
  userId: integer("user_id").notNull(),
  isCollaborative: boolean("is_collaborative").default(false),
  collaborators: integer("collaborators").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playlistSongs = pgTable("playlist_songs", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull(),
  songId: integer("song_id").notNull(),
  addedBy: integer("added_by").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  songId: integer("song_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const songComments = pgTable("song_comments", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").notNull(),
  userId: integer("user_id").notNull(),
  comment: text("comment").notNull(),
  timestamp: integer("timestamp"), // Optional timestamp in the song (in seconds)
  createdAt: timestamp("created_at").defaultNow(),
});

export const userListeningHistory = pgTable("user_listening_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  songId: integer("song_id").notNull(), 
  listenDate: timestamp("listen_date").defaultNow(),
  duration: integer("duration"), // How long they listened in seconds
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // e.g., "quiz", "memory", "guessTheSong"
  config: jsonb("config"), // Game-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
});

export const songRequests = pgTable("song_requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(), // Main artist name
  artistId: integer("artist_id"), // Main artist ID (if known)
  featuredArtists: text("featured_artists").array(), // Featured artist names
  album: text("album"),
  year: integer("year"),
  cover: text("cover"),
  notes: text("notes"),
  userId: integer("user_id").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  adminMessage: text("admin_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shortLinks = pgTable("short_links", {
  id: serial("id").primaryKey(),
  shortId: text("short_id").notNull().unique(),
  targetUrl: text("target_url").notNull(),
  type: text("type").default("song").notNull(), // "song", "playlist", etc.
  referenceId: integer("reference_id"), // optional id reference
  userId: integer("user_id").notNull(),
  clicks: integer("clicks").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Library entries - Songs added to a user's personal library
export const libraryEntries = pgTable("library_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  songId: integer("song_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Insert Schemas and Types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stats: true,
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
  createdAt: true,
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
  createdAt: true,
  trackCount: true,
});

export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  uploadedAt: true,
  playCount: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
});

export const insertPlaylistSongSchema = createInsertSchema(playlistSongs).omit({
  id: true,
  addedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  addedAt: true,
});

export const insertSongCommentSchema = createInsertSchema(songComments).omit({
  id: true,
  createdAt: true,
});

export const insertUserListeningHistorySchema = createInsertSchema(userListeningHistory).omit({
  id: true,
  listenDate: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export const insertSongRequestSchema = createInsertSchema(songRequests).omit({
  id: true,
  createdAt: true,
  status: true,
  adminMessage: true,
});

export const insertShortLinkSchema = createInsertSchema(shortLinks).omit({
  id: true,
  createdAt: true,
  clicks: true,
});

export const insertLibraryEntrySchema = createInsertSchema(libraryEntries).omit({
  id: true,
  addedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Song = typeof songs.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type PlaylistSong = typeof playlistSongs.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type SongComment = typeof songComments.$inferSelect;
export type UserListeningHistory = typeof userListeningHistory.$inferSelect;
export type Game = typeof games.$inferSelect;
export type SongRequest = typeof songRequests.$inferSelect;
export type InsertSongRequest = z.infer<typeof insertSongRequestSchema>;
export type ShortLink = typeof shortLinks.$inferSelect;
export type InsertShortLink = z.infer<typeof insertShortLinkSchema>;
export type LibraryEntry = typeof libraryEntries.$inferSelect;
export type InsertLibraryEntry = z.infer<typeof insertLibraryEntrySchema>;

// Extended Schemas for Forms
export const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" });

export const registerSchema = insertUserSchema
  .extend({
    password: passwordSchema,
    confirmPassword: z.string(),
    email: z.string().email({ message: "Please enter a valid email address" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export const updateProfileSchema = z.object({
  displayName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
  dateOfBirth: z.date().optional(),
  profileImage: z.string().optional(),
  favoriteArtists: z.array(z.string()).optional(),
  favoriteSongs: z.array(z.number()).optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional(),
  confirmNewPassword: z.string().optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: "Current password is required to change password",
  path: ["currentPassword"],
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false;
  }
  return true;
}, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"],
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type RequestPasswordResetData = z.infer<typeof requestPasswordResetSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
