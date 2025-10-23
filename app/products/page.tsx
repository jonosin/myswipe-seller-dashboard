"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Breadcrumbs from "@/components/breadcrumbs";
import DataTable from "@/components/data-table";
import ProductForm from "@/components/product-form";
import { StatusBadge } from "@/components/status-badge";
import { listProducts } from "@/lib/api/products";
import { removeProduct, getProduct, submitProductForReview } from "@/lib/api/products";
import { getSellerStatus } from "@/lib/api/seller";
import { Filter, ChevronLeft, ChevronRight, X as CloseIcon } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Product } from "@/lib/types";
import type { ProductSummary } from "@/types/product";
import { cn, formatTHB } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import ConfirmDialog from "@/components/confirm-dialog";
import { toast } from "@/components/toast";

export default function ProductsPage() {
  const [rows, setRows] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [btnEl, setBtnEl] = useState<HTMLButtonElement | null>(null);
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null);
  const [total, setTotal] = useState(0);
  const [sellerStatus, setSellerStatus] = useState<"pending"|"approved"|"disabled">("approved");

  // Lightbox for thumbnails
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxReturnEl, setLightboxReturnEl] = useState<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const {
    productSearch, productStatus, productCategory, productMode, productMinDiscount, productPage, productPageSize,
    productSetFilters,
  } = useAppStore((s) => ({
    productSearch: s.productSearch,
    productStatus: s.productStatus,
    productCategory: s.productCategory,
    productMode: s.productMode,
    productMinDiscount: s.productMinDiscount,
    productPage: s.productPage,
    productPageSize: s.productPageSize,
    productSetFilters: s.productSetFilters,
  }));

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params = {
      q: productSearch || undefined,
      status: productStatus === "all" ? undefined : (productStatus as any),
      mode: productMode === "all" ? undefined : (productMode as any),
      min_discount: productMode === "deal" ? productMinDiscount : undefined,
      page: productPage,
      page_size: productPageSize,
    } as const;
    listProducts(params).then((resp) => {
      if (!mounted) return;
      setRows(resp.items);
      setTotal(resp.total);
      setLoading(false);
    }).catch((e) => {
      setError(String(e));
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [productSearch, productStatus, productMode, productMinDiscount, productPage, productPageSize]);

  // Fetch seller status to gate create/edit
  useEffect(() => {
    let mounted = true;
    getSellerStatus().then((res) => { if (mounted) setSellerStatus(res.status); }).catch(()=>{});
    return () => { mounted = false; };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((p) => { if (p.category) set.add(p.category); });
    return ["all", ...Array.from(set)];
  }, [rows]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (productCategory !== "all") n++;
    if (productMode !== "all") n++;
    if (typeof productMinDiscount === "number") n++;
    return n;
  }, [productCategory, productMode, productMinDiscount]);

  // Server-side filters are applied via listProducts; only category filter remains client-side when present
  const filtered = useMemo(() => {
    let out = rows.slice();
    if (productCategory !== "all") out = out.filter((p) => p.category === productCategory);
    return out;
  }, [rows, productCategory]);

  // Filters: close on outside click / other interactions, and return focus to button
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!filtersOpen) return;
      const target = e.target as Node | null;
      if (panelEl && panelEl.contains(target as Node)) return;
      if (btnEl && btnEl.contains(target as Node)) return;
      setFiltersOpen(false);
      btnEl?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!filtersOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setFiltersOpen(false);
        btnEl?.focus();
      }
    };
    document.addEventListener("mousedown", onDocClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen, btnEl, panelEl]);

  const paged = filtered; // already paged by API

  const onToggleRow = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) next.add(id); else next.delete(id);
    setSelected(next);
  };
  const onToggleAll = (checked: boolean) => {
    if (!checked) return setSelected(new Set());
    setSelected(new Set(paged.map((r) => r.id)));
  };

  const onDeleteSelected = async () => {
    const ids = Array.from(selected);
    for (const id of ids) await removeProduct(id);
    toast.success(`Deleted ${ids.length} product${ids.length !== 1 ? "s" : ""}`);
    const resp = await listProducts({
      q: productSearch || undefined,
      status: productStatus === "all" ? undefined : (productStatus as any),
      mode: productMode === "all" ? undefined : (productMode as any),
      min_discount: productMode === "deal" ? productMinDiscount : undefined,
      page: productPage,
      page_size: productPageSize,
    });
    setRows(resp.items);
    setTotal(resp.total);
    setSelected(new Set());
    setConfirmOpen(false);
  };

  return (
    <div>
      <Breadcrumbs />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl">Products</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <>
              <button onClick={async () => {
                const ids = Array.from(selected);
                for (const id of ids) await submitProductForReview(id);
                toast.success(`Submitted ${ids.length} for review`);
                const resp = await listProducts({
                  q: productSearch || undefined,
                  status: productStatus === "all" ? undefined : (productStatus as any),
                  mode: productMode === "all" ? undefined : (productMode as any),
                  min_discount: productMode === "deal" ? productMinDiscount : undefined,
                  page: productPage,
                  page_size: productPageSize,
                });
                setRows(resp.items); setTotal(resp.total);
                setSelected(new Set());
              }} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">Submit for review</button>
              <button onClick={() => setConfirmOpen(true)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">Delete selected</button>
            </>
          )}
          <button onClick={async () => {
            try {
              const res = await getSellerStatus();
              if (res.status === "disabled") { toast.error("Your seller account is disabled."); return; }
              if (res.status === "pending") {
                toast.info("Account pending. You can create drafts but some actions may be limited.");
              }
            } catch (e: any) {
              toast.error("Could not verify seller status. Opening draft form.");
            }
            setEditProduct(null); setOpenForm(true);
          }} className="rounded-md border border-neutral-900 bg-neutral-900 text-white px-3 py-2 text-sm">Add Product</button>
        </div>
      </div>

      {sellerStatus === "pending" && (
        <div role="alert" className="card p-3 mb-3 border border-neutral-300 bg-neutral-50 text-sm">
          Your seller status is pending. You can draft products but cannot submit edits until verification is complete.
        </div>
      )}

      <div className="mb-3">
        <div role="tablist" aria-label="Product status" className="inline-flex rounded-lg border border-neutral-300 overflow-hidden">
          {["all", "active", "draft"].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={productStatus === t}
              onClick={() => productSetFilters({ productStatus: t as any, productPage: 1 })}
              className={cn("px-3 py-1.5 text-sm border-r last:border-r-0 border-neutral-300", productStatus === t && "bg-neutral-100")}
            >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="card p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className="sr-only">Search</label>
          <input id="search" value={productSearch} onChange={(e) => productSetFilters({ productSearch: e.target.value, productPage: 1 })} placeholder="Search by name or SKU" className="w-full rounded-md border border-neutral-300 px-3 py-2" />
        </div>
        <div className="relative">
          <button
            ref={setBtnEl}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-3 py-2"
          >
            <Filter size={14} />
            {activeFiltersCount > 0 ? `Filters (${activeFiltersCount})` : "Filters"}
          </button>
          {filtersOpen && (
            <div
              role="dialog"
              aria-label="Filters"
              ref={setPanelEl}
              className="absolute right-0 z-50 mt-2 w-64 rounded-md border border-neutral-200 bg-white p-3 shadow-card pointer-events-auto"
              onKeyDown={(e) => { if (e.key === "Escape") { setFiltersOpen(false); btnEl?.focus(); } }}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="flt-category">Category</label>
                  <select id="flt-category" value={productCategory} onChange={(e) => productSetFilters({ productCategory: e.target.value, productPage: 1 })} className="w-full rounded-md border border-neutral-300 px-3 py-2">
                    {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="flt-mode">Mode</label>
                  <select id="flt-mode" value={productMode} onChange={(e) => productSetFilters({ productMode: e.target.value as any, productPage: 1 })} className="w-full rounded-md border border-neutral-300 px-3 py-2">
                    {(["all", "discover", "deal"] as const).map((m) => (
                      <option key={m} value={m}>{String(m).charAt(0).toUpperCase() + String(m).slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="flt-minDiscount">Min discount</label>
                  <input
                    id="flt-minDiscount"
                    type="number"
                    step={1}
                    min={0}
                    max={90}
                    value={productMinDiscount ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const v = raw === "" ? undefined : Math.max(0, Math.min(90, parseInt(raw, 10)));
                      productSetFilters({ productMinDiscount: v, productPage: 1 });
                    }}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2"
                    placeholder="Min %"
                    aria-describedby="flt-minDiscount-desc"
                    aria-label="Minimum discount percent"
                  />
                  <span id="flt-minDiscount-desc" className="sr-only">Enter minimum discount percentage from 0 to 90</span>
                </div>
                <div className="flex justify-end gap-2">
                  <button className="rounded-md border border-neutral-300 px-3 py-1 text-sm" onClick={() => { setFiltersOpen(false); btnEl?.focus(); }}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="sr-only" htmlFor="pageSize">Page size</label>
          <select id="pageSize" value={productPageSize} onChange={(e) => productSetFilters({ productPageSize: Number(e.target.value), productPage: 1 })} className="rounded-md border border-neutral-300 px-3 py-2">
            {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-4">
          <div className="h-5 w-40 bg-neutral-100 rounded mb-3" />
          <div className="h-5 w-full bg-neutral-100 rounded mb-2" />
          <div className="h-5 w-3/4 bg-neutral-100 rounded" />
        </div>
      ) : (
        <DataTable
          enableSelection
          selectedIds={selected}
          onToggleRow={onToggleRow}
          onToggleAll={onToggleAll}
          columns={[
            { key: "title", header: "Product", render: (p: ProductSummary) => {
              const img = p.thumbnail_url;
              return (
                <div className="flex items-center gap-2">
                  {img ? (
                    <button
                      type="button"
                      className="h-10 w-10 overflow-hidden rounded border border-neutral-200"
                      aria-label="Open image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxImages(img ? [img] : []);
                        setLightboxIndex(0);
                        setLightboxOpen(true);
                        setLightboxReturnEl(e.currentTarget);
                      }}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ) : (
                    <div className="h-10 w-10 rounded border border-neutral-200 bg-neutral-100" aria-hidden />
                  )}
                  <span className="truncate max-w-[12rem] sm:max-w-[20rem]">{p.title}</span>
                  {p.low_stock && (
                    <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium">LOW</span>
                  )}
                  {(p.mode ?? "discover") === "deal" && (
                    <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium">DEAL</span>
                  )}
                </div>
              );
            } },
            { key: "sku", header: "SKU", render: () => "-" },
            { key: "category", header: "Category" },
            { key: "inventory", header: "Inventory", render: () => "-", align: "right" },
            { key: "price", header: "Price", render: (p: ProductSummary) => formatTHB(p.price_minor), align: "right" },
            { key: "mode", header: "Mode", render: (p: ProductSummary) => {
              const label = p.mode ?? "discover";
              return label.charAt(0).toUpperCase() + label.slice(1);
            } },
            { key: "discount", header: "Discount", render: (p: ProductSummary) => (p.deal_active && typeof p.deal_percent === "number" ? `-${p.deal_percent}%` : "-"), align: "right" },
            { key: "status", header: "Status", render: (p: ProductSummary) => <StatusBadge status={p.active ? "active" : (p.review_status === "pending_review" ? "pending_review" : "draft")} /> },
          ]}
          rows={paged}
          page={productPage}
          pageSize={productPageSize}
          total={total}
          onPageChange={(p) => productSetFilters({ productPage: Math.max(1, p) })}
          onRowClick={async (p) => {
            try {
              const res = await getSellerStatus();
              if (res.status === "disabled") { toast.error("Account disabled."); return; }
              if (res.status === "pending") { toast.info("Account pending. Editing is allowed but some actions may be limited."); }
            } catch {
              toast.error("Could not verify seller status. Attempting to open editor.");
            }
            try {
              const full = await getProduct(p.id);
              // Map DTO -> legacy UI Product type expected by ProductForm
              const mapped: Product = {
                id: full.id,
                title: full.title,
                description: full.description || "",
                category: full.category,
                brand: (full as any).brand,
                price: (full.price_minor || 0) / 100,
                compareAtPrice: undefined,
                sku: "",
                inventory: 0,
                variants: full.variants.map((v) => ({ size: v.size, color: v.color, stock: v.stock })),
                images: full.images.sort((a,b)=>a.position-b.position).map((m)=>m.url),
                visibility: "public",
                status: full.active ? "active" : "draft",
                mode: full.deal_active ? "deal" : "discover",
                discountPercent: full.deal_percent,
              } as Product;
              setEditProduct(mapped);
              setOpenForm(true);
            } catch (e) {
              toast.error("Failed to open product");
            }
          }}
        />
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-sm text-neutral-600 mt-3">No products found.</div>
      )}

      <ProductForm open={openForm} onOpenChange={setOpenForm} initial={editProduct} onSaved={async () => {
        const resp = await listProducts({
          q: productSearch || undefined,
          status: productStatus === "all" ? undefined : (productStatus as any),
          mode: productMode === "all" ? undefined : (productMode as any),
          min_discount: productMode === "deal" ? productMinDiscount : undefined,
          page: productPage,
          page_size: productPageSize,
        });
        setRows(resp.items);
        setTotal(resp.total);
      }} />

      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete selected" description="This will remove the selected products." onConfirm={onDeleteSelected} />

      <Dialog.Root open={lightboxOpen} onOpenChange={(o) => { setLightboxOpen(o); if (!o) { lightboxReturnEl?.focus(); } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" onClick={() => { setLightboxOpen(false); }} />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 w-[96vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-2 shadow-card focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % Math.max(1, lightboxImages.length));
              if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + Math.max(1, lightboxImages.length)) % Math.max(1, lightboxImages.length));
            }}
            onTouchStart={(e) => { touchStartX.current = e.touches[0]?.clientX ?? null; touchDeltaX.current = 0; }}
            onTouchMove={(e) => { if (touchStartX.current != null) { touchDeltaX.current = (e.touches[0]?.clientX ?? 0) - touchStartX.current; } }}
            onTouchEnd={() => {
              const threshold = 40;
              if (touchDeltaX.current > threshold) {
                // swipe right -> prev
                setLightboxIndex((i) => (i - 1 + lightboxImages.length) % Math.max(1, lightboxImages.length));
              } else if (touchDeltaX.current < -threshold) {
                // swipe left -> next
                setLightboxIndex((i) => (i + 1) % Math.max(1, lightboxImages.length));
              }
              touchStartX.current = null; touchDeltaX.current = 0;
            }}
          >
            <div className="relative">
              <img src={lightboxImages[lightboxIndex]} alt="Product image" className="max-h-[70vh] w-full object-contain rounded" />
              {lightboxImages.length > 0 && (
                <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded bg-white/80 px-2 py-0.5 text-xs border border-neutral-300">
                  {lightboxIndex + 1} / {lightboxImages.length}
                </div>
              )}
              {lightboxImages.length > 1 && (
                <>
                  <button aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white/90 p-2" onClick={() => setLightboxIndex((i) => (i - 1 + lightboxImages.length) % lightboxImages.length)}>
                    <ChevronLeft size={18} />
                  </button>
                  <button aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white/90 p-2" onClick={() => setLightboxIndex((i) => (i + 1) % lightboxImages.length)}>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <Dialog.Close asChild>
                <button aria-label="Close" className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white/90 p-2">
                  <CloseIcon size={16} />
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
