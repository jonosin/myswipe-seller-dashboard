import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function StatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const styles: Record<string, string> = {
    paid: "bg-neutral-100 text-neutral-900 border-neutral-300",
    fulfilled: "bg-neutral-100 text-neutral-900 border-neutral-300",
    in_transit: "bg-neutral-100 text-neutral-900 border-neutral-300",
    refunded: "bg-neutral-100 text-neutral-900 border-neutral-300",
    active: "bg-green-100 text-green-800 border-green-200",
    draft: "bg-neutral-100 text-neutral-900 border-neutral-300",
    pending_review: "bg-neutral-100 text-neutral-900 border-neutral-300",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs", styles[status] || styles["draft"]) }>
      {t(`status.${status}`)}
    </span>
  );
}
