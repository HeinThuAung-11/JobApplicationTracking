import { errorResponse } from "./api-response";

type JsonObject = Record<string, unknown>;

export async function parseJsonObject(request: Request) {
  try {
    const body = await request.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false as const, response: errorResponse("Request body must be an object", 400) };
    }
    return { ok: true as const, body: body as JsonObject };
  } catch {
    return { ok: false as const, response: errorResponse("Invalid JSON body", 400) };
  }
}

type SerializableNote = {
  id: number;
  content: string;
  jobApplicationId: number;
  createdAt: Date;
};

type SerializableJob = {
  id: number;
  company: string;
  position: string;
  status: string;
  description: string | null;
  jobUrl: string | null;
  applyDate: Date | null;
  createdAt: Date;
  userId: string | null;
};

export function serializeNote(note: SerializableNote) {
  return {
    ...note,
    createdAt: note.createdAt.toISOString(),
  };
}

export function serializeJob<T extends SerializableJob>(job: T) {
  return {
    ...job,
    createdAt: job.createdAt.toISOString(),
    applyDate: job.applyDate?.toISOString() ?? null,
  };
}

export function serializeJobWithNotes<T extends SerializableJob & { notes: SerializableNote[] }>(
  job: T
) {
  return {
    ...serializeJob(job),
    notes: job.notes.map(serializeNote),
  };
}
