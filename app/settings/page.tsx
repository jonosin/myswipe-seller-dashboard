"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Breadcrumbs from "@/components/breadcrumbs";
import { useAppStore } from "@/lib/store";
import { toast } from "@/components/toast";
import ThaiAddressFields from "@/components/thai-address-fields";
import { thaiAddressSchema } from "@/lib/th-address";

const baseSchema = z.object({
  storeName: z.string().min(1, "Required"),
  storeSlug: z.string().regex(/^[a-z0-9-]+$/i, "Use letters, numbers, and hyphens only"),
  contactEmail: z.string().email(),
  returnPolicy: z.string().min(10, "At least 10 characters"),
  notifyOrder: z.boolean().default(true),
  notifyPayout: z.boolean().default(true),
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

const schema = baseSchema.refine((v) => thaiAddressSchema.safeParse(v).success, { path: ["postalCode"], message: "Invalid Thai address" });

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const store = useAppStore();

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: store.storeName,
      storeSlug: store.storeSlug,
      contactEmail: store.contactEmail,
      returnPolicy: store.returnPolicy,
      notifyOrder: store.notifyOrder,
      notifyPayout: store.notifyPayout,
      country: "Thailand" as const,
      fullName: store.storeAddress?.fullName || store.storeName,
      phone: store.storeAddress?.phone || "",
      province: store.storeAddress?.province || "กรุงเทพมหานคร",
      district: store.storeAddress?.district || "วัฒนา",
      subdistrict: store.storeAddress?.subdistrict || "คลองตันเหนือ",
      postalCode: store.storeAddress?.postalCode || "10110",
      addressLine1: store.storeAddress?.addressLine1 || "55/7 Soi Sukhumvit 63, Ekkamai",
      addressLine2: store.storeAddress?.addressLine2 || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    store.update({
      storeName: values.storeName,
      storeSlug: values.storeSlug,
      contactEmail: values.contactEmail,
      returnPolicy: values.returnPolicy,
      notifyOrder: values.notifyOrder,
      notifyPayout: values.notifyPayout,
      storeAddress: {
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
    });
    toast.success("Settings saved");
  };

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl mb-4">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-4 grid grid-cols-1 gap-4 max-w-3xl" aria-label="Settings form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="storeName">Store name</label>
            <input id="storeName" {...register("storeName")} className="w-full rounded-md border border-neutral-300 px-3 py-2" aria-invalid={!!errors.storeName} />
            {errors.storeName && <p className="text-sm text-neutral-600 mt-1">{errors.storeName.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="storeSlug">Store slug</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-700">myswipe.com/</span>
              <input id="storeSlug" {...register("storeSlug")} className="w-full rounded-r-md border border-neutral-300 px-3 py-2" aria-invalid={!!errors.storeSlug} />
            </div>
            {errors.storeSlug && <p className="text-sm text-neutral-600 mt-1">{errors.storeSlug.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="contactEmail">Contact email</label>
          <input id="contactEmail" type="email" {...register("contactEmail")} className="w-full rounded-md border border-neutral-300 px-3 py-2" aria-invalid={!!errors.contactEmail} />
          {errors.contactEmail && <p className="text-sm text-neutral-600 mt-1">{errors.contactEmail.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="returnPolicy">Return policy</label>
          <textarea id="returnPolicy" rows={4} {...register("returnPolicy")} className="w-full rounded-md border border-neutral-300 px-3 py-2" aria-invalid={!!errors.returnPolicy} />
          {errors.returnPolicy && <p className="text-sm text-neutral-600 mt-1">{errors.returnPolicy.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="taxId">Tax ID</label>
            <input id="taxId" disabled placeholder={store.taxIdMasked} className="w-full rounded-md border border-neutral-300 px-3 py-2 bg-neutral-50 text-neutral-600" />
          </div>
        </div>

        <fieldset className="mt-2">
          <legend className="text-sm font-medium">Store address (Thailand)</legend>
          <div className="mt-2">
            <ThaiAddressFields register={register} watch={watch} setValue={setValue} />
          </div>
        </fieldset>

        <fieldset className="mt-2">
          <legend className="text-sm font-medium">Notifications</legend>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("notifyOrder")} /> New orders
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("notifyPayout")} /> Payout updates
            </label>
          </div>
        </fieldset>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-4 py-2">Save settings</button>
        </div>
      </form>
    </div>
  );
}
