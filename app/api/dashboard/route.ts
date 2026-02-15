import { errorResponse, serverErrorResponse, successResponse } from "@/lib/api-response";
import { authOptions } from "@/lib/auth";
import { serializeJob } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

const RECENT_LIMIT = 10;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const [total, byStatusRows, recent] = await Promise.all([
      prisma.jobApplication.count({ where: { userId: session.user.id } }),
      prisma.jobApplication.groupBy({
        where: { userId: session.user.id },
        by: ["status"],
        _count: { status: true },
      }),
        prisma.jobApplication.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: RECENT_LIMIT,
          include: { _count: { select: { notes: true } } },
        }),
      ]);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRows) {
      byStatus[row.status] = row._count.status;
    }

    const serializedRecent = recent.map((job) => ({
      ...serializeJob(job),
      notesCount: job._count.notes,
      notes: undefined,
    }));

    return successResponse({
      total,
      byStatus,
      recent: serializedRecent,
    });
  } catch (err) {
    console.error("GET /api/dashboard:", err);
    return serverErrorResponse();
  }
}
