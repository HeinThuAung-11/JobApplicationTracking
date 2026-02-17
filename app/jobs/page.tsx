"use client";

import { JobCard } from "@/components/jobs/JobCard";
import { Alert, Button, Input, Select, Spinner } from "@/components/ui";
import { JOB_STATUSES } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearError,
  fetchJobs,
  JobsSortBy,
  selectJobsListMeta,
} from "@/store/jobsSlice";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 12;

export default function JobsListPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.jobs);
  const listMeta = useAppSelector(selectJobsListMeta);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState<JobsSortBy>("date_desc");
  const [currentPage, setCurrentPage] = useState(1);

  const offset = (currentPage - 1) * PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(listMeta.total / PAGE_SIZE));

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All statuses" },
      ...JOB_STATUSES.map((status) => ({
        value: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
      })),
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      { value: "date_desc", label: "Newest first" },
      { value: "date_asc", label: "Oldest first" },
      { value: "company_asc", label: "Company A-Z" },
      { value: "company_desc", label: "Company Z-A" },
      { value: "status_asc", label: "Status A-Z" },
      { value: "status_desc", label: "Status Z-A" },
    ],
    []
  );

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, statusFilter, fromDate, toDate, sortBy]);

  useEffect(() => {
    void dispatch(
      fetchJobs({
        query: debouncedQuery || undefined,
        status: statusFilter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sortBy,
        limit: PAGE_SIZE,
        offset,
      })
    );
  }, [
    debouncedQuery,
    dispatch,
    fromDate,
    offset,
    sortBy,
    statusFilter,
    toDate,
  ]);

  const hasItems = items.length > 0;
  const showingStart = listMeta.total === 0 ? 0 : listMeta.offset + 1;
  const showingEnd = listMeta.offset + items.length;

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

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4">
            <Input
              label="Search"
              placeholder="Company or position"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search jobs"
            />
          </div>

          <div className="lg:col-span-3">
            <Select
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            />
          </div>

          <div className="lg:col-span-3">
            <Select
              label="Sort"
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as JobsSortBy)}
              aria-label="Sort jobs"
            />
          </div>

          <div className="lg:col-span-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                setStatusFilter("all");
                setFromDate("");
                setToDate("");
                setSortBy("date_desc");
                setCurrentPage(1);
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-3">
            <Input
              type="date"
              label="From date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="Filter from date"
            />
          </div>
          <div className="lg:col-span-3">
            <Input
              type="date"
              label="To date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="Filter to date"
            />
          </div>
          <div className="hidden lg:col-span-6 lg:block" />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {showingStart}-{showingEnd} of {listMeta.total} applications
        </p>
        {loading && hasItems && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner size="sm" />
            Updating results...
          </div>
        )}
      </div>

      {!loading && listMeta.total === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <p className="text-slate-600">No applications yet.</p>
          <Link href="/jobs/new" className="mt-4 inline-block">
            <Button>Add your first job</Button>
          </Link>
        </div>
      ) : !loading && !hasItems ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <p className="text-slate-600">No jobs match your filters.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
              setStatusFilter("all");
              setFromDate("");
              setToDate("");
              setSortBy("date_desc");
              setCurrentPage(1);
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <>
          {loading && !hasItems ? (
            <div className="mx-auto max-w-6xl">
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {listMeta.total > PAGE_SIZE && (
            <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row">
              <p className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
