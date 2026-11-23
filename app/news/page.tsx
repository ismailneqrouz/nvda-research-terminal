import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { PageHeader } from '@/components/data/section';
import { NewsFeed } from '@/components/tools/news-feed';

export const metadata: Metadata = { title: 'News & Events' };

export default async function NewsPage() {
  const { news } = await getResearchData();
  return (
    <>
      <PageHeader
        title="News & Corporate Events"
        description="Earnings, guidance, products, regulation, export controls, governance, litigation, competitor and industry developments. Each item separates what was reported (left) from this platform’s interpretation (right). Unconfirmed media reports are flagged."
      />
      <NewsFeed items={news} />
      <p className="mt-6 text-[11px] text-faint">Insider transactions (Form 4): not included — no Form 4 data was retrieved for this dataset. Coverage through Nov 22, 2026.</p>
    </>
  );
}
