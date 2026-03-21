export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      <div className="flex items-start gap-5 mb-6">
        <div className="w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ))}
      </div>
      <div className="h-60 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" style={{ width: `${90 - i * 10}%` }} />
        ))}
      </div>
    </div>
  );
}
