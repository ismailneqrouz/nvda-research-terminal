import type { Metadata } from 'next';
import { getResearchData } from '@/lib/data/provider';
import { SEGMENTS_ANNUAL, SEGMENTS_FY27 } from '@/lib/data/financials';
import { CUSTOMER_GROUPS_Q3, DEPENDENCIES, MOAT, VALUE_CHAIN } from '@/lib/data/context';
import { cn, pct, usdM } from '@/lib/format';
import { Metric, MetricGrid } from '@/components/data/metric';
import { Interpretation, PageHeader, Panel, SectionTitle } from '@/components/data/section';
import { SourceRef } from '@/components/data/source-ref';
import { StatusBadge } from '@/components/data/status';
import { SeriesChart } from '@/components/charts/series-chart';

export const metadata: Metadata = { title: 'Business Model' };

const STACK = [
  { name: 'GPUs', text: 'Hopper → Blackwell → Vera Rubin (shipping Q3 FY2027). Annual architecture cadence; each generation sold as chips, boards (HGX) and full racks.' },
  { name: 'CPUs', text: 'Grace and Vera Arm-based CPUs paired with GPUs; management expects Vera CPU revenue to more than double in FY2028 as Meta and OpenAI adopt it.' },
  { name: 'NVLink', text: 'Proprietary GPU-to-GPU interconnect that lets 72 GPUs act as one accelerator (NVL72). The main reason racks — not chips — are the unit of competition.' },
  { name: 'Networking', text: 'InfiniBand (Mellanox, acquired 2020) and Spectrum-X Ethernet for scale-out; competes with Broadcom and Arista.' },
  { name: 'AI systems', text: 'DGX/HGX reference designs and NVL72 racks built by Foxconn, Quanta, Dell, Supermicro and others; DGX Cloud capacity.' },
  { name: 'Software', text: 'CUDA, cuDNN, TensorRT, Dynamo, NIM micro-services and AI Enterprise licences. Mostly bundled; monetised through hardware pricing.' },
  { name: 'Groq / LPU', text: 'Low-latency inference technology licensed/acquired for ≈$20B (Dec 2025); pairs LPU with Vera Rubin for inference.' },
];

export default async function BusinessModelPage() {
  const { store: s } = await getResearchData();
  const segData = SEGMENTS_ANNUAL.map((y) => ({ label: y.key, dc: y.dataCenter, gaming: y.gaming, proviz: y.proViz, auto: y.automotive, oem: y.oemOther }));
  const dcShare = SEGMENTS_ANNUAL.map((y) => ({ label: y.key, share: y.dataCenter / s.val('revenue', y.key)! }));
  const q3Total = SEGMENTS_FY27.dataCenter + SEGMENTS_FY27.edgeComputing;

  return (
    <>
      <PageHeader
        title="Business Model & Competitive Advantage"
        description="What NVIDIA sells, who pays for it, why customers keep paying premium prices — and the dependencies that could undo it."
      />
      <MetricGrid cols="grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Data Center revenue (Q3 FY27)" value={usdM(SEGMENTS_FY27.dataCenter)} delta={{ text: pct(SEGMENTS_FY27.dataCenterYoY, 0, true), positive: true }} sub="y/y" status="reported" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Edge Computing (Q3 FY27)" value={usdM(SEGMENTS_FY27.edgeComputing)} delta={{ text: pct(SEGMENTS_FY27.edgeYoY, 0, true), positive: true }} sub="y/y" status="reported" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Data Center share" value={pct(SEGMENTS_FY27.dataCenter / q3Total, 1)} sub="of Q3 revenue" status="calculated" sourceIds={['nvda-q3fy27-pr']} />
        <Metric label="Hyperscale revenue (Q3)" value={usdM(SEGMENTS_FY27.hyperscale)} sub={`${pct(SEGMENTS_FY27.hyperscale / SEGMENTS_FY27.dataCenter, 0)} of Data Center`} status="reported" sourceIds={['nvda-q3fy27-cfo', 'q3-xeno']} />
        <Metric label="China Hopper sales (Q3)" value={usdM(SEGMENTS_FY27.chinaHopper)} sub="Q4 guide assumes zero" status="reported" sourceIds={['nvda-q3fy27-cfo']} />
        <Metric label="Gaming revenue FY2026" value={usdM(16000)} sub="last year of old segment split" status="reported" sourceIds={['nvda-q4fy26-pr']} />
      </MetricGrid>

      <SectionTitle>Revenue composition</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Revenue by market platform, FY2022–FY2026" subtitle="Reporting structure used through FY2026" sourceIds={['nvda-10k', 'nvda-q4fy26-pr']}>
          <SeriesChart data={segData} series={[{ key: 'dc', name: 'Data Center', stack: 's' }, { key: 'gaming', name: 'Gaming', stack: 's' }, { key: 'proviz', name: 'Pro Visualization', stack: 's' }, { key: 'auto', name: 'Automotive', stack: 's' }, { key: 'oem', name: 'OEM & Other', stack: 's' }]} format="usdM" height={260} note="FY2026 platform figures disclosed to $0.1B; OEM & Other for FY2026 is the calculated remainder." />
        </Panel>
        <Panel title="Data Center share of revenue">
          <SeriesChart data={dcShare} series={[{ key: 'share', name: 'Data Center share' }]} format="pct" height={200} />
          <div className="mt-3 overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Platform</th>{SEGMENTS_ANNUAL.map((y) => <th key={y.key} className="n">{y.key}</th>)}</tr></thead>
              <tbody>
                {(['dataCenter', 'gaming', 'proViz', 'automotive', 'oemOther'] as const).map((k) => (
                  <tr key={k}>
                    <td className="text-muted">{{ dataCenter: 'Data Center', gaming: 'Gaming', proViz: 'Pro Visualization', automotive: 'Automotive', oemOther: 'OEM & Other' }[k]}</td>
                    {SEGMENTS_ANNUAL.map((y) => <td key={y.key} className="n">{pct((y[k] ?? 0) / s.val('revenue', y.key)!, 1)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="New segment structure (from Q1 FY2027)" subtitle="Q3 FY2027" sourceIds={['nvda-q3fy27-pr', 'nvda-q3fy27-cfo']}>
          <div className="prose-research">
            <p><strong>Data Center</strong> ({usdM(SEGMENTS_FY27.dataCenter)}): compute and networking for hyperscalers, AI clouds, model builders, sovereigns and enterprises. <strong>Edge Computing</strong> ({usdM(SEGMENTS_FY27.edgeComputing)}): PCs, gaming, automotive, robotics and other edge devices. Historical segment data are not restated in the sources used here, so the FY2022–FY2026 chart keeps the old platform split.</p>
          </div>
          <div className="mt-3 space-y-2">
            {CUSTOMER_GROUPS_Q3.map((c, i) => (
              <div key={c.name}>
                <div className="flex justify-between text-[12px]"><span className="text-muted">{c.name}</span><span className="num">{usdM(c.value)} · {pct(c.value / SEGMENTS_FY27.dataCenter, 0)}</span></div>
                <div className="mt-1 h-2 rounded-sm bg-line"><div className="h-2 rounded-sm" style={{ width: `${(c.value / SEGMENTS_FY27.dataCenter) * 100}%`, background: i ? '#3987e5' : '#199e70' }} /></div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Customer concentration" right={<StatusBadge status="reported" />} sourceIds={['q2-commitments', 'q3-xeno']}>
          <ul className="list-disc space-y-1.5 pl-4 text-[12.5px] leading-5 text-ink/85">
            <li>Hyperscale customers generated {usdM(SEGMENTS_FY27.hyperscale)} (≈{pct(SEGMENTS_FY27.hyperscale / q3Total, 0)} of total revenue) in Q3 FY2027.</li>
            <li>At the end of Q2 FY2027, five direct customers each accounted for 10–22% of accounts receivable.</li>
            <li>NVIDIA discloses revenue by customer group, not by named customer; many end users (e.g. AI labs) buy indirectly via clouds and OEMs.</li>
            <li>Individual customer shares of revenue for Q3: <em className="text-faint">Data unavailable</em> in the sources used.</li>
          </ul>
        </Panel>
      </div>

      <SectionTitle>Hardware and software ecosystem</SectionTitle>
      <div className="grid gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {STACK.map((x) => (
          <div key={x.name} className="bg-panel p-4">
            <div className="mb-1 text-[13px] font-semibold">{x.name}</div>
            <p className="text-[12px] leading-5 text-muted">{x.text}</p>
          </div>
        ))}
        <div className="bg-panel p-4">
          <div className="mb-1 text-[13px] font-semibold">Developer adoption & enterprise</div>
          <p className="text-[12px] leading-5 text-muted">CUDA is the default target for PyTorch and most AI libraries; enterprises reach NVIDIA through OEMs (Dell, HPE, Lenovo) and software partners. Precise developer counts are company claims and are not reproduced here.</p>
        </div>
      </div>

      <SectionTitle>Competitive moat</SectionTitle>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Moat assessment" right={<StatusBadge status="assessment" />} bodyClass="p-0">
          <table className="tbl">
            <thead><tr><th>Factor</th><th>Strength</th><th>Assessment</th></tr></thead>
            <tbody>
              {MOAT.map((m) => (
                <tr key={m.factor}>
                  <td className="whitespace-nowrap font-medium">{m.factor}</td>
                  <td><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn('h-2.5 w-3 rounded-[1px]', i <= m.rating ? 'bg-up' : 'bg-line')} />)}</div></td>
                  <td className="whitespace-normal text-[12px] leading-5 text-ink/85">{m.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Key dependencies">
          <div className="space-y-3">
            {DEPENDENCIES.map((d) => (
              <div key={d.name}>
                <div className="flex items-center gap-2 text-[12.5px] font-medium">
                  <span className={cn('rounded-[3px] px-1.5 py-px text-[10px] uppercase tracking-wider', d.level === 'critical' ? 'bg-down/15 text-down' : d.level === 'high' ? 'bg-warn/15 text-warn' : 'bg-raised text-muted')}>{d.level}</span>
                  {d.name}
                </div>
                <p className="mt-0.5 text-[12px] leading-5 text-muted">{d.text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <SectionTitle>Where NVIDIA earns money in the AI value chain</SectionTitle>
      <Panel bodyClass="p-0" title="AI infrastructure value chain" subtitle="From power to applications — NVIDIA’s role and value capture at each layer" right={<StatusBadge status="assessment" />}>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[800px]">
            <thead><tr><th>Layer</th><th>Main players</th><th>NVIDIA’s role</th><th>Value capture</th></tr></thead>
            <tbody>
              {VALUE_CHAIN.map((l) => (
                <tr key={l.layer}>
                  <td className="font-medium">{l.layer}</td>
                  <td className="text-muted">{l.players}</td>
                  <td>{l.nvidia}</td>
                  <td className={cn(l.capture.startsWith('Very') ? 'text-up' : l.capture === 'High' ? 'text-up/80' : 'text-muted')}>{l.capture}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Interpretation>
        <p>NVIDIA captures value where performance is hardest to replicate — the accelerator, the interconnect and the system — and largely gives software away to sell hardware. Its two biggest structural vulnerabilities are on either side: <strong>upstream</strong>, total reliance on TSMC and HBM suppliers (who are also raising prices), and <strong>downstream</strong>, customers with the scale and motive to design their own chips. The 2026 move to guarantee partners’ data centers and invest in customers deepens the ecosystem but shifts risk onto NVIDIA’s balance sheet. <SourceRef ids={['nvda-q3fy27-cfo', 'asic-toms']} /></p>
      </Interpretation>
    </>
  );
}
