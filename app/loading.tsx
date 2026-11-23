export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading research data" className="space-y-4">
      <div className="h-8 w-64 animate-pulse rounded bg-panel" />
      <div className="grid grid-cols-2 gap-px md:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-20 animate-pulse bg-panel" />)}</div>
      <div className="h-72 animate-pulse rounded bg-panel" />
    </div>
  );
}
