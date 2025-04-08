import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  profileImage: text("profile_image"),
  bio: text("bio"),
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

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  artistId: integer("artist_id"),
  album: text("album"),
  genre: text("genre"),
  year: integer("year"),
  duration: integer("duration").notNull(), // in seconds
  cover: text("cover"),
  filePath: text("file_path").notNull(),
  lyrics: text("lyrics"),
  userId: integer("user_id").notNull(),
  playCount: integer("play_count").default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Song = typeof songs.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type PlaylistSong = typeof playlistSongs.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type SongComment = typeof songComments.$inferSelect;
export type UserListeningHistory = typeof userListeningHistory.$inferSelect;
export type Game = typeof games.$inferSelect;

// Extended Schemas for Forms
export const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

export type LoginData = z.infer<typeof loginSchema>;
