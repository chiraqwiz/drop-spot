const gradients = [
  'from-violet-500 to-pink-500',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-400',
  'from-blue-500 to-cyan-400',
  'from-rose-500 to-red-400',
];

export function gradientFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return gradients[hash % gradients.length];
}

export function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-xs' : size === 'lg' ? 'h-12 w-12' : 'h-11 w-11';
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} className={`${sizeClass} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradientFor(name)} font-semibold text-white`}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
