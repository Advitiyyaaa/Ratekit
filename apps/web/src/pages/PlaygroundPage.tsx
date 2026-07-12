import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Play, RotateCcw, Loader2 } from 'lucide-react';
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

export function PlaygroundPage() {
  const [searchParams] = useSearchParams();
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(
    searchParams.get('algorithm') ?? 'token-bucket',
  );
  const [config, setConfig] = useState<Record<string, number>>({});
  const [totalRequests, setTotalRequests] = useState(100);
  const [requestsPerSecond, setRequestsPerSecond] = useState(20);
  const [timeline, setTimeline] = useState<SimulationTick[]>([]);
  const [summary, setSummary] = useState<{ totalAllowed: number; totalDenied: number } | null>(
    null,
  );
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    fetchAlgorithms().then(setAlgorithms).catch(console.error);
  }, []);

  const selectedAlgorithm = algorithms.find((a) => a.slug === selectedSlug);

  // Initialize config from algorithm defaults
  useEffect(() => {
    if (selectedAlgorithm) {
      const defaults: Record<string, number> = {};
      for (const field of selectedAlgorithm.configFields) {
        defaults[field.name] = field.defaultValue;
      }
      setConfig(defaults);
    }
  }, [selectedAlgorithm]);

  const handleConfigChange = useCallback((name: string, value: number) => {
    setConfig((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setHasRun(true);
    try {
      const result = await runSimulation({
        algorithm: selectedSlug,
        config,
        totalRequests,
        requestsPerSecond,
      });
      setTimeline(result.timeline);
      setSummary(result.summary);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setTimeline([]);
    setSummary(null);
    setHasRun(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold mb-2">Playground</h1>
        <p className="text-text-secondary text-lg">
          Pick an algorithm, tune parameters, fire simulated requests, and watch the results in real time.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Config Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Algorithm picker */}
          <div className="glass-card p-5" style={{ cursor: 'default' }}>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
              Algorithm
            </h3>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
            >
              {algorithms.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name} {a.recommended ? '⭐' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Algorithm config */}
          {selectedAlgorithm && (
            <div className="glass-card p-5" style={{ cursor: 'default' }}>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
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
          <div className="glass-card p-5" style={{ cursor: 'default' }}>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Simulation
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-text-primary" htmlFor="totalRequests">
                    Total Requests
                  </label>
                  <span className="text-sm font-mono text-accent">{totalRequests}</span>
                </div>
                <input
                  id="totalRequests"
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={totalRequests}
                  onChange={(e) => setTotalRequests(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${
                      ((totalRequests - 10) / 490) * 100
                    }%, var(--color-surface) ${((totalRequests - 10) / 490) * 100}%, var(--color-surface) 100%)`,
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-text-primary" htmlFor="rps">
                    Requests/Second
                  </label>
                  <span className="text-sm font-mono text-accent">{requestsPerSecond}</span>
                </div>
                <input
                  id="rps"
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={requestsPerSecond}
                  onChange={(e) => setRequestsPerSecond(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${
                      ((requestsPerSecond - 1) / 99) * 100
                    }%, var(--color-surface) ${((requestsPerSecond - 1) / 99) * 100}%, var(--color-surface) 100%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={handleRun} disabled={running} className="btn-primary flex-1">
              {running ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              {running ? 'Running...' : 'Run Simulation'}
            </button>
            {hasRun && (
              <button onClick={handleReset} className="btn-secondary">
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right: Chart + Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-3 gap-4 animate-fade-in-up">
              <div className="glass-card p-4 text-center" style={{ cursor: 'default' }}>
                <div className="text-2xl font-bold text-success">{summary.totalAllowed}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Allowed</div>
              </div>
              <div className="glass-card p-4 text-center" style={{ cursor: 'default' }}>
                <div className="text-2xl font-bold text-danger">{summary.totalDenied}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">Denied</div>
              </div>
              <div className="glass-card p-4 text-center" style={{ cursor: 'default' }}>
                <div className="text-2xl font-bold text-accent">
                  {summary.totalAllowed + summary.totalDenied > 0
                    ? Math.round(
                        (summary.totalAllowed / (summary.totalAllowed + summary.totalDenied)) * 100,
                      )
                    : 0}
                  %
                </div>
                <div className="text-xs text-text-muted uppercase tracking-wider mt-1">
                  Pass Rate
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="glass-card p-5" style={{ cursor: 'default' }}>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
              Requests Over Time
            </h3>
            {timeline.length > 0 ? (
              <div className="animate-fade-in">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={timeline}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4f" />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}s`}
                      stroke="#5a6380"
                      fontSize={12}
                    />
                    <YAxis stroke="#5a6380" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: '#1a2240',
                        border: '1px solid #1e2a4f',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      labelFormatter={(v: number) => `Time: ${(v / 1000).toFixed(1)}s`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="allowed"
                      name="Allowed"
                      stroke="#00e676"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAllowed)"
                    />
                    <Area
                      type="monotone"
                      dataKey="denied"
                      name="Denied"
                      stroke="#ff5252"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorDenied)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[350px] text-text-muted text-sm">
                {running
                  ? 'Running simulation...'
                  : 'Configure parameters and click "Run Simulation" to see results.'}
              </div>
            )}
          </div>

          {/* Remaining capacity chart */}
          {timeline.length > 0 && (
            <div className="glass-card p-5 animate-fade-in-up" style={{ cursor: 'default' }}>
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
                Remaining Capacity
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={timeline}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a4f" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}s`}
                    stroke="#5a6380"
                    fontSize={12}
                  />
                  <YAxis stroke="#5a6380" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#1a2240',
                      border: '1px solid #1e2a4f',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    labelFormatter={(v: number) => `Time: ${(v / 1000).toFixed(1)}s`}
                  />
                  <Area
                    type="monotone"
                    dataKey="remaining"
                    name="Remaining"
                    stroke="#00d4ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRemaining)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
