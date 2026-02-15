"use client";

import { memo } from "react";
import { Card } from "@/components/ui";
import type { Note } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

interface NoteListProps {
  notes: Note[];
  emptyMessage?: string;
}

export const NoteList = memo(function NoteList({
  notes,
  emptyMessage = "No notes yet.",
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {notes.map((note) => (
        <li key={note.id}>
          <Card padding="sm" className="border-slate-100">
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {note.content}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {formatDate(note.createdAt)}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
});
