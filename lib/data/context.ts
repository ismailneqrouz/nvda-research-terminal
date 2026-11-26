/**
 * Business, competition, industry and macro context. Facts carry a sourceId;
 * explanatory text is this platform's analysis.
 */

// ── Macro indicators ───────────────────────────────────────────────────
export interface MacroIndicator {
  id: string;
  name: string;
  value: string;
  asOf: string;
  direction: 'up' | 'down' | 'flat';
  sourceId: string;
  transmission: string[]; // causal chain
  effect: 'headwind' | 'tailwind' | 'mixed';
  sensitivity: string;
}

export const MACRO: MacroIndicator[] = [
  {
    id: 'policy-rate', name: 'Fed funds target range', value: '3.75% – 4.00% (hike expected Dec 9)', asOf: '2026-11-25', direction: 'up', sourceId: 'pce-fed-dec',
    transmission: ['Fed raised in Sep 2026; after hot October PCE data markets treat a Dec 8–9 hike as all but settled', 'Higher risk-free rate → higher WACC', 'Lower present value of distant cash flows → multiple compression for long-duration equities', 'Higher financing cost for debt-funded data centers (neoclouds)'],
    effect: 'headwind',
    sensitivity: 'In the base-case DCF, +1 pt of WACC lowers intrinsic value by roughly 10–12%.',
  },
  {
    id: 'tbill', name: '3-month Treasury bill (risk-free rate)', value: '4.05% (Oct 2026 avg.)', asOf: '2026-11-02', direction: 'up', sourceId: 'fred-tb3ms',
    transmission: ['Cash now yields ≈4% risk-free', 'Raises the hurdle any risky asset must clear', 'Directly lowers Sharpe and Sortino ratios (the numerator is return minus this rate)'],
    effect: 'headwind',
    sensitivity: 'Used month-by-month as the risk-free rate in this platform’s Sharpe, Sortino, Treynor and alpha calculations.',
  },
  {
    id: 'ten-year', name: '10-year Treasury yield', value: '5.12%', asOf: '2026-11-12', direction: 'up', sourceId: 'yields-nov26',
    transmission: ['Long yields above 5% → equity risk premium squeezed', 'FCF yield of NVDA (4.9%) now below the 10-year yield', 'Investors demand cheaper multiples for cyclical earnings'],
    effect: 'headwind',
    sensitivity: 'Directly enters the cost-of-equity build in the DCF (risk-free input).',
  },
  {
    id: 'inflation', name: 'PCE inflation (Fed’s preferred gauge)', value: '3.8% y/y; core 3.3% (Oct 2026)', asOf: '2026-11-25', direction: 'up', sourceId: 'pce-oct26',
    transmission: ['Core PCE at its highest since Nov 2023; CPI +0.4% m/m in Oct; energy-led (gasoline +37% y/y)', 'Keeps the Fed hawkish', 'Component inflation (memory) raises NVIDIA’s cost of revenue — gross margin guided to 71–72%', 'NVIDIA passes costs through via price increases from FY2028'],
    effect: 'headwind',
    sensitivity: 'Each 1 pt of gross-margin compression ≈ $4B of annual operating income at FY2027E revenue.',
  },
  {
    id: 'gdp', name: 'US real GDP growth', value: '4.3% SAAR (Q3 2026, second estimate)', asOf: '2026-11-25', direction: 'up', sourceId: 'pce-oct26-reuters',
    transmission: ['Growth supported by business investment, including AI infrastructure', 'Strong nominal growth sustains enterprise IT budgets', 'But strong growth + inflation = higher rates'],
    effect: 'mixed',
    sensitivity: 'NVIDIA demand is driven more by hyperscaler capex than by GDP; correlation is weak in the short run.',
  },
  {
    id: 'capex', name: 'Hyperscaler capex (Q4 2026 guide)', value: '$241.6B – $270.0B (5 cos.)', asOf: '2026-10-29', direction: 'up', sourceId: 'capex-q4-guides',
    transmission: ['Hyperscaler capex → GPU/system orders with 1–3 quarter lead', 'Q4 guide above Q3’s $228.3B', 'A capex pause would hit Data Center revenue with operating leverage'],
    effect: 'tailwind',
    sensitivity: 'Hyperscale revenue was $60.1B of $107.6B Data Center revenue in Q3 FY2027.',
  },
  {
    id: 'usd', name: 'US dollar', value: 'Data unavailable (no sourced index level)', asOf: '2026-11-13', direction: 'up', sourceId: 'bis-ifr-nov26',
    transmission: ['NVIDIA prices in USD', 'A stronger dollar raises the local-currency price of systems for non-US buyers (sovereign AI, Europe, Japan)', 'Weak translation effect on costs (largely USD-denominated supply chain)'],
    effect: 'mixed',
    sensitivity: 'Media reported the dollar rose on Nov 13 after inflation data; no index value sourced here.',
  },
  {
    id: 'export', name: 'Export-control regime', value: 'Tightened (BIS IFR, effective Nov 19, 2026)', asOf: '2026-11-19', direction: 'up', sourceId: 'bis-ifr-nov26',
    transmission: ['Licences required for 5 diversion-risk countries and for data centers serving China-HQ companies', 'Fewer eligible buyers / slower deals in Southeast Asia', 'China DC compute already excluded from guidance'],
    effect: 'headwind',
    sensitivity: 'China Hopper sales were $2.4B in Q3 FY2027 (≈2% of revenue).',
  },
  {
    id: 'energy', name: 'Energy prices', value: 'Elevated (gasoline +37.4% y/y, Oct 2026)', asOf: '2026-11-10', direction: 'up', sourceId: 'bls-cpi-oct26',
    transmission: ['Media attribute the energy spike to the US conflict with Iran', 'Higher power cost → higher data-center operating cost', 'Raises value of performance-per-watt leadership; may slow marginal projects'],
    effect: 'mixed',
    sensitivity: 'Power availability, not chip supply, increasingly gates deployments.',
  },
  {
    id: 'subsidies', name: 'Semiconductor subsidies / fiscal policy', value: 'CHIPS Act-era incentives (no new figure sourced)', asOf: '2026-11-22', direction: 'flat', sourceId: 'bea-gdp-q3-26',
    transmission: ['Subsidies support onshore fabs (TSMC Arizona, Intel)', 'Diversifies NVIDIA’s supply base away from Taiwan over time', 'Government spending (+5.3% in Q3 GDP) supports aggregate demand'],
    effect: 'tailwind',
    sensitivity: 'Long-dated; reduces Taiwan tail risk only gradually.',
  },
];

// ── Competition ────────────────────────────────────────────────────────
export interface Competitor {
  name: string;
  product: string;
  type: 'Merchant GPU' | 'Custom ASIC' | 'Merchant accelerator' | 'In-house ASIC';
  software: string;
  performance: string;
  pricing: string;
  efficiency: string;
  availability: string;
  manufacturing: string;
  adoption: string;
  positioning: string;
  threat: 'low' | 'moderate' | 'high';
  sourceIds: string[];
}

export const COMPETITORS: Competitor[] = [
  { name: 'NVIDIA', product: 'Blackwell / Vera Rubin NVL72, Grace & Vera CPU, NVLink, Spectrum-X, InfiniBand', type: 'Merchant GPU', software: 'CUDA, cuDNN, TensorRT, NIM, Dynamo — deepest ecosystem', performance: 'Leader in training and rack-scale inference', pricing: 'Premium; price increases from FY2028', efficiency: 'Leader in perf/W at system level (assessment)', availability: 'Supply secured via $390B commitments', manufacturing: 'TSMC N3/N4 + CoWoS', adoption: 'All hyperscalers, neoclouds, sovereigns, enterprise', positioning: 'Full-stack AI factory', threat: 'low', sourceIds: ['nvda-q3fy27-pr'] },
  { name: 'AMD', product: 'Instinct MI350 / MI450, Helios rack', type: 'Merchant GPU', software: 'ROCm — improving, smaller ecosystem', performance: 'Competitive on memory capacity; rack-scale from late 2026', pricing: 'Below NVIDIA (assessment)', efficiency: 'Data unavailable', availability: 'Deliveries starting late 2026', manufacturing: 'TSMC', adoption: 'Reported 6 GW OpenAI, 6 GW Meta, 2 GW Anthropic', positioning: 'Second source', threat: 'moderate', sourceIds: ['amd-commitments'] },
  { name: 'Broadcom', product: 'Custom XPUs (Google TPU, Meta MTIA, OpenAI), Tomahawk/Jericho Ethernet', type: 'Custom ASIC', software: 'Customer-owned stacks (JAX/XLA, PyTorch)', performance: 'Workload-specific; strong for inference at scale', pricing: 'Lower total cost for the owner (claimed 30–40% savings by proponents)', efficiency: 'High for targeted workloads', availability: '$73B AI backlog disclosed', manufacturing: 'TSMC 3nm/2nm', adoption: 'Google, Meta, OpenAI (10 GW)', positioning: 'Arms dealer to hyperscalers', threat: 'high', sourceIds: ['asic-toms'] },
  { name: 'Google TPU', product: 'TPU v7 “Ironwood”, v8', type: 'In-house ASIC', software: 'JAX / XLA, TensorFlow', performance: 'Competitive for Google workloads; offered via Google Cloud', pricing: 'Internal cost; cloud rental', efficiency: 'High (assessment)', availability: 'Google Cloud only', manufacturing: 'TSMC via Broadcom', adoption: 'Google, Anthropic and cloud customers', positioning: 'Most mature custom alternative', threat: 'high', sourceIds: ['asic-toms', 'semieng-share'] },
  { name: 'Amazon Trainium', product: 'Trainium 3 (2026), Trainium 4', type: 'In-house ASIC', software: 'AWS Neuron SDK', performance: 'Price-performance focus', pricing: 'Discounted vs GPU instances on AWS', efficiency: 'Data unavailable', availability: 'AWS only; Trainium4 capacity reportedly largely pre-sold', manufacturing: 'TSMC (Marvell / Alchip design partners)', adoption: 'Anthropic, AWS internal', positioning: 'AWS cost lever', threat: 'moderate', sourceIds: ['asic-toms'] },
  { name: 'Microsoft Maia', product: 'Maia 200', type: 'In-house ASIC', software: 'Microsoft stack', performance: 'Serves GPT-5.2 and Copilot workloads', pricing: 'Internal', efficiency: 'Data unavailable', availability: 'Azure internal', manufacturing: 'TSMC', adoption: 'Microsoft, OpenAI inference', positioning: 'Inference cost reduction', threat: 'low', sourceIds: ['asic-toms'] },
  { name: 'Intel', product: 'Gaudi 3, Jaguar Shores (planned)', type: 'Merchant accelerator', software: 'oneAPI / OpenVINO', performance: 'Behind leaders (assessment)', pricing: 'Aggressive', efficiency: 'Data unavailable', availability: 'Limited', manufacturing: 'Intel / TSMC', adoption: 'Limited', positioning: 'Turnaround', threat: 'low', sourceIds: ['sa-intc'] },
];

export const MARKET_SHARE = [
  { claim: 'NVIDIA held ~75–81% of AI-accelerator revenue share in H1 2026', source: 'cryptobriefing / analyst estimates (secondary)', sourceId: 'amd-commitments', reliability: 'low' as const },
  { claim: 'NVIDIA holds approximately 70% of the AI chip market; share projected to erode', source: "Tom's Hardware (May 2026)", sourceId: 'asic-toms', reliability: 'medium' as const },
  { claim: 'ASIC-based AI servers projected at 27.8% of shipments in 2026 (a forecast)', source: "Tom's Hardware citing TrendForce", sourceId: 'asic-toms', reliability: 'medium' as const },
  { claim: 'Broadcom and Marvell control roughly 95% of custom AI ASIC co-design', source: "Tom's Hardware", sourceId: 'asic-toms', reliability: 'medium' as const },
  { claim: 'In 2023 NVIDIA had ~90% of installed AI compute and Google ~10%; custom compute gained ~20 pts over three years', source: 'Semiconductor Engineering (opinion)', sourceId: 'semieng-share', reliability: 'medium' as const },
];

// ── Industry structure ─────────────────────────────────────────────────
export const VALUE_CHAIN = [
  { layer: 'Energy & sites', players: 'Utilities, data-center developers', nvidia: 'Guarantees for partner campuses (~$118B)', capture: 'Low' },
  { layer: 'Foundry & packaging', players: 'TSMC (N3/N4, CoWoS), Amkor, ASE', nvidia: 'Customer; single-source leading edge', capture: 'Supplier' },
  { layer: 'Memory', players: 'SK hynix, Samsung, Micron (HBM)', nvidia: 'Multi-year commitments (~$390B total supply)', capture: 'Supplier' },
  { layer: 'Accelerators & CPUs', players: 'NVIDIA, AMD, Broadcom/Marvell ASICs', nvidia: 'GPUs, Grace/Vera CPUs', capture: 'Very high' },
  { layer: 'Systems & networking', players: 'NVIDIA, Arista, Broadcom, Dell, Supermicro, Foxconn', nvidia: 'NVL72 racks, NVLink, InfiniBand, Spectrum-X', capture: 'High' },
  { layer: 'Software & platforms', players: 'NVIDIA CUDA/AI Enterprise, PyTorch, JAX', nvidia: 'CUDA moat; AI Enterprise licences', capture: 'Strategic (indirect)' },
  { layer: 'Clouds & neoclouds', players: 'AWS, Azure, Google Cloud, OCI, CoreWeave, Nebius', nvidia: 'Customers; equity stakes in some (e.g. CoreWeave)', capture: 'Customer' },
  { layer: 'Models & applications', players: 'OpenAI, Anthropic, Google, Meta, enterprises', nvidia: 'End demand; investments in AI labs', capture: 'Customer' },
];

export const INDUSTRY_FACTS = [
  { label: 'Big-4 hyperscaler 2026 capex plans', value: '≈$725B (+77% vs 2025’s $410B)', kind: 'Company guidance (aggregated by FT)', sourceId: 'capex-toms' },
  { label: 'Alphabet 2026 capex guide', value: '$195–205B; “significant increase” for 2027', kind: 'Management guidance', sourceId: 'capex-q4-guides' },
  { label: 'Microsoft CY2026 capex', value: '≈$190B (≈$25B attributed to memory/component inflation)', kind: 'Management guidance', sourceId: 'capex-toms' },
  { label: 'Amazon 2026 capex', value: '≈$220B (raised from $200B)', kind: 'Management guidance', sourceId: 'capex-emarketer' },
  { label: 'Meta 2026 capex', value: '$130–145B; $279B of future data-center lease obligations', kind: 'Management guidance', sourceId: 'capex-emarketer' },
  { label: 'Broadcom AI chip revenue', value: '“Line of sight” to >$100B in 2027', kind: 'Management estimate', sourceId: 'asic-toms' },
  { label: 'ASIC share of AI server shipments', value: '27.8% in 2026', kind: 'Third-party forecast', sourceId: 'asic-toms' },
  { label: 'NVIDIA Data Center revenue (TTM)', value: 'Calculated from reported quarters — see Financial Statements', kind: 'Reported', sourceId: 'nvda-q3fy27-pr' },
];

export const TAILWINDS = ['Agentic AI and inference demand compounding token volumes', 'Sovereign AI programmes', 'Physical AI / robotics (>$25B FY2027 run-rate per management)', 'Annual product cadence keeps NVIDIA ahead on perf/W', 'Rising GPU rental prices (management claim)'];
export const HEADWINDS = ['Custom ASIC adoption at the largest buyers', 'Power and grid constraints', 'Memory cost inflation and allocation', 'Rising interest rates and tighter credit for neoclouds', 'Export controls and geopolitics', 'Investor scrutiny of AI-capex returns and depreciation lives'];

// ── Business model ─────────────────────────────────────────────────────
export const MOAT = [
  { factor: 'Switching costs', rating: 4, text: 'Millions of developers and most AI frameworks are optimised for CUDA first; porting and re-validating large models is costly. Eroding gradually as compilers (Triton, XLA) abstract hardware.' },
  { factor: 'Network effects', rating: 4, text: 'More developers → more libraries → more customers → more developers. Strongest in research and enterprise; weaker at hyperscalers that own their software stacks.' },
  { factor: 'Technological differentiation', rating: 5, text: 'System-level design (GPU + CPU + NVLink + networking + software) delivered on an annual cadence; competitors match individual chips more easily than whole racks.' },
  { factor: 'Pricing power', rating: 5, text: 'Gross margins of 71–75% on hardware and announced price increases for FY2028 despite memory inflation.' },
  { factor: 'Brand strength', rating: 4, text: 'Default choice for AI infrastructure; brand reputation now exposed to governance controversy.' },
  { factor: 'Scale & supply access', rating: 5, text: 'Largest TSMC CoWoS and HBM customer; $390B of supply commitments secure capacity competitors cannot easily obtain.' },
];

export const DEPENDENCIES = [
  { name: 'TSMC (manufacturing & CoWoS)', level: 'critical', text: 'Fabless model: all leading-edge GPUs and advanced packaging come from TSMC, mostly in Taiwan.' },
  { name: 'HBM memory suppliers', level: 'high', text: 'SK hynix, Samsung, Micron. Memory is the main driver of the commitments increase and of the Q4 gross-margin dip.' },
  { name: 'Hyperscale cloud providers', level: 'high', text: '$60.1B of Q3 Data Center revenue (≈56%); these customers are also building competing chips.' },
  { name: 'AI labs & neoclouds', level: 'medium', text: 'Fast-growing but capital-market-dependent buyers; NVIDIA has equity stakes in several.' },
  { name: 'Export licences', level: 'medium', text: 'U.S. licences now required for China and five more countries.' },
];

export const CUSTOMER_GROUPS_Q3 = [
  { name: 'Hyperscale customers', value: 60100, sourceId: 'q3-xeno' },
  { name: 'AI clouds, industrial & enterprise (calculated remainder)', value: 107600 - 60100, sourceId: 'q3-xeno' },
];
