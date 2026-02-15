import {
    errorResponse,
    notFoundResponse,
    serverErrorResponse,
    successResponse,
} from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function getJobId(idParam: string): Promise<number | null> {
  const id = parseInt(idParam, 10);
  return Number.isNaN(id) ? null : id;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { id: idParam } = await params;
    const id = await getJobId(idParam);
    if (id === null) {
      return errorResponse("Invalid job ID", 400);
    }

    const job = await prisma.jobApplication.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!job) {
      return notFoundResponse("Job application not found");
    }

    const notes = await prisma.note.findMany({
      where: { jobApplicationId: id },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(
      notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("GET /api/jobs/[id]/notes:", err);
    return serverErrorResponse();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const { id: idParam } = await params;
    const id = await getJobId(idParam);
    if (id === null) {
      return errorResponse("Invalid job ID", 400);
    }

    const body = await request.json();
    const content = body?.content;

    if (content === undefined || content === null) {
      return errorResponse("Content is required", 400);
    }
    if (typeof content !== "string" || !content.trim()) {
      return errorResponse("Content must be a non-empty string", 400);
    }

    const job = await prisma.jobApplication.findUnique({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!job) {
      return notFoundResponse("Job application not found");
    }

    const note = await prisma.note.create({
      data: {
        jobApplicationId: id,
        content: content.trim(),
      },
    });

    return successResponse(
      {
        ...note,
        createdAt: note.createdAt.toISOString(),
      },
      201
    );
  } catch (err) {
    console.error("POST /api/jobs/[id]/notes:", err);
    return serverErrorResponse();
  }
}
