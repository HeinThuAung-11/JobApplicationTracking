import { errorResponse } from "./api-response";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // bcrypt truncates after 72 bytes

export type RegisterData = {
  email: string;
  password: string;
  name?: string;
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateRegisterInput(body: Record<string, unknown>) {
  const emailInput = asTrimmedString(body.email);
  const passwordInput = typeof body.password === "string" ? body.password : null;
  const nameInput = asTrimmedString(body.name);

  if (!emailInput || !EMAIL_REGEX.test(emailInput)) {
    return { ok: false as const, response: errorResponse("A valid email is required", 400) };
  }

  if (!passwordInput) {
    return { ok: false as const, response: errorResponse("Password is required", 400) };
  }

  if (
    passwordInput.length < MIN_PASSWORD_LENGTH ||
    passwordInput.length > MAX_PASSWORD_LENGTH
  ) {
    return {
      ok: false as const,
      response: errorResponse(
        `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters`,
        400
      ),
    };
  }

  const data: RegisterData = {
    email: emailInput.toLowerCase(),
    password: passwordInput,
  };

  if (nameInput) {
    data.name = nameInput;
  }

  return { ok: true as const, data };
}
