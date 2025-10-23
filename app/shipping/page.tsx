"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Breadcrumbs from "@/components/breadcrumbs";
import ShippingProfileForm from "@/components/shipping-profile-form";
import ConfirmDialog from "@/components/confirm-dialog";
import ThaiAddressFields from "@/components/thai-address-fields";
import { formatCurrency } from "@/lib/utils";
import { getShipping, saveShippingProfile, deleteShippingProfile, updateShippingSettings } from "@/lib/repo";
import type { ShippingData, ShippingProfile } from "@/lib/types";
import { toast } from "@/components/toast";
import { thaiAddressSchema } from "@/lib/th-address";

export default function ShippingPage() {
  const [data, setData] = useState<ShippingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<ShippingProfile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const settingsSchema = z.object({
    handlingTimeDays: z.coerce.number().int().min(0).default(2),
    country: z.literal("Thailand").default("Thailand"),
    fullName: z.string().min(1, "Required"),
    phone: z.string().min(1, "Required"),
    province: z.string().min(1, "Required"),
    district: z.string().min(1, "Required"),
    subdistrict: z.string().min(1, "Required"),
    postalCode: z.string().min(5).max(5),
    addressLine1: z.string().min(1, "Required"),
    addressLine2: z.string().optional(),
  });

  type SettingsForm = z.infer<typeof settingsSchema>;

  const { register, handleSubmit, formState: { isSubmitting }, setValue, watch, reset } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema.refine((v) => thaiAddressSchema.safeParse(v).success, { path: ["postalCode"], message: "Invalid Thai address" })),
    defaultValues: {
      handlingTimeDays: 2,
      country: "Thailand",
      fullName: "Myshop Warehouse",
      phone: "+66 85 222 3344",
      province: "เชียงใหม่",
      district: "เมืองเชียงใหม่",
      subdistrict: "ศรีภูมิ",
      postalCode: "50200",
      addressLine1: "129/3 Thapae Rd",
      addressLine2: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    getShipping().then((d) => { if (!mounted) return; setData(d); setLoading(false);
      const a = d.originAddress;
      reset({
        handlingTimeDays: d.handlingTimeDays,
        country: "Thailand",
        fullName: a.fullName || "",
        phone: a.phone || "",
        province: a.province || "",
        district: a.district || "",
        subdistrict: a.subdistrict || "",
        postalCode: a.postalCode || "",
        addressLine1: a.addressLine1 || "",
        addressLine2: a.addressLine2 || "",
      });
    });
    return () => { mounted = false; };
  }, []);

  const onSaveProfile = async (input: Omit<ShippingProfile, "id"> & { id?: string }) => {
    await saveShippingProfile(input);
    const d = await getShipping();
    setData(d);
    toast.success(input.id ? "Profile updated" : "Profile created");
  };

  const onDeleteProfile = async () => {
    if (!deleteId) return;
    await deleteShippingProfile(deleteId);
    const d = await getShipping();
    setData(d);
    setDeleteId(null);
    toast.success("Profile deleted");
  };

  const onSaveSettings = handleSubmit(async (values) => {
    await updateShippingSettings({
      originAddress: {
        country: values.country,
        fullName: values.fullName,
        phone: values.phone,
        province: values.province,
        district: values.district,
        subdistrict: values.subdistrict,
        postalCode: values.postalCode,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
      },
      handlingTimeDays: values.handlingTimeDays,
    });
    const d = await getShipping();
    setData(d);
    toast.success("Shipping settings saved");
  });

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl mb-4">Shipping</h1>

      {loading || !data ? (
        <div className="card p-4">
          <div className="h-5 w-40 bg-neutral-100 rounded mb-3" />
          <div className="h-5 w-full bg-neutral-100 rounded mb-2" />
          <div className="h-5 w-3/4 bg-neutral-100 rounded" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="card p-4">
            <h2 className="text-lg font-semibold">Origin & handling</h2>
            <form onSubmit={onSaveSettings} className="mt-3 grid grid-cols-1 gap-3" aria-label="Shipping settings">
              <div>
                <label className="block text-sm mb-1" htmlFor="handlingTimeDays">Handling time (days)</label>
                <input id="handlingTimeDays" type="number" min={0} {...register("handlingTimeDays", { valueAsNumber: true })} className="w-full rounded-md border border-neutral-300 px-3 py-2" />
              </div>
              <ThaiAddressFields register={register} watch={watch} setValue={setValue} mode="text" />
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-4 py-2">Save</button>
              </div>
            </form>
          </section>

          <section className="card p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Shipping Profiles</h2>
              <button onClick={() => { setEditing(null); setOpenForm(true); }} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-sm">New profile</button>
            </div>
            <ul className="mt-3 divide-y divide-neutral-200">
              {data.profiles.map((p) => (
                <li key={p.id} className="py-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-neutral-700">Regions: {p.regions.join(", ")}</div>
                    <ul className="mt-1 text-sm text-neutral-700">
                      {p.rateRules.map((r) => (
                        <li key={r.id}>{r.name}: {formatCurrency(r.price)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm" onClick={() => { setEditing(p); setOpenForm(true); }}>Edit</button>
                    <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm" onClick={() => setDeleteId(p.id)}>Delete</button>
                  </div>
                </li>
              ))}
              {data.profiles.length === 0 && (
                <li className="py-6 text-sm text-neutral-600">No shipping profiles. Create one to get started.</li>
              )}
            </ul>
          </section>
        </div>
      )}

      <ShippingProfileForm open={openForm} onOpenChange={setOpenForm} initial={editing} onSave={onSaveProfile} />
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete profile" description="This cannot be undone." onConfirm={onDeleteProfile} />
    </div>
  );
}
