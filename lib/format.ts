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

// Short gallery-label date, e.g. "14 MAR". Uppercased by the .label class.
export function formatPlateDate(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
    .replace('.', '');
}
