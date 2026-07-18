import { useEffect, useState, useCallback, useRef, memo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Play, RotateCcw, Loader2, Share2, Download, CheckCircle2, Star, ChevronRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  fetchAlgorithms,
  runSimulation,
  type Algorithm,
  type SimulationTick,
} from '../api';
import { ConfigPanel } from '../components/ConfigPanel';

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function RichTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  const time = typeof label === 'number' ? `${(label / 1000).toFixed(2)}s` : label;
  return (
    <div className="p-3 text-xs border-2 border-border bg-surface text-text-primary shadow-[4px_4px_0px_0px_var(--color-shadow)] min-w-[140px]">
      <p className="font-mono text-text-muted mb-2">⏱ {time}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state SVG ──────────────────────────────────────────────────────────

function EmptyChartState({ running }: { running: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-[350px] gap-4 text-text-muted">
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="0" y="60" width="120" height="1" stroke="var(--color-border)" strokeWidth="1" />
        <polyline
          points="0,60 20,60 35,60 55,60 75,60 95,60 120,60"
          stroke="var(--color-border)"
          strokeWidth="2"
          strokeDasharray="5 5"
          fill="none"
        />
        <path
          d="M 0 55 Q 20 40 35 42 Q 50 44 55 38 Q 65 28 75 20 Q 90 10 120 8"
          stroke="var(--color-text-primary)"
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="none"
          opacity="0.4"
        />
        <circle cx="60" cy="35" r="14" fill="var(--color-surface-hover)" stroke="var(--color-border)" strokeWidth="1" />
        <path d="M55 35 L59 39 L65 31" stroke="var(--color-text-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      </svg>
      <div className="text-center">
        <p className="text-sm font-medium text-text-secondary mb-1">
          {running ? 'Running simulation…' : 'No data yet'}
        </p>
        <p className="text-xs text-text-muted">
          {running ? 'Crunching numbers…' : 'Configure params on the left, then hit Run Simulation →'}
        </p>
      </div>
    </div>
  );
}

// ─── Animated count-up number ─────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    let start = from;
    const step = (to - from) / 30;
    const timer = setInterval(() => {
      start += step;
      if ((step > 0 && start >= to) || (step < 0 && start <= to)) {
        setDisplayed(to);
        clearInterval(timer);
      } else {
        setDisplayed(Math.round(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <>{displayed}</>;
}

// ─── Slider with floating tooltip ────────────────────────────────────────────

function SliderWithTooltip({
  id, min, max, step, value, onChange,
  label, unit = '',
}: {
  id: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void;
  label: string; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-text-primary" htmlFor={id}>{label}</label>
        <span className="text-sm font-mono text-text-primary font-bold">{value}{unit}</span>
      </div>
      <div className="relative">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rate-range"
          style={{
            background: `linear-gradient(to right, var(--color-text-primary) 0%, var(--color-text-primary) ${pct}%, var(--color-surface-hover) ${pct}%, var(--color-surface-hover) 100%)`,
            border: '2px solid var(--color-border)',
          }}
        />
        {/* Min/Max labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-text-muted">{min}</span>
          <span className="text-[10px] text-text-muted">{max}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Memoized Simulation Chart ────────────────────────────────────────────────

const SimulationChart = memo(function SimulationChart({
  timeline, summary, running, handleDownloadCSV
}: {
  timeline: SimulationTick[];
  summary: { totalAllowed: number; totalDenied: number } | null;
  running: boolean;
  handleDownloadCSV: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 animate-fade-in-up">
          <div className="brutal-card p-4 text-center bg-surface" style={{ cursor: 'default' }}>
            <div className="text-2xl font-black text-success">
              <AnimatedNumber value={summary.totalAllowed} />
            </div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Allowed</div>
          </div>
          <div className="brutal-card p-4 text-center bg-surface" style={{ cursor: 'default' }}>
            <div className="text-2xl font-black text-danger">
              <AnimatedNumber value={summary.totalDenied} />
            </div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Denied</div>
          </div>
          <div className="brutal-card p-4 text-center bg-surface" style={{ cursor: 'default' }}>
            <div className="text-2xl font-black text-text-primary">
              <AnimatedNumber
                value={summary.totalAllowed + summary.totalDenied > 0
                  ? Math.round((summary.totalAllowed / (summary.totalAllowed + summary.totalDenied)) * 100)
                  : 0}
              />%
            </div>
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">Pass Rate</div>
          </div>
        </div>
      )}

      {/* Main chart */}
      <div className="brutal-card p-5 bg-surface" style={{ cursor: 'default' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Requests Over Time
          </h3>
          {timeline.length > 0 && (
            <button onClick={handleDownloadCSV} className="btn-secondary text-xs py-1 px-2">
              <Download size={12} /> Export CSV
            </button>
          )}
        </div>
        {timeline.length > 0 ? (
          <div className="animate-fade-in">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDenied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5252" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff5252" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.25} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}s`}
                  stroke="var(--color-text-muted)"
                  fontSize={12}
                />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip content={<RichTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="allowed" name="Allowed" stroke="#00e676" strokeWidth={2} fillOpacity={1} fill="url(#colorAllowed)" />
                <Area type="monotone" dataKey="denied"  name="Denied"  stroke="#ff5252" strokeWidth={2} fillOpacity={1} fill="url(#colorDenied)"  />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChartState running={running} />
        )}
      </div>

      {/* Remaining capacity chart */}
      {timeline.length > 0 && (
        <div className="brutal-card p-5 animate-fade-in-up bg-surface" style={{ cursor: 'default' }}>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            Remaining Capacity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.25} />
              <XAxis dataKey="time" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}s`} stroke="var(--color-text-muted)" fontSize={12} />
              <YAxis stroke="var(--color-text-muted)" fontSize={12} />
              <Tooltip content={<RichTooltip />} />
              <Area type="monotone" dataKey="remaining" name="Remaining" stroke="#00d4ff" strokeWidth={2} fillOpacity={1} fill="url(#colorRemaining)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

// ─── PlaygroundPage ───────────────────────────────────────────────────────────

export function PlaygroundPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    searchParams.get('algorithm') ?? 'token-bucket',
  );
  const [config, setConfig] = useState<Record<string, number>>({});
  const [totalRequests, setTotalRequests] = useState(
    Number(searchParams.get('totalRequests')) || 100,
  );
  const [requestsPerSecond, setRequestsPerSecond] = useState(
    Number(searchParams.get('rps')) || 20,
  );
  const [timeline, setTimeline] = useState<SimulationTick[]>([]);
  const [summary, setSummary] = useState<{ totalAllowed: number; totalDenied: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [runProgress, setRunProgress] = useState(0);

  useEffect(() => {
    fetchAlgorithms().then(setAlgorithms).catch(console.error);
  }, []);

  const selectedAlgorithm = algorithms.find((a) => a.slug === selectedSlug);

  // Initialize config from algorithm defaults (also read from URL if present)
  useEffect(() => {
    if (!selectedAlgorithm) return;
    const defaults: Record<string, number> = {};
    for (const field of selectedAlgorithm.configFields) {
      const fromUrl = searchParams.get(field.name);
      defaults[field.name] = fromUrl ? Number(fromUrl) : field.defaultValue;
    }
    setConfig(defaults);
  }, [selectedAlgorithm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConfigChange = useCallback((name: string, value: number) => {
    setConfig((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Run simulation with animated progress bar
  const handleRun = async () => {
    setRunning(true);
    setHasRun(true);
    setRunProgress(20);
    const t1 = setTimeout(() => setRunProgress(60), 200);
    const t2 = setTimeout(() => setRunProgress(85), 500);
    try {
      const result = await runSimulation({
        algorithm: selectedSlug,
        config,
        totalRequests,
        requestsPerSecond,
      });
      setRunProgress(100);
      setTimeout(() => setRunProgress(0), 400);
      setTimeline(result.timeline);
      setSummary(result.summary);
    } catch (error) {
      console.error('Simulation failed:', error);
      setRunProgress(0);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setRunning(false);
    }
  };

  const handleReset = () => {
    setTimeline([]);
    setSummary(null);
    setHasRun(false);
    setRunProgress(0);
  };

  // Share: encode current setup into URL
  const handleShare = async () => {
    const params = new URLSearchParams({
      algorithm: selectedSlug,
      totalRequests: String(totalRequests),
      rps: String(requestsPerSecond),
      ...Object.fromEntries(Object.entries(config).map(([k, v]) => [k, String(v)])),
    });
    const url = `${window.location.origin}/playground?${params.toString()}`;
    await navigator.clipboard.writeText(url);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
    // Also update the current URL without reload
    navigate(`/playground?${params.toString()}`, { replace: true });
  };

  // CSV export
  const handleDownloadCSV = useCallback(() => {
    if (!timeline.length) return;
    const headers = ['time_ms', 'allowed', 'denied', 'remaining', 'totalAllowed', 'totalDenied'];
    const rows = timeline.map((t) =>
      [t.time, t.allowed, t.denied, t.remaining, t.totalAllowed, t.totalDenied].join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ratekit-${selectedSlug}-simulation.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [timeline, selectedSlug]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Toast */}
      {shareToast && (
        <div className="toast info">
          <CheckCircle2 size={14} /> Share link copied!
        </div>
      )}

      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold mb-2">Playground</h1>
        <p className="text-text-secondary text-lg">
          Pick an algorithm, tune parameters, fire simulated requests, and watch results in real time.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* ── Sidebar: Config & Controls ─────────────────────────────────── */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">
          
          {/* Algorithm card-picker */}
          <div className="brutal-card p-5 bg-surface" style={{ cursor: 'default' }}>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-3 border-b-2 border-border pb-2">
              Algorithm
            </h3>
            <div className="flex flex-col gap-2">
              {algorithms.map((a) => (
                <button
                  key={a.slug}
                  onClick={() => setSelectedSlug(a.slug)}
                  className={`algo-radio-card ${selectedSlug === a.slug ? 'selected' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {a.name}
                      </span>
                      {a.recommended && (
                        <span className="flex items-center gap-0.5 bg-success text-black px-1.5 py-0.5 border border-border text-[10px] font-bold">
                          <Star size={10} fill="currentColor" /> Best
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary font-medium mt-1 truncate">{a.complexity} · {a.burstTolerance} burst</p>
                  </div>
                  {selectedSlug === a.slug && (
                    <ChevronRight size={16} className="flex-shrink-0 self-center" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Config */}
          {selectedAlgorithm && (
            <div className="brutal-card p-5 bg-surface" style={{ cursor: 'default' }}>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 border-b-2 border-border pb-2">
                Parameters
              </h3>
              <ConfigPanel
                fields={selectedAlgorithm.configFields}
                values={config}
                onChange={handleConfigChange}
              />
            </div>
          )}

          {/* Simulation settings */}
          <div className="brutal-card p-5 bg-surface" style={{ cursor: 'default' }}>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 border-b-2 border-border pb-2">
              Simulation
            </h3>
            <div className="flex flex-col gap-5">
              <SliderWithTooltip
                id="totalRequests"
                label="Total Requests"
                min={10}
                max={500}
                step={10}
                value={totalRequests}
                onChange={setTotalRequests}
              />
              <SliderWithTooltip
                id="rps"
                label="Requests / Second"
                min={1}
                max={100}
                step={1}
                value={requestsPerSecond}
                onChange={setRequestsPerSecond}
                unit=" rps"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="brutal-card p-5 bg-surface flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1 relative overflow-hidden">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="btn-primary w-full relative z-10 justify-center"
                >
                  {running ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  {running ? 'Running…' : 'Run'}
                </button>
              </div>
              {hasRun && (
                <button onClick={handleReset} className="btn-secondary px-3">
                  <RotateCcw size={16} />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button onClick={handleShare} className="btn-secondary flex-1 justify-center text-xs py-2 px-3">
                <Share2 size={14} /> Share
              </button>
              <button onClick={handleDownloadCSV} disabled={timeline.length === 0} className="btn-secondary flex-1 justify-center text-xs py-2 px-3">
                <Download size={14} /> CSV
              </button>
            </div>
          </div>

        </div>
        {/* ── Main Panel: Chart ────────────────────────────────────────── */}
        <div className="lg:col-span-8 xl:col-span-9">
          <SimulationChart
            timeline={timeline}
            summary={summary}
            running={running}
            handleDownloadCSV={handleDownloadCSV}
          />
        </div>
      </div>
    </div>
  );
}
