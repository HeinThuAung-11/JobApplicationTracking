"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchJobById,
  updateJob,
  deleteJob,
  addNote,
  clearCurrentJob,
  clearError,
} from "@/store/jobsSlice";
import {
  Card,
  CardHeader,
  CardTitle,
  Button,
  Spinner,
  Alert,
  Select,
} from "@/components/ui";
import { JobForm } from "@/components/jobs/JobForm";
import { NoteList } from "@/components/jobs/NoteList";
import { AddNoteForm } from "@/components/jobs/AddNoteForm";
import { JOB_STATUSES } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const statusOptions = JOB_STATUSES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const dispatch = useAppDispatch();
  const {
    currentJob,
    loadingCurrent,
    loading,
    error,
    errorCurrent,
  } = useAppSelector((state) => state.jobs);

  const validId = Number.isInteger(id) && id > 0;

  useEffect(() => {
    if (validId) {
      void dispatch(fetchJobById(id));
    }
    return () => {
      dispatch(clearCurrentJob());
    };
  }, [dispatch, id, validId]);

  const handleUpdateStatus = useCallback(
    async (newStatus: string) => {
      if (!currentJob || !validId) return;
      await dispatch(updateJob({ id: currentJob.id, input: { status: newStatus } }));
    },
    [currentJob, dispatch, validId]
  );

  const handleDelete = useCallback(async () => {
    if (!currentJob || !validId) return;
    if (!window.confirm("Delete this application? This cannot be undone."))
      return;
    const result = await dispatch(deleteJob(currentJob.id));
    if (deleteJob.fulfilled.match(result)) {
      router.push("/jobs");
    }
  }, [currentJob, dispatch, router, validId]);

  const handleAddNote = useCallback(
    async (content: string) => {
      if (!validId) return;
      await dispatch(addNote({ jobId: id, input: { content } }));
    },
    [dispatch, id, validId]
  );

  if (!validId) {
    return (
      <div className="mx-auto max-w-4xl">
        <Alert variant="error" message="Invalid job ID" />
        <Link href="/jobs" className="mt-4 inline-block">
          <Button variant="secondary">Back to list</Button>
        </Link>
      </div>
    );
  }

  if (loadingCurrent && !currentJob) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (errorCurrent && !currentJob) {
    return (
      <div className="mx-auto max-w-4xl">
        <Alert variant="error" message={errorCurrent} />
        <Link href="/jobs" className="mt-4 inline-block">
          <Button variant="secondary">Back to list</Button>
        </Link>
      </div>
    );
  }

  if (!currentJob) {
    return null;
  }

  const notes = currentJob.notes ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/jobs"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            ← Back to applications
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {currentJob.company}
          </h1>
          <p className="text-slate-600">{currentJob.position}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {currentJob.applyDate && (
              <span>Applied {formatDate(currentJob.applyDate)}</span>
            )}
            {!currentJob.applyDate && (
              <span>Added {formatDate(currentJob.createdAt)}</span>
            )}
            {currentJob.jobUrl && (
              <a
                href={currentJob.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                View job posting
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={statusOptions}
            value={currentJob.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="w-40"
          />
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="error"
          message={error}
          onDismiss={() => dispatch(clearError())}
        />
      )}

      {currentJob.description && (
        <Card>
          <CardHeader>
            <CardTitle>Job description</CardTitle>
          </CardHeader>
          <div className="whitespace-pre-wrap text-sm text-slate-700">
            {currentJob.description}
          </div>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <AddNoteForm onAdd={handleAddNote} isLoading={loading} />
          <div className="mt-6">
            <NoteList notes={notes} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application details</CardTitle>
          </CardHeader>
          <p className="text-sm text-slate-600">
            To edit company or position, use the form below.
          </p>
          <div className="mt-4">
            <JobForm
              initialData={currentJob}
              onSubmit={async (data) => {
                await dispatch(updateJob({ id: currentJob.id, input: data }));
              }}
              submitLabel="Update"
              isLoading={loading}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
