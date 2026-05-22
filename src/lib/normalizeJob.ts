/**
 * normalizeJob
 *
 * Utility to normalize raw job data from various sources into a consistent
 * internal JobOps schema. Handles missing fields, trims whitespace, and
 * coerces types so downstream components always receive well-shaped data.
 */

export interface RawJob {
  id?: string | number;
  title?: string;
  company?: string;
  location?: string;
  remote?: boolean | string;
  salary?: string | number | { min?: number; max?: number; currency?: string };
  description?: string;
  tags?: string[] | string;
  url?: string;
  postedAt?: string | Date;
  source?: string;
}

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  salary: {
    min: number | null;
    max: number | null;
    currency: string;
    raw: string;
  };
  description: string;
  tags: string[];
  url: string;
  postedAt: Date | null;
  source: string;
}

/**
 * Coerce a raw salary value into a structured salary object.
 */
function normalizeSalary(
  raw: RawJob["salary"]
): NormalizedJob["salary"] {
  if (raw === undefined || raw === null) {
    return { min: null, max: null, currency: "GBP", raw: "" };
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    return {
      min: raw.min ?? null,
      max: raw.max ?? null,
      currency: raw.currency ?? "GBP",
      raw: [raw.min, raw.max].filter(Boolean).join(" – "),
    };
  }

  const str = String(raw).trim();
  // Attempt to extract numeric ranges like "£30,000 - £50,000"
  const matches = str.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/g);
  const numbers = matches ? matches.map(Number) : [];
  const currency = str.includes("$") ? "USD" : str.includes("€") ? "EUR" : "GBP";

  return {
    min: numbers[0] ?? null,
    max: numbers[1] ?? null,
    currency,
    raw: str,
  };
}

/**
 * Coerce a raw remote field to a boolean.
 */
function normalizeRemote(remote: RawJob["remote"]): boolean {
  if (typeof remote === "boolean") return remote;
  if (typeof remote === "string") {
    return ["true", "yes", "remote", "1"].includes(remote.toLowerCase());
  }
  return false;
}

/**
 * Coerce tags to a clean string array.
 */
function normalizeTags(tags: RawJob["tags"]): string[] {
  if (!tags) return [];
  if (typeof tags === "string") {
    return tags
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return tags.map((t) => t.trim()).filter(Boolean);
}

/**
 * Normalize a raw job object into the canonical NormalizedJob shape.
 *
 * @param raw - Untrusted job data from an external source or API.
 * @returns A fully typed, sanitized NormalizedJob.
 */
export function normalizeJob(raw: RawJob): NormalizedJob {
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    title: (raw.title ?? "Untitled Position").trim(),
    company: (raw.company ?? "Unknown Company").trim(),
    location: (raw.location ?? "Not specified").trim(),
    remote: normalizeRemote(raw.remote),
    salary: normalizeSalary(raw.salary),
    description: (raw.description ?? "").trim(),
    tags: normalizeTags(raw.tags),
    url: (raw.url ?? "").trim(),
    postedAt: raw.postedAt ? new Date(raw.postedAt) : null,
    source: (raw.source ?? "unknown").trim().toLowerCase(),
  };
}
