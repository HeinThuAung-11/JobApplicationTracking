import { errorResponse, serverErrorResponse, successResponse } from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JOB_STATUSES } from "@/types";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

type IncomingNote = {
  content?: unknown;
  createdAt?: unknown;
};

type IncomingJob = {
  company?: unknown;
  position?: unknown;
  status?: unknown;
  description?: unknown;
  jobUrl?: unknown;
  applyDate?: unknown;
  createdAt?: unknown;
  notes?: unknown;
};

function parseDateOrNull(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

type NormalizedJob = {
  company: string;
  position: string;
  status: string;
  description: string | null;
  jobUrl: string | null;
  applyDate: Date | null;
  createdAt: Date;
  notes: { content: string; createdAt: Date }[];
};

const MAX_IMPORT_JOBS = 500;
const MAX_NOTES_PER_JOB = 200;
const MAX_COMPANY_LENGTH = 120;
const MAX_POSITION_LENGTH = 160;
const MAX_STATUS_LENGTH = 32;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_JOB_URL_LENGTH = 2048;
const MAX_NOTE_LENGTH = 2000;
const STATUS_SET = new Set(JOB_STATUSES);

function isValidStatus(value: string) {
  return STATUS_SET.has(value as (typeof JOB_STATUSES)[number]);
}

function jobSignature(job: NormalizedJob): string {
  // Keep signature lightweight to avoid expensive note-level hashing at scale.
  return JSON.stringify({
    company: job.company,
    position: job.position,
    status: job.status,
    description: job.description,
    jobUrl: job.jobUrl,
    applyDate: job.applyDate?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (body === null || typeof body !== "object") {
      return errorResponse("Request body must be an object", 400);
    }

    const jobsInput = (body as { jobs?: unknown }).jobs;
    if (!Array.isArray(jobsInput)) {
      return errorResponse("jobs must be an array", 400);
    }
    if (jobsInput.length > MAX_IMPORT_JOBS) {
      return errorResponse(`jobs exceeds maximum of ${MAX_IMPORT_JOBS} items`, 400);
    }

    const normalizedJobs: NormalizedJob[] = jobsInput
      .filter((job): job is IncomingJob => job !== null && typeof job === "object")
      .map((job) => {
        const company = typeof job.company === "string" ? job.company.trim() : "";
        const position = typeof job.position === "string" ? job.position.trim() : "";
        const status = typeof job.status === "string" ? job.status.trim() : "";

        if (!company || !position || !status) return null;
        if (!isValidStatus(status)) return null;
        if (company.length > MAX_COMPANY_LENGTH) return null;
        if (position.length > MAX_POSITION_LENGTH) return null;
        if (status.length > MAX_STATUS_LENGTH) return null;

        const description =
          typeof job.description === "string" && job.description.trim()
            ? job.description.trim()
            : null;
        const jobUrl =
          typeof job.jobUrl === "string" && job.jobUrl.trim()
            ? job.jobUrl.trim()
            : null;
        if (description && description.length > MAX_DESCRIPTION_LENGTH) return null;
        if (jobUrl && jobUrl.length > MAX_JOB_URL_LENGTH) return null;
        const applyDate = parseDateOrNull(job.applyDate);
        const createdAt = parseDateOrNull(job.createdAt) ?? new Date();

        const notesRaw = Array.isArray(job.notes) ? (job.notes as IncomingNote[]).slice(0, MAX_NOTES_PER_JOB) : [];
        const notes = notesRaw
          .filter((note) => note && typeof note === "object")
          .map((note) => {
            const content =
              typeof note.content === "string" ? note.content.trim() : "";
            if (!content) return null;
            if (content.length > MAX_NOTE_LENGTH) return null;
            const noteCreatedAt = parseDateOrNull(note.createdAt) ?? createdAt;
            return { content, createdAt: noteCreatedAt };
          })
          .filter((note): note is { content: string; createdAt: Date } => !!note);

        return {
          company,
          position,
          status,
          description,
          jobUrl,
          applyDate,
          createdAt,
          notes,
        };
      })
      .filter((job): job is NormalizedJob => !!job);

    if (normalizedJobs.length === 0) {
      return successResponse({ importedJobs: 0, skippedJobs: 0, importedNotes: 0 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let importedJobs = 0;
      let skippedJobs = 0;
      let importedNotes = 0;

        const existingJobs = await tx.jobApplication.findMany({
          where: { userId: session.user.id },
          select: {
            company: true,
            position: true,
            status: true,
            description: true,
            jobUrl: true,
            applyDate: true,
            createdAt: true,
          },
        });
        const existingSignatures = new Set(
          existingJobs.map((job) =>
          jobSignature({
            company: job.company,
            position: job.position,
            status: job.status,
              description: job.description,
              jobUrl: job.jobUrl,
              applyDate: job.applyDate,
              createdAt: job.createdAt,
              notes: [],
            })
          )
        );

      for (const job of normalizedJobs) {
        const signature = jobSignature(job);
        if (existingSignatures.has(signature)) {
          skippedJobs += 1;
          continue;
        }

        await tx.jobApplication.create({
          data: {
            company: job.company,
            position: job.position,
            status: job.status,
            description: job.description,
            jobUrl: job.jobUrl,
            applyDate: job.applyDate,
            createdAt: job.createdAt,
            userId: session.user.id,
            notes: job.notes.length
              ? {
                  createMany: {
                    data: job.notes.map((note) => ({
                      content: note.content,
                      createdAt: note.createdAt,
                    })),
                  },
                }
              : undefined,
          },
        });
        importedJobs += 1;
        importedNotes += job.notes.length;

        existingSignatures.add(signature);
      }

      return { importedJobs, skippedJobs, importedNotes };
    });

    return successResponse(result, 201);
  } catch (err) {
    console.error("POST /api/jobs/migrate:", err);
    return serverErrorResponse();
  }
}
