export function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '—';
  return `${formatDate(date)}, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

export function timeAgo(date: Date | null | undefined): string {
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}
