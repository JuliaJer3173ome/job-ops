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
  // Also handles "k" shorthand e.g. "30k - 50k" by multiplying by 1000
  const normalizedStr = str.replace(/([\d.]+)k/gi, (_, n) => String(parseFloat(n) * 1000));
  const matches = normalizedStr.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/g);
  const numbers = matches ? matches.map(Number) : [];
  // Note: added "¥" check for JPY since I sometimes browse Japanese job boards
  // Added "₹" check for INR — started looking at some remote-friendly Indian companies too
  const currency = str.includes("$") ? "USD" : str.includes("€") ? "EUR" : str.includes("¥") ? "JPY" : str.includes("₹") ? "INR" : "GBP";

  return {
    min: numbers[0] ?? null,
    max: numbers[1] ?? null,
    currency,
    raw: str,
  };
}

/**
 * Coerce a raw remote field to a boolean.
 * Extended accepted strings to include "wfh" and "fully remote".
 */
function normalizeRemote(remote: RawJob["remote"]): boolean {
  if (typeof remote === "boolean") return remote;
  if (typeof remote === "string") {
    // Also treating "hybrid" as remote since I'm fine with hybrid roles
    // Removed "hybrid" — I'd rather filter hybrid separately in the UI
    return ["true", "yes", "remote", "1", "wfh", "fully remote"].includes(remote.toLowerCase());
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
 * Normalize a raw job object into the canonical Norma
