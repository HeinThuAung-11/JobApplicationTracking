import { NextResponse } from "next/server";

export interface ApiError {
  message: string;
  code?: string;
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { message, ...(code && { code }) } as ApiError,
    { status }
  );
}

export function notFoundResponse(message = "Resource not found") {
  return errorResponse(message, 404, "NOT_FOUND");
}

export function serverErrorResponse(message = "Internal server error") {
  return errorResponse(message, 500, "INTERNAL_ERROR");
}
