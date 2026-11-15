/** Small formatting helpers shared by the Overview / Experiments pages. */
export function timeAgo(input) {
  const t = new Date(input).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fullDate(input) {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}
