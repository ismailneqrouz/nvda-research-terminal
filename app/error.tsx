'use client';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="panel mx-auto mt-16 max-w-lg p-6">
      <div className="text-[13px] font-semibold text-down">This section failed to load</div>
      <p className="mt-2 text-[12.5px] leading-5 text-muted">
        {error.message.includes('DATABASE_URL') || error.message.includes('Postgres')
          ? 'The PostgreSQL data provider is unavailable. Check DATABASE_URL and run the migration and seed scripts.'
          : 'An unexpected error occurred while computing this section. No partial or estimated figures are shown in its place.'}
      </p>
      <pre className="mt-3 overflow-x-auto rounded bg-bg p-2 text-[11px] text-faint">{error.message}</pre>
      <button onClick={reset} className="mt-4 rounded border border-line px-3 py-1.5 text-[12px] hover:border-faint">Try again</button>
    </div>
  );
}
