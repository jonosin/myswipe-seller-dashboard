"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster position="top-right" closeButton richColors={false} />
  );
}

export const toast = sonnerToast;
