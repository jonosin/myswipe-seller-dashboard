"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ShippingProfile } from "@/lib/types";

const ruleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Required"),
  price: z.coerce.number().min(0),
});

const schema = z.object({
  name: z.string().min(1, "Required"),
  regionsText: z.string().min(1, "Required"),
  rateRules: z.array(ruleSchema).min(1, "Add at least one rate"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ShippingProfile | null;
  onSave: (input: Omit<ShippingProfile, "id"> & { id?: string }) => Promise<void> | void;
};

export default function ShippingProfileForm({ open, onOpenChange, initial, onSave }: Props) {
  const isEdit = !!initial;
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      name: initial.name,
      regionsText: initial.regions.join(", "),
      rateRules: initial.rateRules,
    } : {
      name: "",
      regionsText: "TH",
      rateRules: [{ name: "Standard", price: 5 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rateRules" });

  const onSubmit = async (values: FormValues) => {
    const regions = values.regionsText.split(",").map((r) => r.trim()).filter(Boolean);
    const payload: Omit<ShippingProfile, "id"> & { id?: string } = {
      id: initial?.id,
      name: values.name,
      regions,
      rateRules: values.rateRules.map((r) => ({ id: r.id || crypto.randomUUID(), name: r.name, price: r.price })),
    };
    await onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] max-w-xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
          <Dialog.Title className="text-lg font-semibold">{isEdit ? "Edit Shipping Profile" : "New Shipping Profile"}</Dialog.Title>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="name">Name</label>
              <input id="name" autoFocus {...register("name")} className="w-full rounded-lg border border-neutral-300 px-3 py-2" aria-invalid={!!errors.name} />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="regions">Regions (comma-separated ISO codes)</label>
              <input id="regions" {...register("regionsText")} className="w-full rounded-lg border border-neutral-300 px-3 py-2" aria-invalid={!!errors.regionsText} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rates</span>
                <button type="button" className="rounded-md border border-neutral-300 px-2 py-1 text-sm" onClick={() => append({ name: "", price: 0 })}>Add rate</button>
              </div>
              <div className="mt-2 space-y-2">
                {fields.map((f, idx) => (
                  <div key={f.id} className="grid grid-cols-12 gap-2">
                    <input placeholder="Name" {...register(`rateRules.${idx}.name` as const)} className="col-span-7 rounded-lg border border-neutral-300 px-3 py-2" />
                    <input placeholder="Price" type="number" step="0.01" {...register(`rateRules.${idx}.price` as const, { valueAsNumber: true })} className="col-span-3 rounded-lg border border-neutral-300 px-3 py-2" />
                    <button type="button" onClick={() => remove(idx)} className="col-span-2 rounded-lg border border-neutral-300 px-3 py-2">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className="rounded-md border border-neutral-300 px-3 py-2">Cancel</button>
              </Dialog.Close>
              <button type="submit" disabled={isSubmitting} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-4 py-2 disabled:opacity-50">{isEdit ? "Save changes" : "Create profile"}</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
