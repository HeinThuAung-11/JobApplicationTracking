import {
    errorResponse,
    serverErrorResponse,
    successResponse,
} from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { parseJsonObject, serializeJob } from "@/lib/api-utils";
import { validateCreateJobInput } from "@/lib/job-validation";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const DEFAULT_SORT = "date_desc";

type SortBy =
  | "date_desc"
  | "date_asc"
  | "company_asc"
  | "company_desc"
  | "status_asc"
  | "status_desc";

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function parseSortBy(value: string | null): SortBy {
  const allowed: SortBy[] = [
    "date_desc",
    "date_asc",
    "company_asc",
    "company_desc",
    "status_asc",
    "status_desc",
  ];
  return value && allowed.includes(value as SortBy) ? (value as SortBy) : DEFAULT_SORT;
}

function getOrderBy(sortBy: SortBy): Prisma.JobApplicationOrderByWithRelationInput[] {
  switch (sortBy) {
    case "date_asc":
      return [{ applyDate: "asc" }, { createdAt: "asc" }];
    case "date_desc":
      return [{ applyDate: "desc" }, { createdAt: "desc" }];
    case "company_asc":
      return [{ company: "asc" }, { createdAt: "desc" }];
    case "company_desc":
      return [{ company: "desc" }, { createdAt: "desc" }];
    case "status_asc":
      return [{ status: "asc" }, { createdAt: "desc" }];
    case "status_desc":
      return [{ status: "desc" }, { createdAt: "desc" }];
    default:
      return [{ applyDate: "desc" }, { createdAt: "desc" }];
  }
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
    const query = sp.get("query")?.trim();
    const status = sp.get("status")?.trim();
    const fromDateRaw = sp.get("fromDate");
    const toDateRaw = sp.get("toDate");
    const sortBy = parseSortBy(sp.get("sortBy"));

    const where: Prisma.JobApplicationWhereInput = { userId: session.user.id };
    const andClauses: Prisma.JobApplicationWhereInput[] = [];
    if (query) {
      where.OR = [
        { company: { contains: query, mode: "insensitive" } },
        { position: { contains: query, mode: "insensitive" } },
      ];
    }
    if (status && status !== "all") {
      where.status = status;
    }
    if (fromDateRaw || toDateRaw) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (fromDateRaw) {
        const fromDate = new Date(fromDateRaw);
        if (!Number.isNaN(fromDate.getTime())) {
          dateFilter.gte = fromDate;
        }
      }
      if (toDateRaw) {
        const toDate = new Date(toDateRaw);
        if (!Number.isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          dateFilter.lte = toDate;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        andClauses.push({
          OR: [
            { applyDate: dateFilter },
            {
              AND: [{ applyDate: null }, { createdAt: dateFilter }],
            },
          ],
        });
      }
    }
    if (andClauses.length > 0) {
      where.AND = andClauses;
    }
    const [total, jobs] = await Promise.all([
      prisma.jobApplication.count({ where }),
      prisma.jobApplication.findMany({
        where,
        orderBy: getOrderBy(sortBy),
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
      sortBy,
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
