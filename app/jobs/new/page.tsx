"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createJob, clearError } from "@/store/jobsSlice";
import type { CreateJobInput } from "@/types";
import { Card, CardHeader, CardTitle, Alert } from "@/components/ui";
import { JobForm } from "@/components/jobs/JobForm";

export default function NewJobPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.jobs);

  const handleSubmit = useCallback(
    async (data: CreateJobInput) => {
      const result = await dispatch(createJob(data));
      if (createJob.fulfilled.match(result)) {
        router.push(`/jobs/${result.payload.id}`);
      }
    },
    [dispatch, router]
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add application</h1>
        <p className="mt-1 text-slate-600">Create a new job application entry</p>
      </div>

      {error && (
        <Alert
          variant="error"
          message={error}
          onDismiss={() => dispatch(clearError())}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <JobForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="Create"
          isLoading={loading}
        />
      </Card>
    </div>
  );
}
