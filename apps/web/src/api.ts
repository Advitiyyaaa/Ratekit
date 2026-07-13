import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true, // required for BetterAuth session cookies
});

// ─── Types ──────────────────────────────────────────────────────────────

export interface ConfigField {
  name: string;
  type: 'number';
  label: string;
  description: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

export interface Algorithm {
  _id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  burstTolerance: string;
  accuracy: string;
  recommended: boolean;
  tradeoffs: string;
  configFields: ConfigField[];
}

export interface DocMeta {
  slug: string;
  title: string;
  description: string;
  order?: number;
  algorithm?: string;
}

export interface DocContent {
  meta: Record<string, unknown>;
  html: string;
  markdown: string;
}

export interface SimulationTick {
  time: number;
  allowed: number;
  denied: number;
  remaining: number;
  totalAllowed: number;
  totalDenied: number;
}

export interface SimulationResult {
  algorithm: string;
  config: Record<string, number>;
  totalRequests: number;
  requestsPerSecond: number;
  summary: { totalAllowed: number; totalDenied: number };
  timeline: SimulationTick[];
}

// ─── API Functions ──────────────────────────────────────────────────────

export async function fetchAlgorithms(): Promise<Algorithm[]> {
  const { data } = await api.get<Algorithm[]>('/algorithms');
  return data;
}

export async function fetchAlgorithm(slug: string): Promise<Algorithm> {
  const { data } = await api.get<Algorithm>(`/algorithms/${slug}`);
  return data;
}

export async function fetchDocs(): Promise<DocMeta[]> {
  const { data } = await api.get<DocMeta[]>('/docs');
  return data;
}

export async function fetchDoc(slug: string): Promise<DocContent> {
  const { data } = await api.get<DocContent>(`/docs/${slug}`);
  return data;
}

export async function runSimulation(params: {
  algorithm: string;
  config: Record<string, number>;
  totalRequests: number;
  requestsPerSecond: number;
}): Promise<SimulationResult> {
  const { data } = await api.post<SimulationResult>('/playground/simulate', params);
  return data;
}
