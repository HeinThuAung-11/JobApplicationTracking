"use client";

import { JobCard } from "@/components/jobs/JobCard";
import { Alert, Button, Spinner } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError, fetchJobs } from "@/store/jobsSlice";
import Link from "next/link";
import { useEffect } from "react";

export default function JobsListPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.jobs);

  useEffect(() => {
    void dispatch(fetchJobs());
  }, [dispatch]);

  if (loading && items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="mt-1 text-slate-600">All your job applications</p>
        </div>
        <Link href="/jobs/new">
          <Button>Add job</Button>
        </Link>
      </div>

      {error && <Alert variant="error" message={error} onDismiss={() => dispatch(clearError())} />}

      {items.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <p className="text-slate-600">No applications yet.</p>
          <Link href="/jobs/new" className="mt-4 inline-block">
            <Button>Add your first job</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
