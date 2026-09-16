// Shared by the post card, the post detail page and the moderation queues,
// which all render the same relative timestamps. Kept deliberately coarse:
// "3h ago" is all the feed needs, and a precise clock time would be a
// sharper behavioural signal about a poster than an anonymous app should
// surface by default.
export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
