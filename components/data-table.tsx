"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  enableSelection?: boolean;
  selectedIds?: Set<string>;
  onToggleRow?: (id: string, selected: boolean) => void;
  onToggleAll?: (selected: boolean) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
};

export default function DataTable<T extends { id: string }>({ columns, rows, onRowClick, enableSelection, selectedIds, onToggleRow, onToggleAll, page = 1, pageSize = 10, total = rows.length, onPageChange }: Props<T>) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = enableSelection && selectedIds && rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {enableSelection && (
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={!!allSelected}
                    onChange={(e) => onToggleAll?.(e.target.checked)}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={String(c.key)} style={{ width: c.width }} className={cn(c.headerClassName, c.align === "right" && "text-right", c.align === "center" && "text-center")}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => onRowClick?.(row)}>
                {enableSelection && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select row ${row.id}`}
                      checked={selectedIds ? selectedIds.has(row.id) : false}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onToggleRow?.(row.id, e.target.checked)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={String(c.key)} className={cn(c.className, c.align === "right" && "text-right", c.align === "center" && "text-center")}>{c.render ? c.render(row) : String((row as any)[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <div className="flex items-center justify-between p-3">
          <div className="text-sm text-neutral-600">Page {page} of {pageCount}</div>
          <div className="flex gap-2">
            <button className="rounded-md border border-neutral-300 px-3 py-1 disabled:opacity-50" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Prev</button>
            <button className="rounded-md border border-neutral-300 px-3 py-1 disabled:opacity-50" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
