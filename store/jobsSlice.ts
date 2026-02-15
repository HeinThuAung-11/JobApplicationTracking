import { api, getApiErrorMessage } from "@/lib/axios";
import {
    addJobToLocalStorage,
    addNoteToLocalStorage,
    deleteJobFromLocalStorage,
    getDashboardStatsFromLocalStorage,
    loadJobsFromLocalStorage,
    updateJobInLocalStorage
} from "@/lib/localStorage";
import type {
    CreateJobInput,
    CreateNoteInput,
    DashboardStats,
    JobApplication,
    Note,
    UpdateJobInput,
} from "@/types";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

interface JobsState {
  items: JobApplication[];
  currentJob: JobApplication | null;
  dashboard: DashboardStats | null;
  loading: boolean;
  loadingCurrent: boolean;
  loadingDashboard: boolean;
  error: string | null;
  errorCurrent: string | null;
  errorDashboard: string | null;
  useLocalStorage: boolean;
}

interface MigrateLocalJobsPayload {
  jobs: JobApplication[];
}

interface MigrateLocalJobsResult {
  importedJobs: number;
  skippedJobs: number;
  importedNotes: number;
}

interface JobsListResponse {
  items: JobApplication[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

const initialState: JobsState = {
  items: [],
  currentJob: null,
  dashboard: null,
  loading: false,
  loadingCurrent: false,
  loadingDashboard: false,
  error: null,
  errorCurrent: null,
  errorDashboard: null,
  useLocalStorage: true,
};

export const fetchJobs = createAsyncThunk<
  JobApplication[],
  void,
  { state: RootState; rejectValue: string }
>("jobs/fetchAll", async (_, { getState, rejectWithValue }) => {
  const { jobs } = getState();
  
  if (jobs.useLocalStorage) {
    return loadJobsFromLocalStorage();
  }
  
  try {
    const { data } = await api.get<JobsListResponse>("/api/jobs?limit=100&offset=0");
    return data.items;
  } catch (err) {
    return rejectWithValue(getApiErrorMessage(err));
  }
});

export const fetchJobById = createAsyncThunk<
  JobApplication,
  number,
  { state: RootState; rejectValue: string }
>("jobs/fetchById", async (id, { getState, rejectWithValue }) => {
  const { jobs } = getState();
  
  if (jobs.useLocalStorage) {
    const localJobs = loadJobsFromLocalStorage();
    const job = localJobs.find(j => j.id === id);
    if (!job) {
      return rejectWithValue("Job not found");
    }
    return job;
  }
  
  try {
    const { data } = await api.get<JobApplication>(`/api/jobs/${id}`);
    return data;
  } catch (err) {
    return rejectWithValue(getApiErrorMessage(err));
  }
});

export const createJob = createAsyncThunk<
  JobApplication,
  CreateJobInput,
  { state: RootState; rejectValue: string }
>("jobs/create", async (input, { getState, rejectWithValue }) => {
  const { jobs } = getState();
  
  if (jobs.useLocalStorage) {
    return addJobToLocalStorage(input);
  }
  
  try {
    const { data } = await api.post<JobApplication>("/api/jobs", input);
    return data;
  } catch (err) {
    return rejectWithValue(getApiErrorMessage(err));
  }
});

export const updateJob = createAsyncThunk<
  JobApplication,
  { id: number; input: UpdateJobInput },
  { state: RootState; rejectValue: string }
>("jobs/update", async ({ id, input }, { getState, rejectWithValue }) => {
  const { jobs } = getState();
  
  if (jobs.useLocalStorage) {
    const updated = updateJobInLocalStorage(id, input);
    if (!updated) {
      return rejectWithValue("Job not found");
    }
    return updated;
  }
  
  try {
    const { data } = await api.patch<JobApplication>(`/api/jobs/${id}`, input);
    return data;
  } catch (err) {
    return rejectWithValue(getApiErrorMessage(err));
  }
});

export const deleteJob = createAsyncThunk<
  number,
  number,
  { state: RootState; rejectValue: string }
>("jobs/delete", async (id, { getState, rejectWithValue }) => {
  const { jobs } = getState();
  
  if (jobs.useLocalStorage) {
    const success = deleteJobFromLocalStorage(id);
    if (!success) {
      return rejectWithValue("Job not found");
    }
    return id;
  }
  
  try {
    await api.delete(`/api/jobs/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(getApiErrorMessage(err));
  }
});

export const addNote = createAsyncThunk<
  Note,
  { jobId: number; input: CreateNoteInput },
  { state: RootState; rejectValue: string }
>("jobs/addNote", async ({ jobId, input }, { getState, rejectWithValue }) => {
  const { jobs } = getState();
  
  if (jobs.useLocalStorage) {
    const note = addNoteToLocalStorage(jobId, input.content);
    if (!note) {
      return rejectWithValue("Job not found");
    }
    return note;
  }
  
  try {
    const { data } = await api.post<Note>(`/api/jobs/${jobId}/notes`, input);
    return data;
  } catch (err) {
    return rejectWithValue(getApiErrorMessage(err));
  }
});

export const fetchDashboard = createAsyncThunk<
  DashboardStats,
  void,
  { state: RootState; rejectValue: string }
>("jobs/fetchDashboard", async (_, { getState, rejectWithValue }) => {
  const { jobs } = getState();
  
  if (jobs.useLocalStorage) {
    return getDashboardStatsFromLocalStorage();
  }
  
  try {
    const { data } = await api.get<DashboardStats>("/api/dashboard");
    return data;
  } catch (err) {
    return rejectWithValue(getApiErrorMessage(err));
  }
});

export const migrateLocalJobs = createAsyncThunk<
  MigrateLocalJobsResult,
  MigrateLocalJobsPayload,
  { rejectValue: string }
>("jobs/migrateLocalJobs", async ({ jobs }, { rejectWithValue }) => {
  try {
    const { data } = await api.post<MigrateLocalJobsResult>("/api/jobs/migrate", {
      jobs,
    });
    return data;
  } catch (err) {
    return rejectWithValue(getApiErrorMessage(err));
  }
});

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    clearCurrentJob(state) {
      state.currentJob = null;
      state.errorCurrent = null;
    },
    clearError(state) {
      state.error = null;
    },
    clearErrorCurrent(state) {
      state.errorCurrent = null;
    },
    clearErrorDashboard(state) {
      state.errorDashboard = null;
    },
    setUseLocalStorage(state, action: PayloadAction<boolean>) {
      state.useLocalStorage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action: PayloadAction<JobApplication[]>) => {
        state.loading = false;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch jobs";
      });

    builder
      .addCase(fetchJobById.pending, (state) => {
        state.loadingCurrent = true;
        state.errorCurrent = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action: PayloadAction<JobApplication>) => {
        state.loadingCurrent = false;
        state.currentJob = action.payload;
        state.errorCurrent = null;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.loadingCurrent = false;
        state.errorCurrent = action.payload ?? "Failed to fetch job";
      });

    builder
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action: PayloadAction<JobApplication>) => {
        state.loading = false;
        state.items = [action.payload, ...state.items];
        state.error = null;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create job";
      });

    builder
      .addCase(updateJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateJob.fulfilled, (state, action: PayloadAction<JobApplication>) => {
        state.loading = false;
        const idx = state.items.findIndex((j) => j.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.currentJob?.id === action.payload.id) {
          state.currentJob = action.payload;
        }
        state.error = null;
      })
      .addCase(updateJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update job";
      });

    builder
      .addCase(deleteJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.items = state.items.filter((j) => j.id !== action.payload);
        if (state.currentJob?.id === action.payload) {
          state.currentJob = null;
        }
        state.error = null;
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to delete job";
      });

    builder
      .addCase(addNote.fulfilled, (state, action: PayloadAction<Note>) => {
        if (state.currentJob?.id === action.payload.jobApplicationId) {
          state.currentJob.notes = [
            action.payload,
            ...(state.currentJob.notes ?? []),
          ];
        }
        const job = state.items.find(
          (j) => j.id === action.payload.jobApplicationId
        );
        if (job) {
          job.notes = [action.payload, ...(job.notes ?? [])];
        }
      });

    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loadingDashboard = true;
        state.errorDashboard = null;
      })
      .addCase(
        fetchDashboard.fulfilled,
        (state, action: PayloadAction<DashboardStats>) => {
          state.loadingDashboard = false;
          state.dashboard = action.payload;
          state.errorDashboard = null;
        }
      )
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loadingDashboard = false;
        state.errorDashboard = action.payload ?? "Failed to load dashboard";
      });
  },
});

export const {
  clearCurrentJob,
  clearError,
  clearErrorCurrent,
  clearErrorDashboard,
  setUseLocalStorage,
} = jobsSlice.actions;

export const selectIsGuestMode = (state: RootState) => state.jobs.useLocalStorage;
export default jobsSlice.reducer;
