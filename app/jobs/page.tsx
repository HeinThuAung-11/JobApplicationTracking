"use client";

import { JobCard } from "@/components/jobs/JobCard";
import { Alert, Button, Input, Select, Spinner } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearError, fetchJobs } from "@/store/jobsSlice";
import { JOB_STATUSES } from "@/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function JobsListPage() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.jobs);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

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

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = fromDate ? new Date(fromDate).getTime() : null;
    const toMs = toDate ? new Date(toDate).getTime() : null;

    const filtered = items.filter((job) => {
      const statusMatch = statusFilter === "all" || job.status === statusFilter;
      if (!statusMatch) return false;

      const effectiveDate = new Date(job.applyDate ?? job.createdAt).getTime();
      if (fromMs !== null && Number.isFinite(fromMs) && effectiveDate < fromMs) {
        return false;
      }
      if (toMs !== null && Number.isFinite(toMs)) {
        const endOfDay = toMs + 24 * 60 * 60 * 1000 - 1;
        if (effectiveDate > endOfDay) return false;
      }

      if (!q) return true;
      const companyMatch = job.company.toLowerCase().includes(q);
      const positionMatch = job.position.toLowerCase().includes(q);
      return companyMatch || positionMatch;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aDate = new Date(a.applyDate ?? a.createdAt).getTime();
      const bDate = new Date(b.applyDate ?? b.createdAt).getTime();

      switch (sortBy) {
        case "date_asc":
          return aDate - bDate;
        case "date_desc":
          return bDate - aDate;
        case "company_asc":
          return a.company.localeCompare(b.company);
        case "company_desc":
          return b.company.localeCompare(a.company);
        case "status_asc":
          return a.status.localeCompare(b.status);
        case "status_desc":
          return b.status.localeCompare(a.status);
        default:
          return bDate - aDate;
      }
    });

    return sorted;
  }, [items, query, statusFilter, fromDate, toDate, sortBy]);

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
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort jobs"
            />
          </div>

          <div className="lg:col-span-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setFromDate("");
                setToDate("");
                setSortBy("date_desc");
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

      <p className="text-sm text-slate-500">
        Showing {filteredItems.length} of {items.length} applications
      </p>

      {items.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <p className="text-slate-600">No applications yet.</p>
          <Link href="/jobs/new" className="mt-4 inline-block">
            <Button>Add your first job</Button>
          </Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
          <p className="text-slate-600">No jobs match your filters.</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
              setFromDate("");
              setToDate("");
              setSortBy("date_desc");
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
