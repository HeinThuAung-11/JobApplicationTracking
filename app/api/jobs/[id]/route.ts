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
      include: { notes: { orderBy: { createdAt: "desc" } } },
    });

    if (!job) {
      return notFoundResponse("Job application not found");
    }

    type NoteItem = (typeof job.notes)[number];
    return successResponse({
      ...job,
      createdAt: job.createdAt.toISOString(),
      applyDate: job.applyDate?.toISOString() ?? null,
      notes: job.notes.map((n: NoteItem) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET /api/jobs/[id]:", err);
    return serverErrorResponse();
  }
}

export async function PATCH(
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
    if (id ===null) {
      return errorResponse("Invalid job ID", 400);
    }

    const body = await request.json();
    const { company, position, status, description, jobUrl, applyDate } = body;

    const data: {
      company?: string;
      position?: string;
      status?: string;
      description?: string | null;
      jobUrl?: string | null;
      applyDate?: Date | null;
    } = {};
    if (company !== undefined) {
      if (typeof company !== "string" || !company.trim()) {
        return errorResponse("Company must be a non-empty string", 400);
      }
      data.company = company.trim();
    }
    if (position !== undefined) {
      if (typeof position !== "string" || !position.trim()) {
        return errorResponse("Position must be a non-empty string", 400);
      }
      data.position = position.trim();
    }
    if (status !== undefined) {
      if (typeof status !== "string" || !status.trim()) {
        return errorResponse("Status must be a non-empty string", 400);
      }
      data.status = status.trim();
    }
    if (description !== undefined) {
      if (description === null || description === "") {
        data.description = null;
      } else if (typeof description === "string") {
        data.description = description.trim();
      } else {
        return errorResponse("Description must be a string", 400);
      }
    }
    if (jobUrl !== undefined) {
      if (jobUrl === null || jobUrl === "") {
        data.jobUrl = null;
      } else if (typeof jobUrl === "string") {
        data.jobUrl = jobUrl.trim();
      } else {
        return errorResponse("Job URL must be a string", 400);
      }
    }
    if (applyDate !== undefined) {
      if (applyDate === null || applyDate === "") {
        data.applyDate = null;
      } else if (typeof applyDate === "string") {
        const d = new Date(applyDate);
        if (Number.isNaN(d.getTime())) return errorResponse("Invalid apply date", 400);
        data.applyDate = d;
      } else {
        return errorResponse("Apply date must be a string", 400);
      }
    }

    const job = await prisma.jobApplication.update({
      where: { id, userId: session.user.id },
      data,
    });

    return successResponse({
      ...job,
      createdAt: job.createdAt.toISOString(),
      applyDate: job.applyDate?.toISOString() ?? null,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
      return notFoundResponse("Job application not found");
    }
    console.error("PATCH /api/jobs/[id]:", err);
    return serverErrorResponse();
  }
}

export async function DELETE(
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

    await prisma.jobApplication.delete({ where: { id, userId: session.user.id } });
    return successResponse({ deleted: true }, 200);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
      return notFoundResponse("Job application not found");
    }
    console.error("DELETE /api/jobs/[id]:", err);
    return serverErrorResponse();
  }
}
