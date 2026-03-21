export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="h-9 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse mb-2" />
      <div className="h-5 w-64 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mb-8" />
      <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
