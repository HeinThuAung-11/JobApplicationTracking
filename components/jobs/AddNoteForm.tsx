"use client";

import { memo, useCallback, useState } from "react";
import { Button, Textarea } from "@/components/ui";

interface AddNoteFormProps {
  onAdd: (content: string) => Promise<void>;
  isLoading?: boolean;
}

export const AddNoteForm = memo(function AddNoteForm({
  onAdd,
  isLoading = false,
}: AddNoteFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const trimmed = content.trim();
      if (!trimmed) {
        setError("Note content is required");
        return;
      }
      try {
        await onAdd(trimmed);
        setContent("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add note");
      }
    },
    [content, onAdd]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Textarea
        label="New note"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note..."
        rows={3}
        disabled={isLoading}
      />
      <Button type="submit" isLoading={isLoading} disabled={isLoading}>
        Add note
      </Button>
    </form>
  );
});
