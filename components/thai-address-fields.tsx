"use client";

import { useEffect, useMemo } from "react";
import type { UseFormRegister, UseFormSetValue, FieldErrors, UseFormWatch } from "react-hook-form";
import { isBangkok, thProvinces, getDistricts, getSubdistricts } from "@/lib/th-address";

export type ThaiAddressFieldsProps<FormValues extends Record<string, any>> = {
  register: UseFormRegister<FormValues>;
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  errors?: FieldErrors<FormValues>;
  // Field names mapping to integrate with various forms
  names?: {
    country?: keyof FormValues;
    fullName?: keyof FormValues;
    phone?: keyof FormValues;
    province?: keyof FormValues;
    district?: keyof FormValues;
    subdistrict?: keyof FormValues;
    postalCode?: keyof FormValues;
    addressLine1?: keyof FormValues;
    addressLine2?: keyof FormValues;
  };
  mode?: "select" | "text"; // select = default existing behavior; text = plain inputs
};

export default function ThaiAddressFields<FormValues extends Record<string, any>>({ register, watch, setValue, errors, names, mode = "select" }: ThaiAddressFieldsProps<FormValues>) {
  const n = {
    country: (names?.country || ("country" as keyof FormValues)) as any,
    fullName: (names?.fullName || ("fullName" as keyof FormValues)) as any,
    phone: (names?.phone || ("phone" as keyof FormValues)) as any,
    province: (names?.province || ("province" as keyof FormValues)) as any,
    district: (names?.district || ("district" as keyof FormValues)) as any,
    subdistrict: (names?.subdistrict || ("subdistrict" as keyof FormValues)) as any,
    postalCode: (names?.postalCode || ("postalCode" as keyof FormValues)) as any,
    addressLine1: (names?.addressLine1 || ("addressLine1" as keyof FormValues)) as any,
    addressLine2: (names?.addressLine2 || ("addressLine2" as keyof FormValues)) as any,
  };

  const province = watch(n.province as any) as string | undefined;
  const district = watch(n.district as any) as string | undefined;
  const subdistrict = watch(n.subdistrict as any) as string | undefined;

  const districtOptions = useMemo(() => (province ? getDistricts(province) : []), [province]);
  const subdistrictOptions = useMemo(() => (province && district ? getSubdistricts(province, district) : []), [province, district]);

  useEffect(() => {
    if (mode !== "select") return;
    // reset district and subdistrict when province changes
    setValue(n.district, "" as any, { shouldDirty: true });
    setValue(n.subdistrict, "" as any, { shouldDirty: true });
  }, [province, mode]);

  useEffect(() => {
    if (mode !== "select") return;
    // reset subdistrict when district changes
    setValue(n.subdistrict, "" as any, { shouldDirty: true });
  }, [district, mode]);

  useEffect(() => {
    if (mode !== "select") return;
    // auto-fill postal code when subdistrict selected
    if (subdistrict) {
      const found = subdistrictOptions.find((s) => s.nameTh === subdistrict);
      if (found?.postalCode) setValue(n.postalCode, found.postalCode as any, { shouldDirty: true });
    }
  }, [subdistrict, subdistrictOptions, mode]);

  const bangkok = isBangkok(province);

  return (
    <div className="grid grid-cols-1 gap-3">
      <input type="hidden" value="Thailand" {...register(n.country as any)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="fullName">Full name</label>
          <input id="fullName" {...register(n.fullName as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="phone">Phone</label>
          <input id="phone" {...register(n.phone as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" placeholder="+66 85 222 3344 or 0812345678" />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="addressLine1">Address line 1</label>
        <input id="addressLine1" {...register(n.addressLine1 as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1" htmlFor="addressLine2">Address line 2</label>
        <input id="addressLine2" {...register(n.addressLine2 as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="province">Province (จังหวัด)</label>
          {mode === "select" ? (
            <select id="province" {...register(n.province as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2">
              <option value="">Select province</option>
              {thProvinces.map((p) => (
                <option key={p.nameTh} value={p.nameTh}>{p.nameTh}</option>
              ))}
            </select>
          ) : (
            <input id="province" {...register(n.province as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" placeholder="จังหวัด" />
          )}
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="district">{bangkok ? "District (เขต)" : "District (อำเภอ)"}</label>
          {mode === "select" ? (
            <select id="district" {...register(n.district as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2">
              <option value="">Select district</option>
              {districtOptions.map((d) => (
                <option key={d.nameTh} value={d.nameTh}>{d.nameTh}</option>
              ))}
            </select>
          ) : (
            <input id="district" {...register(n.district as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" placeholder={bangkok ? "เขต" : "อำเภอ"} />
          )}
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="subdistrict">{bangkok ? "Subdistrict (แขวง)" : "Subdistrict (ตำบล)"}</label>
          {mode === "select" ? (
            <select id="subdistrict" {...register(n.subdistrict as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2">
              <option value="">Select subdistrict</option>
              {subdistrictOptions.map((s) => (
                <option key={s.nameTh} value={s.nameTh}>{s.nameTh}</option>
              ))}
            </select>
          ) : (
            <input id="subdistrict" {...register(n.subdistrict as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" placeholder={bangkok ? "แขวง" : "ตำบล"} />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="postalCode">Postal code</label>
        <input id="postalCode" {...register(n.postalCode as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" placeholder="10110" />
      </div>
    </div>
  );
}
