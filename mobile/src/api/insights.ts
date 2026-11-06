import { api } from './client';
import { todayIso } from '../utils/format';
import type { Insights } from './types';

// The Home, Insights and Budget tabs all show something from /ai/insights. Fetching it afresh on every tab switch
// would waste the server's work and the user's rate limit, so it is shared and kept for a minute, and dropped as
// soon as anything it depends on changes (an expense is added, edited or deleted, the budget or currency changes).
const TTL_MS = 60_000;

let cached: { at: number; day: string; data: Insights } | null = null;
let inflight: Promise<Insights> | null = null;

export function invalidateInsights() {
  cached = null;
}

export function getInsights(force = false): Promise<Insights> {
  const day = todayIso();
  if (!force && cached && cached.day === day && Date.now() - cached.at < TTL_MS) {
    return Promise.resolve(cached.data);
  }
  if (inflight) return inflight;
  inflight = (api.get(`/ai/insights?today=${day}`) as Promise<Insights>)
    .then((data) => {
      cached = { at: Date.now(), day, data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
