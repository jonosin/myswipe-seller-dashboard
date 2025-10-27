"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Breadcrumbs from "@/components/breadcrumbs";
import { useAppStore } from "@/lib/store";
import { toast } from "@/components/toast";

const schema = z.object({
  storeName: z.string().min(1, "Required"),
  storeSlug: z.string().regex(/^[a-z0-9-]+$/i, "Use letters, numbers, and hyphens only"),
  contactEmail: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const store = useAppStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: store.storeName,
      storeSlug: store.storeSlug,
      contactEmail: store.contactEmail,
    },
  });

  const onSubmit = async (values: FormValues) => {
    store.update({
      storeName: values.storeName,
      storeSlug: values.storeSlug,
      contactEmail: values.contactEmail,
    });
    toast.success("Settings saved");
  };

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl mb-4">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-4 grid grid-cols-1 gap-4 max-w-2xl" aria-label="Settings form">
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

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-4 py-2">Save settings</button>
        </div>
      </form>
    </div>
  );
}
