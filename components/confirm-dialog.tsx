"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useT } from "@/lib/i18n";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export default function ConfirmDialog({ open, title, description, confirmText, cancelText, onConfirm, onOpenChange }: Props) {
  const { t } = useT();
  const confirm = confirmText || t("common.confirm");
  const cancel = cancelText || t("common.cancel");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-white p-4 shadow-card">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          {description && <Dialog.Description className="mt-2 text-sm text-neutral-700">{description}</Dialog.Description>}
          <div className="mt-4 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">{cancel}</button>
            </Dialog.Close>
            <button className="rounded-md border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-sm text-white" onClick={onConfirm}>{confirm}</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
