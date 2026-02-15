import { errorResponse } from "./api-response";

type JobCreateData = {
  company: string;
  position: string;
  status: string;
  description?: string;
  jobUrl?: string;
  applyDate?: Date;
};

type JobUpdateData = {
  company?: string;
  position?: string;
  status?: string;
  description?: string | null;
  jobUrl?: string | null;
  applyDate?: Date | null;
};

function asTrimmedString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function validateCreateJobInput(body: Record<string, unknown>) {
  const company = asTrimmedString(body.company);
  const position = asTrimmedString(body.position);
  const status = asTrimmedString(body.status);

  if (!company) return { ok: false as const, response: errorResponse("Company is required", 400) };
  if (!position) return { ok: false as const, response: errorResponse("Position is required", 400) };
  if (!status) return { ok: false as const, response: errorResponse("Status is required", 400) };

  const data: JobCreateData = {
    company,
    position,
    status,
  };

  if (body.description !== undefined && body.description !== null && body.description !== "") {
    const description = asTrimmedString(body.description);
    if (!description) return { ok: false as const, response: errorResponse("Description must be a string", 400) };
    data.description = description;
  }

  if (body.jobUrl !== undefined && body.jobUrl !== null && body.jobUrl !== "") {
    const jobUrl = asTrimmedString(body.jobUrl);
    if (!jobUrl) return { ok: false as const, response: errorResponse("Job URL must be a string", 400) };
    data.jobUrl = jobUrl;
  }

  if (body.applyDate !== undefined && body.applyDate !== null && body.applyDate !== "") {
    if (typeof body.applyDate !== "string") {
      return { ok: false as const, response: errorResponse("Apply date must be a string", 400) };
    }
    const d = new Date(body.applyDate);
    if (Number.isNaN(d.getTime())) {
      return { ok: false as const, response: errorResponse("Invalid apply date", 400) };
    }
    data.applyDate = d;
  }

  return { ok: true as const, data };
}

export function validateUpdateJobInput(body: Record<string, unknown>) {
  const data: JobUpdateData = {};

  if (body.company !== undefined) {
    const company = asTrimmedString(body.company);
    if (!company) {
      return { ok: false as const, response: errorResponse("Company must be a non-empty string", 400) };
    }
    data.company = company;
  }

  if (body.position !== undefined) {
    const position = asTrimmedString(body.position);
    if (!position) {
      return { ok: false as const, response: errorResponse("Position must be a non-empty string", 400) };
    }
    data.position = position;
  }

  if (body.status !== undefined) {
    const status = asTrimmedString(body.status);
    if (!status) {
      return { ok: false as const, response: errorResponse("Status must be a non-empty string", 400) };
    }
    data.status = status;
  }

  if (body.description !== undefined) {
    if (body.description === null || body.description === "") {
      data.description = null;
    } else {
      const description = asTrimmedString(body.description);
      if (!description) {
        return { ok: false as const, response: errorResponse("Description must be a string", 400) };
      }
      data.description = description;
    }
  }

  if (body.jobUrl !== undefined) {
    if (body.jobUrl === null || body.jobUrl === "") {
      data.jobUrl = null;
    } else {
      const jobUrl = asTrimmedString(body.jobUrl);
      if (!jobUrl) {
        return { ok: false as const, response: errorResponse("Job URL must be a string", 400) };
      }
      data.jobUrl = jobUrl;
    }
  }

  if (body.applyDate !== undefined) {
    if (body.applyDate === null || body.applyDate === "") {
      data.applyDate = null;
    } else if (typeof body.applyDate === "string") {
      const d = new Date(body.applyDate);
      if (Number.isNaN(d.getTime())) {
        return { ok: false as const, response: errorResponse("Invalid apply date", 400) };
      }
      data.applyDate = d;
    } else {
      return { ok: false as const, response: errorResponse("Apply date must be a string", 400) };
    }
  }

  return { ok: true as const, data };
}
