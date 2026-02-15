import {
    errorResponse,
    serverErrorResponse,
    successResponse,
} from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const jobs = await prisma.jobApplication.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { notes: { orderBy: { createdAt: "desc" } } },
    });
    type JobWithNotes = (typeof jobs)[number];
    type NoteItem = JobWithNotes["notes"][number];
    const serialized = jobs.map((j: JobWithNotes) => ({
      ...j,
      createdAt: j.createdAt.toISOString(),
      applyDate: j.applyDate?.toISOString() ?? null,
      notes: j.notes.map((n: NoteItem) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
    }));
    return successResponse(serialized);
  } catch (err) {
    console.error("GET /api/jobs:", err);
    return serverErrorResponse();
  }
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
    const { company, position, status, description, jobUrl, applyDate } = body as Record<string, unknown>;

    if (!company || typeof company !== "string" || !company.trim()) {
      return errorResponse("Company is required", 400);
    }
    if (!position || typeof position !== "string" || !position.trim()) {
      return errorResponse("Position is required", 400);
    }
    if (!status || typeof status !== "string" || !status.trim()) {
      return errorResponse("Status is required", 400);
    }

    const data: {
      company: string;
      position: string;
      status: string;
      description?: string;
      jobUrl?: string;
      applyDate?: Date;
      userId: string;
    } = {
      company: company.trim(),
      position: position.trim(),
      status: status.trim(),
      userId: session.user.id,
    };
    if (description !== undefined && description !== null && description !== "") {
      if (typeof description !== "string") return errorResponse("Description must be a string", 400);
      data.description = description.trim();
    }
    if (jobUrl !== undefined && jobUrl !== null && jobUrl !== "") {
      if (typeof jobUrl !== "string") return errorResponse("Job URL must be a string", 400);
      data.jobUrl = jobUrl.trim();
    }
    if (applyDate !== undefined && applyDate !== null && applyDate !== "") {
      if (typeof applyDate !== "string") return errorResponse("Apply date must be a string", 400);
      const d = new Date(applyDate as string);
      if (Number.isNaN(d.getTime())) return errorResponse("Invalid apply date", 400);
      data.applyDate = d;
    }

    const job = await prisma.jobApplication.create({
      data,
    });

    return successResponse(
      {
        ...job,
        createdAt: job.createdAt.toISOString(),
        applyDate: job.applyDate?.toISOString() ?? null,
      },
      201
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("POST /api/jobs:", err);
    return NextResponse.json(
      { message: process.env.NODE_ENV === "development" ? message : "Internal server error" },
      { status: 500 }
    );
  }
}

