"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatThaiAddressLines, formatThaiPhoneForDisplay } from "@/lib/th-address";

type Props = {
  open: boolean;
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  onMarkFulfilled?: (orderId: string) => void;
};

export default function OrderDetailDrawer({ open, order, onOpenChange, onMarkFulfilled }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-lg bg-white border-l border-neutral-200 shadow-card p-4 overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold">Order {order?.id}</Dialog.Title>
          {order && (
            <div className="mt-3 space-y-4">
              <section>
                <h3 className="font-medium">Summary</h3>
                <div className="mt-2 text-sm text-neutral-700 grid grid-cols-2 gap-y-1">
                  <span>Status</span><span className="text-neutral-900">{order.status}</span>
                  <span>Date</span><span>{formatDate(order.createdAt)}</span>
                  <span>Total</span><span>{formatCurrency(order.total)}</span>
                  <span>Shipping</span><span>{formatCurrency(order.shippingCost)}</span>
                  {order.tracking && (<><span>Tracking</span><span>{order.tracking}</span></>)}
                </div>
              </section>

              <section>
                <h3 className="font-medium">Items</h3>
                <ul className="mt-2 space-y-2">
                  {order.items.map((i, idx) => (
                    <li key={idx} className="flex items-start justify-between text-sm">
                      <div>
                        <div className="font-medium">{i.title}</div>
                        <div className="text-neutral-600">{[i.size, i.color].filter(Boolean).join(" / ")}</div>
                      </div>
                      <div className="text-right">
                        <div>x{i.qty}</div>
                        <div>{formatCurrency(i.price)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="font-medium">Ship to</h3>
                <address className="not-italic text-sm text-neutral-700 mt-2">
                  <div className="font-medium text-neutral-900">{order.buyer.name}</div>
                  <div>{order.buyer.email}</div>
                  {order.buyer.address.phone && (
                    <div>{formatThaiPhoneForDisplay(order.buyer.address.phone)}</div>
                  )}
                  {formatThaiAddressLines(order.buyer.address).map((ln, idx) => (
                    <div key={idx}>{ln}</div>
                  ))}
                </address>
              </section>

              <section>
                <h3 className="font-medium">Timeline</h3>
                <ul className="mt-2 text-sm text-neutral-700 space-y-1">
                  <li>Order created on {formatDate(order.createdAt)}</li>
                  <li>Status: {order.status}</li>
                </ul>
              </section>

              <div className="flex justify-end gap-2">
                <Dialog.Close asChild>
                  <button className="rounded-md border border-neutral-300 px-3 py-2">Close</button>
                </Dialog.Close>
                {order.status !== "fulfilled" && order.status !== "refunded" && (
                  <button className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-3 py-2" onClick={() => onMarkFulfilled?.(order.id)}>Mark as fulfilled</button>
                )}
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
