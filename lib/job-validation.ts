import { errorResponse } from "./api-response";
import { JOB_STATUSES } from "@/types";

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

const STATUS_SET = new Set(JOB_STATUSES);
const MAX_COMPANY_LENGTH = 120;
const MAX_POSITION_LENGTH = 160;
const MAX_STATUS_LENGTH = 32;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_URL_LENGTH = 2048;

function asTrimmedString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureMaxLength(value: string, max: number, field: string) {
  if (value.length > max) {
    return { ok: false as const, response: errorResponse(`${field} must be ${max} characters or fewer`, 400) };
  }
  return { ok: true as const };
}

function validateStatus(status: string) {
  if (!STATUS_SET.has(status as (typeof JOB_STATUSES)[number])) {
    return { ok: false as const, response: errorResponse("Invalid status value", 400) };
  }
  return { ok: true as const };
}

function validateOptionalUrl(urlValue: string) {
  if (urlValue.length > MAX_URL_LENGTH) {
    return { ok: false as const, response: errorResponse(`Job URL must be ${MAX_URL_LENGTH} characters or fewer`, 400) };
  }
  try {
    const parsed = new URL(urlValue);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false as const, response: errorResponse("Job URL must start with http:// or https://", 400) };
    }
    return { ok: true as const };
  } catch {
    return { ok: false as const, response: errorResponse("Job URL must be a valid URL", 400) };
  }
}

export function validateCreateJobInput(body: Record<string, unknown>) {
  const company = asTrimmedString(body.company);
  const position = asTrimmedString(body.position);
  const status = asTrimmedString(body.status);

  if (!company) return { ok: false as const, response: errorResponse("Company is required", 400) };
  if (!position) return { ok: false as const, response: errorResponse("Position is required", 400) };
  if (!status) return { ok: false as const, response: errorResponse("Status is required", 400) };

  const companyLengthCheck = ensureMaxLength(company, MAX_COMPANY_LENGTH, "Company");
  if (!companyLengthCheck.ok) return companyLengthCheck;
  const positionLengthCheck = ensureMaxLength(position, MAX_POSITION_LENGTH, "Position");
  if (!positionLengthCheck.ok) return positionLengthCheck;
  const statusLengthCheck = ensureMaxLength(status, MAX_STATUS_LENGTH, "Status");
  if (!statusLengthCheck.ok) return statusLengthCheck;
  const statusCheck = validateStatus(status);
  if (!statusCheck.ok) return statusCheck;

  const data: JobCreateData = {
    company,
    position,
    status,
  };

  if (body.description !== undefined && body.description !== null && body.description !== "") {
    const description = asTrimmedString(body.description);
    if (!description) return { ok: false as const, response: errorResponse("Description must be a string", 400) };
    const descriptionLengthCheck = ensureMaxLength(description, MAX_DESCRIPTION_LENGTH, "Description");
    if (!descriptionLengthCheck.ok) return descriptionLengthCheck;
    data.description = description;
  }

  if (body.jobUrl !== undefined && body.jobUrl !== null && body.jobUrl !== "") {
    const jobUrl = asTrimmedString(body.jobUrl);
    if (!jobUrl) return { ok: false as const, response: errorResponse("Job URL must be a string", 400) };
    const urlCheck = validateOptionalUrl(jobUrl);
    if (!urlCheck.ok) return urlCheck;
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
    const companyLengthCheck = ensureMaxLength(company, MAX_COMPANY_LENGTH, "Company");
    if (!companyLengthCheck.ok) return companyLengthCheck;
    data.company = company;
  }

  if (body.position !== undefined) {
    const position = asTrimmedString(body.position);
    if (!position) {
      return { ok: false as const, response: errorResponse("Position must be a non-empty string", 400) };
    }
    const positionLengthCheck = ensureMaxLength(position, MAX_POSITION_LENGTH, "Position");
    if (!positionLengthCheck.ok) return positionLengthCheck;
    data.position = position;
  }

  if (body.status !== undefined) {
    const status = asTrimmedString(body.status);
    if (!status) {
      return { ok: false as const, response: errorResponse("Status must be a non-empty string", 400) };
    }
    const statusLengthCheck = ensureMaxLength(status, MAX_STATUS_LENGTH, "Status");
    if (!statusLengthCheck.ok) return statusLengthCheck;
    const statusCheck = validateStatus(status);
    if (!statusCheck.ok) return statusCheck;
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
      const descriptionLengthCheck = ensureMaxLength(description, MAX_DESCRIPTION_LENGTH, "Description");
      if (!descriptionLengthCheck.ok) return descriptionLengthCheck;
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
      const urlCheck = validateOptionalUrl(jobUrl);
      if (!urlCheck.ok) return urlCheck;
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
