import {
    errorResponse,
    serverErrorResponse,
    successResponse,
} from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { parseJsonObject, serializeJob } from "@/lib/api-utils";
import { validateCreateJobInput } from "@/lib/job-validation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const sp = request.nextUrl.searchParams;
    const limit = Math.min(parsePositiveInt(sp.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
    const offset = parsePositiveInt(sp.get("offset"), 0);

    const where = { userId: session.user.id };
    const [total, jobs] = await Promise.all([
      prisma.jobApplication.count({ where }),
      prisma.jobApplication.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: { _count: { select: { notes: true } } },
      }),
    ]);

    const items = jobs.map((job) => ({
      ...serializeJob(job),
      notesCount: job._count.notes,
      notes: undefined,
    }));

    return successResponse({
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    });
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

    const parsed = await parseJsonObject(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    const validated = validateCreateJobInput(parsed.body);
    if (!validated.ok) {
      return validated.response;
    }

    const data = {
      ...validated.data,
      userId: session.user.id,
    };

    const job = await prisma.jobApplication.create({
      data,
    });

    return successResponse(serializeJob(job), 201);
  } catch (err) {
    console.error("POST /api/jobs:", err);
    return serverErrorResponse();
  }
}
