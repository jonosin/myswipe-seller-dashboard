import { z } from "zod";
import type { Address } from "./types";
import { getDistricts, getSubdistricts, isBangkok, thProvinces } from "./th-geo";

export const thaiPostalRegex = /^[0-9]{5}$/;
export const thaiPhoneRegex = /^(?:\+66\s?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}|0\d{8,9})$/;

export const thaiAddressSchema = z.object({
  fullName: z.string().min(1, "Required"),
  phone: z.string().regex(thaiPhoneRegex, "Use +66 or 0-leading phone"),
  country: z.literal("Thailand"),
  province: z.string().min(1, "Required"),
  district: z.string().min(1, "Required"),
  subdistrict: z.string().min(1, "Required"),
  postalCode: z.string().regex(thaiPostalRegex, "5 digits"),
  addressLine1: z.string().min(1, "Required"),
  addressLine2: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export function isValidThaiPostal(value: string) {
  return thaiPostalRegex.test(value);
}

export function isValidThaiPhone(value: string) {
  return thaiPhoneRegex.test(value);
}

export function formatThaiPhoneForDisplay(value?: string) {
  if (!value) return "";
  const digits = value.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+66")) {
    // +66 81 234 5678
    const rest = digits.replace("+66", "").replace(/^0/, "");
    const spaced = rest.replace(/(\d{2})(\d{3})(\d{4})/, "$1 $2 $3");
    return `+66 ${spaced}`.trim();
  }
  if (digits.startsWith("0")) {
    // 081-234-5678 or 090-123-4567
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  return value;
}

export function formatThaiAddressLines(a: Address): string[] {
  // Prefer Thai fields if present
  if (a.country === "Thailand" && (a.province || a.district || a.subdistrict)) {
    const lines: string[] = [];
    const name = a.fullName ? a.fullName : undefined;
    if (name) lines.push(name);
    if (a.addressLine1) lines.push(a.addressLine1);
    if (a.addressLine2) lines.push(a.addressLine2);
    const parts: string[] = [];
    if (a.subdistrict) parts.push(a.subdistrict);
    if (a.district) parts.push(a.district);
    if (a.province) parts.push(a.province);
    if (a.postalCode) parts.push(a.postalCode);
    if (parts.length) lines.push(parts.join(" "));
    lines.push("Thailand");
    return lines;
  }
  // Fallback to legacy fields
  const legacy: string[] = [];
  if (a.line1) legacy.push(a.line1);
  if (a.line2) legacy.push(a.line2);
  const cityline = [a.city, a.state, a.postalCode].filter(Boolean).join(", ");
  if (cityline) legacy.push(cityline);
  if (a.country) legacy.push(a.country);
  return legacy;
}

export { thProvinces, getDistricts, getSubdistricts, isBangkok };
