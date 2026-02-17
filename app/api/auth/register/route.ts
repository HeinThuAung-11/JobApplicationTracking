import bcrypt from "bcryptjs";
import { errorResponse, serverErrorResponse, successResponse } from "@/lib/api-response";
import { parseJsonObject } from "@/lib/api-utils";
import { validateRegisterInput } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonObject(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const validated = validateRegisterInput(parsed.body);
    if (!validated.ok) {
      return validated.response;
    }

    const { email, password, name } = validated.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name ?? null,
      },
      select: { id: true },
    });

    return successResponse({ created: true }, 201);
  } catch (err) {
    console.error("POST /api/auth/register:", err);
    return serverErrorResponse();
  }
}
