'use client';
import { useState } from 'react';
import { Segmented } from '@/components/ui/button';
import { SeriesChart, type Fmt, type SeriesDef } from './series-chart';

export interface ChartView {
  key: string;
  label: string;
  data: Record<string, string | number | null>[];
  note?: string;
}

/** A chart with a period selector (e.g. fiscal years vs quarters) and/or a metric selector. */
export function ToggleChart({ views, series, format, height, signColor, metricOptions }: {
  views: ChartView[];
  series: SeriesDef[];
  format: Fmt;
  height?: number;
  signColor?: boolean;
  metricOptions?: { key: string; label: string; series: SeriesDef[]; format: Fmt }[];
}) {
  const [v, setV] = useState(views[0].key);
  const [m, setM] = useState(metricOptions?.[0]?.key ?? '');
  const view = views.find((x) => x.key === v)!;
  const metric = metricOptions?.find((x) => x.key === m);
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {views.length > 1 && <Segmented ariaLabel="Period" value={v} onChange={setV} options={views.map((x) => ({ value: x.key, label: x.label }))} />}
        {metricOptions && <Segmented ariaLabel="Metric" value={m} onChange={setM} options={metricOptions.map((x) => ({ value: x.key, label: x.label }))} />}
      </div>
      <SeriesChart data={view.data} series={metric?.series ?? series} format={metric?.format ?? format} height={height} signColor={signColor} note={view.note} />
    </div>
  );
}
