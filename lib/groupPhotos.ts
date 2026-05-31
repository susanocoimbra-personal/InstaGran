import type { Photo, FeedPost } from '@/types/database';

// Collapse a flat, newest-first photo list into feed posts. Photos that share a
// group_id (uploaded together) become one carousel post; ungrouped photos are
// posts of one. The anchor is the OLDEST photo in the group (the first one
// uploaded), so caption/reactions/comments live on a stable, predictable row
// and the carousel reads in capture order.
export function groupPhotos(photos: Photo[]): FeedPost[] {
  const groups = new Map<string, Photo[]>();
  const posts: FeedPost[] = [];

  for (const photo of photos) {
    if (!photo.group_id) {
      // Lone photo — its own post.
      posts.push({ anchor: photo, photos: [photo] });
      continue;
    }
    const existing = groups.get(photo.group_id);
    if (existing) {
      existing.push(photo);
    } else {
      const arr = [photo];
      groups.set(photo.group_id, arr);
      // Reserve the post's slot at the position of the group's newest photo
      // (photos arrive newest-first, so this is the first one we see).
      posts.push({ anchor: photo, photos: arr });
    }
  }

  // Within each group, order photos oldest→newest and anchor on the oldest.
  for (const post of posts) {
    if (post.photos.length > 1) {
      post.photos.sort((a, b) => a.created_at.localeCompare(b.created_at));
      post.anchor = post.photos[0];
    }
  }

  return posts;
}
