"use client";

import { memo, useCallback, useState } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { JOB_STATUSES } from "@/types";
import type { CreateJobInput, JobApplication } from "@/types";

interface JobFormProps {
  initialData?: Partial<JobApplication>;
  onSubmit: (data: CreateJobInput) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

const statusOptions = JOB_STATUSES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

function toInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export const JobForm = memo(function JobForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isLoading = false,
}: JobFormProps) {
  const [company, setCompany] = useState(initialData?.company ?? "");
  const [position, setPosition] = useState(initialData?.position ?? "");
  const [status, setStatus] = useState(initialData?.status ?? "applied");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [jobUrl, setJobUrl] = useState(initialData?.jobUrl ?? "");
  const [applyDate, setApplyDate] = useState(toInputDate(initialData?.applyDate ?? undefined));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmedCompany = company.trim();
      const trimmedPosition = position.trim();
      if (!trimmedCompany) {
        setError("Company is required");
        return;
      }
      if (!trimmedPosition) {
        setError("Position is required");
        return;
      }
      try {
        await onSubmit({
          company: trimmedCompany,
          position: trimmedPosition,
          status: status.trim() || "applied",
          description: description.trim() || undefined,
          jobUrl: jobUrl.trim() || undefined,
          applyDate: applyDate.trim() || undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [company, position, status, description, jobUrl, applyDate, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Input
        label="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="e.g. Acme Inc."
        required
        autoFocus
      />
      <Input
        label="Position"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        placeholder="e.g. Senior Engineer"
        required
      />
      <Input
        label="Job URL"
        type="url"
        value={jobUrl}
        onChange={(e) => setJobUrl(e.target.value)}
        placeholder="https://..."
      />
      <Input
        label="Apply date"
        type="date"
        value={applyDate}
        onChange={(e) => setApplyDate(e.target.value)}
      />
      <Textarea
        label="Job description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Paste or type the job description..."
        rows={4}
      />
      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        options={statusOptions}
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
});
