// Simple in-memory job store surviving navigation (module singleton)
export interface ActiveJob { id: string; filename: string; status: string; progress: number; error?: string }

let jobs: ActiveJob[] = [];

export const jobStore = {
  get: () => jobs.slice(),
  set: (next: ActiveJob[]) => { jobs = next.slice(); },
  upsert: (job: ActiveJob) => {
    const idx = jobs.findIndex(j => j.id === job.id);
    if (idx >= 0) jobs[idx] = job; else jobs.unshift(job);
  },
  remove: (id: string) => { jobs = jobs.filter(j => j.id !== id); }
};
