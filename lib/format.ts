// Shared formatting helpers (PT-PT).

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return date.toLocaleDateString('pt-PT');
}

export function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Soft pastel palette for avatar circle backgrounds.
const AVATAR_BG = ['#F3E0DB', '#DCE8DC', '#EDE0D0', '#DDE4EE', '#F0E4D6', '#E6DDF0'];

export function pickAvatarBg(name: string | undefined): string {
  const seed = (name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_BG[seed % AVATAR_BG.length];
}

// Subtle bubble colors for comment authors.
const BUBBLE_COLORS = ['#F3EDE7', '#E8F0E7', '#EDE7F3', '#FFF3E0', '#E7EFF3', '#F3E7EC'];

export function getBubbleColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BUBBLE_COLORS[Math.abs(hash) % BUBBLE_COLORS.length];
}
