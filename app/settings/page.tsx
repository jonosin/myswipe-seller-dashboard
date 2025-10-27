"use client";

import { useState } from "react";
import { z } from "zod";
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

  const [storeName, setStoreName] = useState<string>(store.storeName || "");
  const [storeSlug, setStoreSlug] = useState<string>(store.storeSlug || "");
  const [contactEmail, setContactEmail] = useState<string>(store.contactEmail || "");
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    const values = { storeName, storeSlug, contactEmail } as FormValues;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const map: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = (issue.path?.[0] as keyof FormValues) || undefined;
        if (key) map[key] = issue.message;
      }
      setErrors(map);
      setSubmitting(false);
      return;
    }
    store.update({
      storeName: values.storeName,
      storeSlug: values.storeSlug,
      contactEmail: values.contactEmail,
    });
    toast.success("Settings saved");
    setSubmitting(false);
  };

  return (
    <div>
      <Breadcrumbs />
      <h1 className="text-2xl mb-4">Settings</h1>

      <form onSubmit={onSubmit} className="card p-4 grid grid-cols-1 gap-4 max-w-2xl" aria-label="Settings form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="storeName">Store name</label>
            <input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" aria-invalid={!!errors.storeName} />
            {errors.storeName && <p className="text-sm text-neutral-600 mt-1">{errors.storeName}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="storeSlug">Store slug</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-700">myswipe.com/</span>
              <input id="storeSlug" value={storeSlug} onChange={(e) => setStoreSlug(e.target.value)} className="w-full rounded-r-md border border-neutral-300 px-3 py-2" aria-invalid={!!errors.storeSlug} />
            </div>
            {errors.storeSlug && <p className="text-sm text-neutral-600 mt-1">{errors.storeSlug}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="contactEmail">Contact email</label>
          <input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2" aria-invalid={!!errors.contactEmail} />
          {errors.contactEmail && <p className="text-sm text-neutral-600 mt-1">{errors.contactEmail}</p>}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-4 py-2">Save settings</button>
        </div>
      </form>
    </div>
  );
}
