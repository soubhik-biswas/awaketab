export type TFetch = (url: string, init?: RequestInit) => Promise<Response>;
export type TRow = Record<string, string | number | undefined>;
export type TSection = { rows: TRow[] } | { error: string };

export interface IMetricsOptions {
  since: string;
  feedback: boolean;
  limit: number;
  dataset: string;
  help: boolean;
}

export interface IPlanStep {
  name: string;
  sql: string;
  fallback?: string;
  reduce?: (rows: TRow[]) => TRow[];
}

export interface IFeedbackItem {
  rating?: string;
  topics?: string[];
  text?: string;
  device?: string;
  browser?: string;
  sessions?: number;
  version?: string;
  at?: number;
}

export const DATASET: string;
export const NOTE: string;
export function parseArgs(argv: readonly string[]): IMetricsOptions;
export function plan(dataset: string, since: string): IPlanStep[];
export function collect(
  steps: readonly IPlanStep[],
  run: (sql: string) => Promise<TRow[]>,
): Promise<Record<string, TSection>>;
export function formatNumber(value: unknown): string;
export function percent(part: unknown, whole: unknown): string;
export function duration(totalMinutes: unknown): string;
export function weightedMedian(pairs: readonly { value: number; weight: number }[]): number | null;
export function dayLabel(value: unknown): string;
export function stamp(ms: number, timeZone: string): string;
export function table(headers: readonly string[], rows: readonly (readonly (string | number)[])[]): string[];
export function formatReport(
  data: Record<string, TSection | undefined>,
  options: { since: string; now: number; timeZone: string },
): string;
export function formatFeedback(items: readonly IFeedbackItem[], options: { limit: number; timeZone: string }): string;
export function sqlRunner(env: { account: string; token: string }, fetchFn?: TFetch): (sql: string) => Promise<TRow[]>;
export function readFeedback(
  env: { account: string; token: string; namespace: string },
  fetchFn?: TFetch,
): Promise<IFeedbackItem[]>;
