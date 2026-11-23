import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="panel mx-auto mt-16 max-w-lg p-6">
      <div className="text-[13px] font-semibold">Page not found</div>
      <p className="mt-2 text-[12.5px] text-muted">This section does not exist. Use the sidebar or press ⌘K to search.</p>
      <Link href="/" className="mt-4 inline-block text-[12px] link">Back to overview</Link>
    </div>
  );
}
