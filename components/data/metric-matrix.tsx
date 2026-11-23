import { cn } from '@/lib/format';
import { Term } from './term';
import { Unavailable } from './status';

export interface MatrixRow {
  label: string;
  term?: string;
  values: (number | null)[];
  fmt: (x: number) => string;
  peers?: (number | null)[];
  benchmark: string;
  read: string;
  higherIsBetter?: boolean;
}

/** Metric × period table with peer comparison and interpretation columns. */
export function MetricMatrix({ periods, peerNames, rows }: { periods: string[]; peerNames?: string[]; rows: MatrixRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="tbl min-w-[1100px]">
        <thead>
          <tr>
            <th className="min-w-[170px]">Metric</th>
            {periods.map((p) => <th key={p} className="n">{p}</th>)}
            {peerNames?.map((p) => <th key={p} className="n text-faint">{p}</th>)}
            <th className="min-w-[200px]">Strong vs weak</th>
            <th className="min-w-[260px]">Interpretation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const last = r.values[r.values.length - 1];
            const prev = r.values[r.values.length - 2];
            const trend = last != null && prev != null ? (last > prev ? '▲' : last < prev ? '▼' : '■') : '';
            const good = r.higherIsBetter === undefined || last == null || prev == null ? null : (last > prev) === r.higherIsBetter;
            return (
              <tr key={r.label}>
                <td className="font-medium">{r.term ? <Term id={r.term}>{r.label}</Term> : r.label}</td>
                {r.values.map((x, i) => (
                  <td key={i} className={cn('n', i === r.values.length - 1 && 'text-ink font-medium')}>
                    {x == null ? <Unavailable /> : r.fmt(x)}
                    {i === r.values.length - 1 && trend && <span className={cn('ml-1 text-[9px]', good == null ? 'text-faint' : good ? 'text-up' : 'text-down')}>{trend}</span>}
                  </td>
                ))}
                {peerNames?.map((p, i) => <td key={p} className="n text-muted">{r.peers?.[i] == null ? <span className="text-faint">—</span> : r.fmt(r.peers[i]!)}</td>)}
                <td className="whitespace-normal text-[11.5px] leading-5 text-muted">{r.benchmark}</td>
                <td className="whitespace-normal text-[11.5px] leading-5 text-ink/85">{r.read}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
