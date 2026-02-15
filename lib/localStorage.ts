import type { DashboardStats, JobApplication, Note } from "@/types";

const JOBS_STORAGE_KEY = "job_tracker_jobs";
const NOTES_STORAGE_KEY = "job_tracker_notes";

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

/**
 * Load jobs from localStorage
 */
export function loadJobsFromLocalStorage(): JobApplication[] {
  if (!isBrowser) return [];
  
  try {
    const stored = localStorage.getItem(JOBS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading jobs from localStorage:", error);
    return [];
  }
}

/**
 * Save jobs to localStorage
 */
export function saveJobsToLocalStorage(jobs: JobApplication[]): void {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.error("Error saving jobs to localStorage:", error);
  }
}

/**
 * Add a job to localStorage
 */
export function addJobToLocalStorage(job: Omit<JobApplication, "id">): JobApplication {
  const jobs = loadJobsFromLocalStorage();
  const newId = jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 1;
  const newJob: JobApplication = {
    ...job,
    id: newId,
    createdAt: new Date().toISOString(),
    notes: [],
  };
  
  jobs.unshift(newJob);
  saveJobsToLocalStorage(jobs);
  return newJob;
}

/**
 * Update a job in localStorage
 */
export function updateJobInLocalStorage(
  id: number,
  updates: Partial<JobApplication>
): JobApplication | null {
  const jobs = loadJobsFromLocalStorage();
  const index = jobs.findIndex(j => j.id === id);
  
  if (index === -1) return null;
  
  jobs[index] = { ...jobs[index], ...updates };
  saveJobsToLocalStorage(jobs);
  return jobs[index];
}

/**
 * Delete a job from localStorage
 */
export function deleteJobFromLocalStorage(id: number): boolean {
  const jobs = loadJobsFromLocalStorage();
  const filtered = jobs.filter(j => j.id !== id);
  
  if (filtered.length === jobs.length) return false;
  
  saveJobsToLocalStorage(filtered);
  return true;
}

/**
 * Add a note to a job in localStorage
 */
export function addNoteToLocalStorage(
  jobId: number,
  content: string
): Note | null {
  const jobs = loadJobsFromLocalStorage();
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  
  if (jobIndex === -1) return null;
  
  const job = jobs[jobIndex];
  const notes = job.notes || [];
  const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
  
  const newNote: Note = {
    id: newId,
    content,
    jobApplicationId: jobId,
    createdAt: new Date().toISOString(),
  };
  
  job.notes = [newNote, ...notes];
  saveJobsToLocalStorage(jobs);
  return newNote;
}

/**
 * Get dashboard stats from localStorage
 */
export function getDashboardStatsFromLocalStorage(): DashboardStats {
  const jobs = loadJobsFromLocalStorage();
  
  const byStatus: Record<string, number> = {};
  jobs.forEach(job => {
    byStatus[job.status] = (byStatus[job.status] || 0) + 1;
  });
  
  const recent = jobs.slice(0, 6);
  
  return {
    total: jobs.length,
    byStatus,
    recent,
  };
}

/**
 * Clear all localStorage data
 */
export function clearLocalStorageData(): void {
  if (!isBrowser) return;
  
  localStorage.removeItem(JOBS_STORAGE_KEY);
  localStorage.removeItem(NOTES_STORAGE_KEY);
}

/**
 * Check if localStorage has any data
 */
export function hasLocalStorageData(): boolean {
  if (!isBrowser) return false;
  
  const jobs = loadJobsFromLocalStorage();
  return jobs.length > 0;
}
