// Persistent (localStorage) store for async statement processing jobs
// so that navigating away and back to the upload page preserves progress.

export interface PersistedUploadJob {
  jobId: string;
  filename: string;
  status: 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  updatedAt?: number; // epoch ms of last status update
}

const KEY = 'activeUploadJobs:v2'; // bump version to avoid legacy schemas without updatedAt
const PRUNE_MS = 60 * 60 * 1000; // prune completed jobs older than 1h

export function loadJobs(): PersistedUploadJob[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const now = Date.now();
      return parsed
        .filter(j => j && j.jobId)
        .map(j => ({ ...j, updatedAt: j.updatedAt || now }))
        .filter(j => !(j.status !== 'processing' && now - (j.updatedAt || now) > PRUNE_MS));
    }
    return [];
  } catch {
    return [];
  }
}

export function saveJobs(jobs: PersistedUploadJob[]) {
  if (typeof window === 'undefined') return;
  try {
  const now = Date.now();
  const pruned = jobs.filter(j => !(j.status !== 'processing' && now - (j.updatedAt || now) > PRUNE_MS));
  localStorage.setItem(KEY, JSON.stringify(pruned));
  } catch {
    /* ignore quota errors */
  }
}

export function upsertJob(job: PersistedUploadJob) {
  const jobs = loadJobs();
  const idx = jobs.findIndex(j => j.jobId === job.jobId);
  const withTs = { ...job, updatedAt: Date.now() };
  if (idx >= 0) jobs[idx] = withTs; else jobs.unshift(withTs);
  saveJobs(jobs);
}

export function removeJob(jobId: string) {
  const jobs = loadJobs().filter(j => j.jobId !== jobId);
  saveJobs(jobs);
}

export function clearCompletedOlderThan(hours = 24) {
  const cutoff = Date.now() - hours * 3600_000;
  const jobs = loadJobs().filter(j => j.status === 'processing' || (j.updatedAt || 0) >= cutoff);
  saveJobs(jobs);
}

// Remove all non-processing jobs immediately (manual clear)
export function clearCompletedJobs() {
  const active = loadJobs().filter(j => j.status === 'processing');
  saveJobs(active);
}
