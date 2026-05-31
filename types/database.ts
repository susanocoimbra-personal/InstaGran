export type UserRole = 'parent' | 'grandmother' | 'grandfather';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar_emoji: string;
  expo_push_token: string | null;
  created_at: string;
}

export interface Album {
  id: string;
  name: string;
  emoji: string;
  created_by: string;
  created_at: string;
  // Joined
  photos_count?: number;
  cover_photo?: string | null;
}

export interface Photo {
  id: string;
  uploaded_by: string;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  album_id: string | null;
  /** Photos uploaded together share a group_id; a lone photo has null. */
  group_id?: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
  // Joined fields
  user?: User;
  album?: Album;
  comments_count?: number;
  reactions?: Reaction[];
}

// A feed entry: either a single photo or a group (carousel) of photos uploaded
// together. The first photo is the "anchor" — it carries the caption,
// reactions and comments for the whole post (Instagram model).
export interface FeedPost {
  anchor: Photo;
  photos: Photo[];
}

export interface Comment {
  id: string;
  photo_id: string;
  user_id: string;
  text: string;
  created_at: string;
  // Joined
  user?: User;
}

export interface Reaction {
  id: string;
  photo_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  // Joined
  user?: User;
}
