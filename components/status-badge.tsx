import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-neutral-100 text-neutral-900 border-neutral-300",
    fulfilled: "bg-neutral-100 text-neutral-900 border-neutral-300",
    in_transit: "bg-neutral-100 text-neutral-900 border-neutral-300",
    refunded: "bg-neutral-100 text-neutral-900 border-neutral-300",
    active: "bg-green-100 text-green-800 border-green-200",
    draft: "bg-neutral-100 text-neutral-900 border-neutral-300",
    pending_review: "bg-neutral-100 text-neutral-900 border-neutral-300",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", styles[status] || styles["draft"]) }>
      {status === "pending_review" ? "pending" : status.replace("_", " ")}
    </span>
  );
}
