import {
    errorResponse,
    notFoundResponse,
    serverErrorResponse,
    successResponse,
} from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { parseJsonObject, serializeJob, serializeJobWithNotes } from "@/lib/api-utils";
import { validateUpdateJobInput } from "@/lib/job-validation";
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

    return successResponse(serializeJobWithNotes(job));
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

    const parsed = await parseJsonObject(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const validated = validateUpdateJobInput(parsed.body);
    if (!validated.ok) {
      return validated.response;
    }
    const data = validated.data;

    const job = await prisma.jobApplication.update({
      where: { id, userId: session.user.id },
      data,
    });

    return successResponse(serializeJob(job));
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
