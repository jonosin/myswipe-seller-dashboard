import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(inputs.filter(Boolean).join(" "));
}

// Money helpers (THB)
export function toMinor(major: number): number {
  const v = Math.round((Number(major) || 0) * 100);
  return v;
}

export function toMajor(minor: number): number {
  const v = (Number(minor) || 0) / 100;
  return v;
}

export function formatTHB(minor: number): string {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(toMajor(minor));
}

// Legacy formatting kept for existing UI that passes majors
export function formatCurrency(value: number, currency: string = "THB") {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(value);
}

// Currency formatting without forced trailing zeros (e.g., ฿100 instead of ฿100.00)
export function formatTHBCompact(minor: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(toMajor(minor));
}

export function formatDate(date: string | number | Date) {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}
