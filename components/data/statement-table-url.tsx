'use client';
import { useSearchParams } from 'next/navigation';
import { StatementTable } from './statement-table';

export function StatementTableUrl(props: Omit<React.ComponentProps<typeof StatementTable>, 'initialQuery'>) {
  const q = useSearchParams().get('q') ?? '';
  return <StatementTable key={q} {...props} initialQuery={q} />;
}
