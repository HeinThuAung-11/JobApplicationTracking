import axios, { AxiosError } from "axios";

const baseURL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || "")
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: baseURL || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    return (
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      "An error occurred"
    );
  }
  if (err instanceof Error) return err.message;
  return "An error occurred";
}
