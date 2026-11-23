'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/** Tabs whose active tab is kept in the URL (?tab=) so sections are linkable from search. */
export function UrlTabs({ items, defaultValue }: { items: { value: string; label: string; content: React.ReactNode }[]; defaultValue: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const current = sp.get('tab') ?? defaultValue;
  const value = items.some((i) => i.value === current) ? current : defaultValue;
  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        const p = new URLSearchParams(sp.toString());
        p.set('tab', v);
        p.delete('q');
        router.replace(`${path}?${p.toString()}`, { scroll: false });
      }}
    >
      <TabsList>
        {items.map((i) => <TabsTrigger key={i.value} value={i.value}>{i.label}</TabsTrigger>)}
      </TabsList>
      {items.map((i) => <TabsContent key={i.value} value={i.value}>{i.content}</TabsContent>)}
    </Tabs>
  );
}

/** Reads ?q= for the statement search box. */
export function useQueryParam(name: string) {
  return useSearchParams().get(name) ?? '';
}
