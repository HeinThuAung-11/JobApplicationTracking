import { errorResponse, serverErrorResponse, successResponse } from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    const normalizedJobs = jobsInput
      .filter((job): job is IncomingJob => job !== null && typeof job === "object")
      .map((job) => {
        const company = typeof job.company === "string" ? job.company.trim() : "";
        const position = typeof job.position === "string" ? job.position.trim() : "";
        const status = typeof job.status === "string" ? job.status.trim() : "";

        if (!company || !position || !status) return null;

        const description =
          typeof job.description === "string" && job.description.trim()
            ? job.description.trim()
            : null;
        const jobUrl =
          typeof job.jobUrl === "string" && job.jobUrl.trim()
            ? job.jobUrl.trim()
            : null;
        const applyDate = parseDateOrNull(job.applyDate);
        const createdAt = parseDateOrNull(job.createdAt) ?? new Date();

        const notesRaw = Array.isArray(job.notes) ? (job.notes as IncomingNote[]) : [];
        const notes = notesRaw
          .filter((note) => note && typeof note === "object")
          .map((note) => {
            const content =
              typeof note.content === "string" ? note.content.trim() : "";
            if (!content) return null;
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
      .filter(
        (
          job
        ): job is {
          company: string;
          position: string;
          status: string;
          description: string | null;
          jobUrl: string | null;
          applyDate: Date | null;
          createdAt: Date;
          notes: { content: string; createdAt: Date }[];
        } => !!job
      );

    if (normalizedJobs.length === 0) {
      return successResponse({ importedJobs: 0, importedNotes: 0 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let importedJobs = 0;
      let importedNotes = 0;

      for (const job of normalizedJobs) {
        const createdJob = await tx.jobApplication.create({
          data: {
            company: job.company,
            position: job.position,
            status: job.status,
            description: job.description,
            jobUrl: job.jobUrl,
            applyDate: job.applyDate,
            createdAt: job.createdAt,
            userId: session.user.id,
          },
          select: { id: true },
        });
        importedJobs += 1;

        if (job.notes.length > 0) {
          await tx.note.createMany({
            data: job.notes.map((note) => ({
              jobApplicationId: createdJob.id,
              content: note.content,
              createdAt: note.createdAt,
            })),
          });
          importedNotes += job.notes.length;
        }
      }

      return { importedJobs, importedNotes };
    });

    return successResponse(result, 201);
  } catch (err) {
    console.error("POST /api/jobs/migrate:", err);
    return serverErrorResponse();
  }
}
