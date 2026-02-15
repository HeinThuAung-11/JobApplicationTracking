"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui";
import type { JobApplication } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    applied: "bg-slate-100 text-slate-700",
    screening: "bg-blue-100 text-blue-700",
    interview: "bg-amber-100 text-amber-700",
    offer: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    accepted: "bg-emerald-200 text-emerald-800",
    withdrawn: "bg-slate-200 text-slate-600",
  };
  const cls = colorMap[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {status}
    </span>
  );
}

interface JobCardProps {
  job: JobApplication;
}

export const JobCard = memo(function JobCard({ job }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{job.company}</CardTitle>
            <p className="mt-0.5 text-sm text-slate-600">{job.position}</p>
          </div>
          <StatusBadge status={job.status} />
        </CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-slate-500">
          <span>{job.applyDate ? formatDate(job.applyDate) : formatDate(job.createdAt)}</span>
          <span className="flex items-center gap-2">
            {job.jobUrl && (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary-600 hover:underline"
              >
                Link
              </a>
            )}
            {job.notes && job.notes.length > 0 && (
              <span>{job.notes.length} note{job.notes.length !== 1 ? "s" : ""}</span>
            )}
          </span>
        </div>
      </Card>
    </Link>
  );
});
