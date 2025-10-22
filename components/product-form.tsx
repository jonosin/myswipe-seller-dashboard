"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Provider as TooltipProvider,
  Root as TooltipRoot,
  Trigger as TooltipTrigger,
  Portal as TooltipPortal,
  Content as TooltipContent,
  Arrow as TooltipArrow,
} from "@radix-ui/react-tooltip";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "@/lib/types";
import { createProduct as apiCreateProduct, updateProduct as apiUpdateProduct, submitProductForReview as apiSubmitForReview } from "@/lib/api/products";
import type { ProductCreate, ProductUpdate, Media as DtoMedia, Variant as DtoVariant } from "@/types/product";
import { toMinor } from "@/lib/utils";
import { toast } from "@/components/toast";
import { formatCurrency } from "@/lib/utils";
import { GripVertical, Info, Trash2, CornerDownLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";

// Using named Radix component imports for JSX tags

const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  optionValues: z.record(z.string()).optional(),
  price: z.coerce.number().min(0).optional(),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  costPerItem: z.coerce.number().min(0).optional(),
  sku: z.string().optional(),
  available: z.boolean().optional(),
});

const schema = z.object({
  title: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  brand: z.string().optional(),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).nullable().optional(),
  costPerItem: z.coerce.number().min(0).optional(),
  sku: z.string().min(1, "Required"),
  inventory: z.coerce.number().int().min(0),
  variants: z.array(variantSchema).default([]),
  images: z.array(z.string().min(1)).default([]),
  imagesMeta: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        alt: z.string().optional(),
        sortOrder: z.number(),
      })
    )
    .default([]),
  visibility: z.enum(["public", "private"]).default("public"),
  status: z.enum(["active", "draft"]).default("active"),
  mode: z.enum(["discover", "deal"]).default("discover"),
  discountPercent: z.number().optional(),
  weight: z
    .object({ value: z.number().optional(), unit: z.enum(["g", "kg"]).default("g") })
    .optional(),
  options: z.array(z.object({ name: z.string(), values: z.array(z.string()) })).default([]),
  customCategory: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.mode === "deal") {
    const d = data.discountPercent;
    if (typeof d !== "number" || Number.isNaN(d)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["discountPercent"] });
      return;
    }
    if (d < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Min 1%", path: ["discountPercent"] });
    if (d > 90) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Max 90%", path: ["discountPercent"] });
  }
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Product | null;
  onSaved?: (p: Product) => void;
};

export default function ProductForm({ open, onOpenChange, initial, onSaved }: Props) {
  const isEdit = !!initial;
  const createDefaults: FormValues = {
    title: "",
    description: "",
    category: "",
    brand: "",
    price: 0,
    compareAtPrice: null,
    costPerItem: undefined,
    sku: "",
    inventory: 0,
    variants: [],
    images: [],
    imagesMeta: [],
    visibility: "public",
    status: "active",
    mode: "discover",
    discountPercent: undefined,
    weight: undefined,
    options: [],
    customCategory: "",
  };

  // Videos (mock DataURL)
  const onPickVideos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });
    (async () => {
      const next: Array<{ id: string; url: string; thumb?: string }> = [];
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        if (!f) continue;
        if (!f.type.startsWith("video/")) continue;
        if (videoList.length + next.length >= 3) break;
        let dataUrl: string | undefined = undefined;
        try { dataUrl = await toDataUrl(f); } catch {}
        if (dataUrl) next.push({ id: crypto.randomUUID(), url: dataUrl });
      }
      if (next.length) setVideoList((prev) => [...prev, ...next]);
    })();
  };

  const onPickThumb = (files: FileList | null) => {
    if (!files || files.length === 0 || !thumbTarget) return;
    const file = files.item(0);
    if (!file || !file.type.startsWith("image/")) return;
    const fr = new FileReader();
    fr.onload = () => {
      const data = String(fr.result);
      setVideoList((prev) => prev.map((v) => v.id === thumbTarget ? { ...v, thumb: data } : v));
      setThumbTarget(null);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
    };
    fr.readAsDataURL(file);
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setFocus,
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    shouldUnregister: false,
    defaultValues: initial
      ? {
          title: initial.title,
          description: initial.description,
          category: initial.category,
          brand: (initial as any).brand ?? "",
          price: initial.price,
          compareAtPrice: initial.compareAtPrice ?? null,
          sku: initial.sku,
          inventory: initial.inventory,
          variants: initial.variants ?? [],
          images: initial.images ?? [],
          visibility: initial.visibility,
          status: initial.status,
          mode: initial.mode ?? "discover",
          discountPercent: initial.mode === "deal" ? (initial.discountPercent ?? 20) : undefined,
        }
      : createDefaults,
  });

  // Images managed as local meta list for previews & sort; sync to form on change
  const [imageList, setImageList] = useState<Array<{ id: string; url: string; dataUrl?: string; alt?: string; sortOrder: number }>>(() => {
    if (initial?.images && initial.images.length) {
      return initial.images.map((u, i) => ({ id: crypto.randomUUID(), url: u, sortOrder: i }));
    }
    return [];
  });
  useEffect(() => {
    setValue("imagesMeta", imageList, { shouldDirty: true });
    // Persist data URLs when present; fall back to current preview URL
    setValue("images", imageList.map((i) => i.dataUrl || i.url), { shouldDirty: true });
  }, [imageList, setValue]);

  const price = watch("price");
  const cost = watch("costPerItem");
  const compareAt = watch("compareAtPrice");
  const mode = watch("mode");
  const discount = watch("discountPercent");
  const openedRef = useRef(false);
  const prevModeRef = useRef<"discover" | "deal">("discover");
  const category = watch("category");
  const customCategory = watch("customCategory");
  const weightValue = watch("weight.value");
  const weightUnit = watch("weight.unit");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbTarget, setThumbTarget] = useState<string | null>(null);
  const [openCycle, setOpenCycle] = useState(0);
  const [videoList, setVideoList] = useState<Array<{ id: string; url: string; thumb?: string }>>([]);
  const [pendingReview, setPendingReview] = useState(false);
  const imagesSectionRef = useRef<HTMLDivElement>(null);
  const [imagesError, setImagesError] = useState(false);

  // Category options (moved earlier so combobox matching has access)
  const categoryOptions = useMemo(
    () => [
      "Tops (T-Shirts, Shirts, Blouses, Sweaters, Hoodies)",
      "Outerwear (Jackets, Coats, Blazers)",
      "Dresses & Jumpsuits",
      "Bottoms (Pants, Jeans, Shorts, Skirts, Leggings)",
      "Activewear",
      "Swimwear",
      "Underwear & Lingerie",
      "Sleepwear",
      "Headwear (Beanies, Caps)",
      "Accessories (Scarves, Belts, Gloves, Ties)",
      "Footwear",
      "Sets",
      "Wearables",
      "Other (Custom)",
    ],
    []
  );
  const categorySelectOptions = useMemo(() => {
    const opts = [...categoryOptions];
    if (category && !opts.includes(category)) {
      opts.unshift(category);
    }
    return opts;
  }, [category, categoryOptions]);

  // Category combobox state
  const [catOpen, setCatOpen] = useState(false);
  const [catActive, setCatActive] = useState<number>(-1);
  const catInputRef = useRef<HTMLInputElement>(null);
  const catListRef = useRef<HTMLDivElement>(null);
  const catBtnRef = useRef<HTMLButtonElement>(null);

  const catMatches = useMemo(() => {
    const q = (category || "").toLowerCase();
    return categorySelectOptions.filter((c) => c.toLowerCase().includes(q));
  }, [category, categorySelectOptions]);

  const revokeBlobUrls = (list: Array<{ url: string }>) => {
    list.forEach((im) => {
      if (im.url && im.url.startsWith("blob:")) {
        try { URL.revokeObjectURL(im.url); } catch {}
      }
    });
  };

  useEffect(() => {
    if (open && !openedRef.current && !isEdit) {
      reset(createDefaults);
    }
    if (mode === "deal") {
      if (typeof discount !== "number" || Number.isNaN(discount)) {
        setValue("discountPercent", 20 as any, { shouldDirty: true });
      }
      if (prevModeRef.current !== "deal") {
        setFocus("discountPercent");
      }
    }
    prevModeRef.current = mode;
    openedRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, mode]);

  // Close category list on outside click or ESC
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!catOpen) return;
      const t = e.target as Node | null;
      if (catListRef.current?.contains(t as Node)) return;
      if (catInputRef.current?.contains(t as Node)) return;
      if (catBtnRef.current?.contains(t as Node)) return;
      setCatOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatOpen(false);
    };
    document.addEventListener("mousedown", onDocClick, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

  // Ensure Images state/input reset on open (create) and object URLs revoked on close
  const prevOpenRef = useRef<boolean>(false);
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    if (open && !wasOpen) {
      if (isEdit && initial) {
        const editDefaults: FormValues = {
          title: initial.title,
          description: initial.description,
          category: initial.category ?? "",
          brand: (initial as any).brand ?? "",
          price: initial.price,
          compareAtPrice: initial.compareAtPrice ?? null,
          costPerItem: initial.costPerItem,
          sku: initial.sku,
          inventory: initial.inventory,
          variants: initial.variants ?? [],
          images: initial.images ?? [],
          imagesMeta: initial.images?.map((u, i) => ({ id: crypto.randomUUID(), url: u, sortOrder: i })),
          visibility: initial.visibility,
          status: initial.status,
          mode: initial.mode ?? "discover",
          discountPercent: initial.mode === "deal" ? (initial.discountPercent ?? 20) : undefined,
          weight: initial.weight,
          options: initial.options ?? [],
          customCategory: "",
        };
        reset(editDefaults);
        if (initial.images) {
          setImageList(initial.images.map((u, i) => ({ id: crypto.randomUUID(), url: u, sortOrder: i })));
        }
      } else {
        // Create mode: clear everything
        reset(createDefaults);
        if (imageList.length) revokeBlobUrls(imageList);
        setImageList([]);
        setOptions([{ id: crypto.randomUUID(), name: "", values: [] }]);
        setVariantMap({});
        setVideoList([]);
        setPendingReview(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      setOpenCycle((n) => n + 1);
    } else if (!open && wasOpen) {
      if (imageList.length) revokeBlobUrls(imageList);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, initial]);

  // Clear image error when user adds images
  useEffect(() => {
    if (imageList.length > 0) setImagesError(false);
  }, [imageList]);

  // Removed mock upload; images are user-provided only

  const onRemoveImage = (idx: number) => {
    setImageList((prev) => {
      const target = prev[idx];
      if (target?.url?.startsWith("blob:")) {
        try { URL.revokeObjectURL(target.url); } catch {}
      }
      return prev.filter((_, i) => i !== idx).map((im, i) => ({ ...im, sortOrder: i }));
    });
  };

  const onPickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });
    (async () => {
      const next: Array<{ id: string; url: string; dataUrl?: string; alt?: string; sortOrder: number }> = [];
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i);
        if (!f || !f.type.startsWith("image/")) continue;
        const objectUrl = URL.createObjectURL(f);
        let dataUrl: string | undefined = undefined;
        try { dataUrl = await toDataUrl(f); } catch {}
        next.push({ id: crypto.randomUUID(), url: objectUrl, dataUrl, sortOrder: imageList.length + next.length });
      }
      if (next.length) setImageList((prev) => [...prev, ...next]);
    })();
  };

  // Images DnD (handle-based)
  const imageDragIndex = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const onImageDragStart = (index: number) => (e: React.DragEvent<HTMLElement>) => {
    imageDragIndex.current = index;
    setDraggingIdx(index);
    e.dataTransfer.effectAllowed = "move";
    const handle = e.currentTarget as HTMLElement;
    const tile = handle.closest('[data-image-tile="1"]') as HTMLElement | null;
    if (tile && e.dataTransfer.setDragImage) {
      try { e.dataTransfer.setDragImage(tile, tile.clientWidth / 2, tile.clientHeight / 2); } catch {}
    }
  };
  const onImageDragEnd = () => {
    imageDragIndex.current = null;
    setDraggingIdx(null);
  };
  const onImageDragOver = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onImageDrop = (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const from = imageDragIndex.current;
    imageDragIndex.current = null;
    setDraggingIdx(null);
    if (from == null || from === index) return;
    setImageList((prev) => {
      const arr = prev.slice();
      const [moved] = arr.splice(from, 1);
      if (!moved) return prev;
      arr.splice(index, 0, moved);
      return arr.map((im, i) => ({ ...im, sortOrder: i }));
    });
  };

  const onSubmit = async (values: FormValues) => {
    // Require at least one image on create
    if (!isEdit && imageList.length === 0) {
      setImagesError(true);
      imagesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const categoryValue = values.category === "Other (Custom)" && values.customCategory?.trim() ? values.customCategory.trim() : values.category;
    // Build variants from matrix
    const variantsPayload = variantKeys.map((key): DtoVariant => {
      const ov = JSON.parse(key) as Record<string, string>;
      const vm = variantMap[key] ?? {};
      const baseMinor = toMinor(values.price);
      const overrideMinor = typeof vm.price === "number" ? toMinor(vm.price) : undefined;
      return {
        id: crypto.randomUUID(),
        size: ov["Size"] as string | undefined,
        color: ov["Color"] as string | undefined,
        sku: vm.sku,
        price_override_minor: overrideMinor,
        stock: vm.inventory ?? 0,
        active: vm.available ?? true,
        title: [ov["Size"], ov["Color"]].filter(Boolean).join(" / ") || undefined,
      };
    });
    const priceMinor = toMinor(values.price);
    const dealPercent = values.mode === "deal" ? values.discountPercent : undefined;
    const dealPriceMinor = typeof dealPercent === "number" ? Math.max(0, Math.round(priceMinor * (1 - dealPercent / 100))) : undefined;
    const mediaPayload: DtoMedia[] = imageList.map((im, i) => ({
      id: im.id,
      url: im.dataUrl || im.url,
      alt: im.alt,
      position: i,
      type: i === 0 ? "thumbnail" : "image",
    }));
    const videosPayload: DtoMedia[] = videoList.map((v, i) => ({
      id: v.id,
      url: v.url,
      position: i,
      type: "video",
      thumbnailUrl: v.thumb,
    }));

    const payload: ProductCreate = {
      title: values.title,
      description: values.description || undefined,
      price_minor: priceMinor,
      currency: "THB",
      category: categoryValue,
      brand: (values.brand || "").trim() || undefined,
      sku: (values.sku || "").trim() || undefined,
      inventory: typeof values.inventory === "number" ? values.inventory : undefined,
      weight: values.weight ? { value: values.weight.value, unit: values.weight.unit ?? "g" } : undefined,
      active: false,
      deal_active: values.mode === "deal",
      deal_percent: dealPercent,
      deal_price_minor: dealPriceMinor,
      images: mediaPayload,
      variants: variantsPayload,
      videos: videosPayload,
      created_at: new Date().toISOString(), // ignored by API create
    } as unknown as ProductCreate; // cast to allow created_at omission by API

    if (isEdit && initial) {
      const patch: ProductUpdate = {
        title: payload.title,
        description: payload.description,
        price_minor: payload.price_minor,
        currency: "THB",
        category: payload.category,
        brand: payload.brand,
        sku: payload.sku,
        inventory: payload.inventory,
        weight: payload.weight,
        deal_active: payload.deal_active,
        deal_percent: payload.deal_percent,
        deal_price_minor: payload.deal_price_minor,
        images: payload.images,
        variants: payload.variants,
        videos: payload.videos,
      };
      await apiUpdateProduct(initial.id, patch);
      toast.success("Product updated");
      onSaved?.(initial as any);
      onOpenChange(false);
    } else {
      await apiCreateProduct(payload);
      toast.success("Product added");
      onSaved?.(initial as any);
      reset(createDefaults);
      revokeBlobUrls(imageList);
      setImageList([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onOpenChange(false);
    }
  };

  // Category options for the select (removed duplicate block below)

  // Options and Variants (flexible)
  type OptionSet = { id: string; name: string; values: string[] };
  const [options, setOptions] = useState<OptionSet[]>([]);
  useEffect(() => {
    if (initial?.variants?.length && initial?.variants?.some((v) => v.size || v.color)) {
      // Map legacy size/color into options
      const sizeValues = Array.from(new Set(initial.variants.map((v) => v.size).filter(Boolean) as string[]));
      const colorValues = Array.from(new Set(initial.variants.map((v) => v.color).filter(Boolean) as string[]));
      const next: OptionSet[] = [];
      if (sizeValues.length) next.push({ id: crypto.randomUUID(), name: "Size", values: sizeValues });
      if (colorValues.length) next.push({ id: crypto.randomUUID(), name: "Color", values: colorValues });
      setOptions(next);
    }
  }, [initial]);

  const addOption = () => {
    const id = crypto.randomUUID();
    setOptions((prev) => [...prev, { id, name: "", values: [] }]);
    setTimeout(() => {
      const el = document.getElementById(`opt-name-${id}`) as HTMLInputElement | null;
      el?.focus();
    }, 0);
  };
  const removeOption = (id: string) => setOptions((prev) => prev.filter((o) => o.id !== id));
  const setOptionName = (id: string, name: string) => setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, name } : o)));
  const addOptionValue = (id: string, value: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, values: [...o.values, value] } : o)));
  };
  const removeOptionValue = (id: string, idx: number) => setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, values: o.values.filter((_, i) => i !== idx) } : o)));
  const moveOptionValue = (id: string, from: number, to: number) => setOptions((prev) => prev.map((o) => {
    if (o.id !== id || from === to || from < 0 || to < 0 || from >= o.values.length || to >= o.values.length) return o;
    const arr = o.values.slice();
    const removed = arr.splice(from, 1);
    const m = removed[0];
    if (typeof m === "undefined") return o;
    arr.splice(to, 0, m);
    return { ...o, values: arr };
  }));

  const suggestionOptions = ["Size", "Color", "Material", "Style"];

  // Build variant combinations (cartesian)
  type VariantKey = string; // JSON string of optionValues
  const variantKeys: VariantKey[] = useMemo(() => {
    if (options.length === 0 || options.some((o) => !o.name || o.values.length === 0)) return [];
    const lists = options.map((o) => o.values.map((v) => ({ [o.name]: v })));
    const cartesian = lists.reduce((acc, curr) => acc.flatMap((a) => curr.map((b) => ({ ...a, ...b }))), [{} as Record<string, string>]);
    return cartesian.map((ov) => JSON.stringify(ov));
  }, [options]);

  const [variantMap, setVariantMap] = useState<Record<VariantKey, { price?: number; compareAtPrice?: number | null; costPerItem?: number; sku?: string; inventory?: number; available?: boolean }>>({});
  // Preserve per-variant edits when option sets change
  useEffect(() => {
    setVariantMap((prev) => {
      const next: typeof prev = {};
      variantKeys.forEach((k) => { next[k] = prev[k] ?? {}; });
      return next;
    });
  }, [variantKeys]);

  // Prefill variant rows from base pricing when missing
  useEffect(() => {
    setVariantMap((prev) => {
      const next = { ...prev };
      variantKeys.forEach((k) => {
        const vm = next[k] ?? {};
        if (vm.price === undefined && typeof price === "number") vm.price = price;
        if (vm.compareAtPrice === undefined && typeof compareAt === "number") vm.compareAtPrice = compareAt;
        if (vm.costPerItem === undefined && typeof cost === "number") vm.costPerItem = cost;
        next[k] = vm;
      });
      return next;
    });
  }, [variantKeys, price, compareAt, cost]);

  const profit = useMemo(() => {
    const p = Number(price as any) || 0;
    const c = Number(cost as any) || 0;
    const val = Math.max(0, p - c);
    return val;
  }, [price, cost]);
  const margin = useMemo(() => {
    const p = Number(price as any) || 0;
    if (p <= 0) return 0;
    return (profit / p) * 100;
  }, [profit, price]);

  // Enable submit only when minimal required fields are valid
  const titleVal = watch("title");
  const titleOk = typeof titleVal === "string" && titleVal.trim().length > 0;
  const priceOk = typeof price === "number" && !Number.isNaN(price) && price > 0;
  const variantsOk = variantKeys.length > 0;
  const dealOk = mode !== "deal" || (typeof discount === "number" && discount >= 1 && discount <= 90);
  const canSubmit = titleOk && priceOk && variantsOk && dealOk;

  const anyLow = useMemo(() => {
    return variantKeys.some((key) => {
      const vm = variantMap[key] ?? {};
      const inv = vm.inventory ?? 0;
      const avail = vm.available ?? true;
      return avail && inv < 3;
    });
  }, [variantKeys, variantMap]);

  // Deal price derived from discountPercent and price, and two-way mapping without schema change
  const [dealPriceInput, setDealPriceInput] = useState<string>("");
  useEffect(() => {
    if (mode !== "deal") { setDealPriceInput(""); return; }
    const p = Number(price as any);
    const d = Number(discount as any);
    if (Number.isFinite(p) && p > 0 && Number.isFinite(d)) {
      const newPrice = p * (1 - d / 100);
      if (Number.isFinite(newPrice)) setDealPriceInput(newPrice.toFixed(2)); else setDealPriceInput("");
    } else {
      setDealPriceInput("");
    }
  }, [price, discount, mode]);

  // Invalid state helpers and summary banner
  const [errorSummary, setErrorSummary] = useState<Array<{ id: string; label: string; msg: string }>>([]);
  const invalid = {
    title: !!errors.title,
    description: !!errors.description,
    category: !!errors.category,
    price: !!errors.price,
    sku: !!errors.sku,
    inventory: !!errors.inventory,
    discountPercent: !!errors.discountPercent,
  };

  const onInvalid = () => {
    const items: Array<{ id: string; label: string; msg: string }> = [];
    if (errors.title) items.push({ id: "title", label: "Name", msg: errors.title.message as string || "Required" });
    if (errors.description) items.push({ id: "description", label: "Description", msg: errors.description.message as string || "Required" });
    if (errors.category) items.push({ id: "category", label: "Category", msg: errors.category.message as string || "Required" });
    if (errors.price) items.push({ id: "price", label: "Price", msg: errors.price.message as string || "Required" });
    if (errors.sku) items.push({ id: "sku", label: "SKU", msg: errors.sku.message as string || "Required" });
    if (errors.inventory) items.push({ id: "inventory", label: "Inventory", msg: errors.inventory.message as string || "Required" });
    if (mode === "deal" && errors.discountPercent) items.push({ id: "discountPercent", label: "Discount %", msg: errors.discountPercent.message as string || "Required" });
    if (items.length > 0) {
      setErrorSummary(items);
      const first = items[0]!;
      const el = document.getElementById(first.id) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus(), 250);
      }
    } else {
      setErrorSummary([]);
    }
  };

  // Drag state for option values
  const [dragState, setDragState] = useState<{ optId: string; fromIdx: number } | null>(null);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/20" onClick={() => onOpenChange(false)} />
      <div className="fixed left-1/2 top-1/2 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-card focus:outline-none">
        <TooltipProvider>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{isEdit ? "Edit Product" : "Add Product"}</h2>
            {isEdit && (
              <div className="flex items-center gap-2">
                <StatusBadge status={pendingReview ? "pending_review" : (initial?.status || "draft")} />
              </div>
            )}
          </div>
          {errorSummary.length > 0 && (
            <div role="alert" className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm">
              <div className="font-medium mb-1">Please fix the following:</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {errorSummary.map((e) => (
                  <li key={e.id}>
                    <button type="button" className="underline" onClick={() => {
                      const el = document.getElementById(e.id) as HTMLElement | null;
                      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); }
                    }}>{e.label}</button> — {e.msg}
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-right">
                <button type="button" className="rounded-md border border-neutral-300 px-2 py-1 text-xs" onClick={() => setErrorSummary([])}>Dismiss</button>
              </div>

              <div className="mt-4 border-t border-neutral-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Videos <span className="text-neutral-500 text-xs">(optional, up to 3)</span></span>
                  <div className="flex items-center gap-2">
                    <input
                      id="videoInput"
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => onPickVideos(e.target.files)}
                    />
                    <input
                      id="thumbInput"
                      ref={thumbInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickThumb(e.target.files)}
                    />
                    <button type="button" disabled={videoList.length >= 3} onClick={() => videoInputRef.current?.click()} className="rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50">Upload video</button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {videoList.map((v, idx) => (
                    <div key={v.id} className="relative border border-neutral-200 rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <video src={v.url} className="h-24 rounded border border-neutral-200" controls />
                        {v.thumb ? (
                          <img src={v.thumb} alt="Thumbnail" className="h-24 w-24 object-cover rounded border border-neutral-200" />
                        ) : (
                          <div className="h-24 w-24 rounded border border-dashed border-neutral-300 flex items-center justify-center text-xs text-neutral-500">No thumbnail</div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button type="button" className="rounded-md border border-neutral-300 px-2 py-1 text-sm" onClick={() => { setThumbTarget(v.id); thumbInputRef.current?.click(); }}>Set thumbnail</button>
                        <button type="button" className="rounded-md border border-neutral-300 px-2 py-1 text-sm" onClick={() => setVideoList((prev) => prev.filter((_, i) => i !== idx))}>Remove</button>
                      </div>
                    </div>
                  ))}
                  {videoList.length === 0 && (
                    <div className="text-sm text-neutral-600">No videos added</div>
                  )}
                </div>
              </div>
            </div>
          )}
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const t = e.target as HTMLElement | null;
                const allow = !!(t && t instanceof HTMLInputElement && t.dataset && t.dataset.variantValue === "true");
                if (!allow) e.preventDefault();
              }
            }}
            className="mt-4 grid grid-cols-1 gap-4 pb-20"
            aria-label="Product form"
          >
            {/* Core info: Name + Brand row, Category below full width, then Description */}
            <div className="card rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="title">Name</label>
                  <input id="title" {...register("title")} className={`w-full rounded-lg border ${invalid.title ? "border-red-500" : "border-neutral-300"} px-3 py-2`} aria-invalid={!!errors.title} />
                </div>
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="brand">Brand</label>
                  <input id="brand" {...register("brand")} className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm text-neutral-700 mb-1" htmlFor="category">Category</label>
                <div className="relative" role="combobox" aria-expanded={catOpen} aria-owns="category-list" aria-haspopup="listbox">
                  <input
                    id="category"
                    ref={catInputRef}
                    value={category || ""}
                    onChange={(e) => { const v = e.target.value; setValue("category", v, { shouldDirty: true }); setCatOpen(true); setCatActive(-1); }}
                    placeholder="Choose a product category"
                    className={`w-full rounded-lg border ${invalid.category ? "border-red-500" : "border-neutral-300"} px-3 py-2 pr-8`}
                    aria-invalid={!!errors.category}
                    aria-autocomplete="list"
                    autoComplete="off"
                    aria-controls="category-list"
                    aria-activedescendant={catActive >= 0 ? `cat-opt-${catActive}` : undefined}
                    onFocus={() => setCatOpen(true)}
                    onKeyDown={(e) => {
                      if (!catOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) { setCatOpen(true); return; }
                      if (e.key === "ArrowDown") { e.preventDefault(); setCatActive((i) => Math.min(catMatches.length - 1, i + 1)); }
                      if (e.key === "ArrowUp") { e.preventDefault(); setCatActive((i) => Math.max(0, i - 1)); }
                      if (e.key === "Enter" && catActive >= 0 && catActive < catMatches.length) {
                        e.preventDefault();
                        const val = catMatches[catActive]!;
                        setValue("category", val, { shouldDirty: true });
                        setCatOpen(false);
                      }
                    }}
                  />
                  <button
                    ref={catBtnRef}
                    type="button"
                    aria-label="Toggle categories"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500"
                    onClick={() => setCatOpen((v) => !v)}
                  >
                    ▾
                  </button>
                  {catOpen && catMatches.length > 0 && (
                    <div ref={catListRef} role="listbox" className="absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-card max-h-48 overflow-auto" id="category-list">
                      {catMatches.map((c, idx) => (
                        <button
                          role="option"
                          id={`cat-opt-${idx}`}
                          aria-selected={idx === catActive}
                          type="button"
                          key={c}
                          className={`block w-full text-left px-3 py-2 hover:bg-neutral-50 ${idx === catActive ? "bg-neutral-50" : ""}`}
                          onMouseEnter={() => setCatActive(idx)}
                          onClick={() => { setValue("category", c, { shouldDirty: true }); setCatOpen(false); catInputRef.current?.focus(); }}
                        >{c}</button>
                      ))}
                    </div>
                  )}
                </div>
                {category === "Other (Custom)" && (
                  <input placeholder="Custom category" {...register("customCategory")} className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2" />
                )}
              </div>
              <div className="sm:col-span-2 mt-4">
                <label className="block text-sm text-neutral-700 mb-1" htmlFor="description">Description</label>
                <textarea id="description" {...register("description")} className={`w-full rounded-lg border ${invalid.description ? "border-red-500" : "border-neutral-300"} px-3 py-2`} aria-invalid={!!errors.description} />
              </div>
            </div>

            {/* Pricing */}
            <div className={`card rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ${invalid.price ? "border-red-300" : ""}`}>
              <div className="text-sm font-medium mb-2">Pricing</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="price">Price</label>
                  <input id="price" type="number" step="0.01" {...register("price")} className={`w-full rounded-lg border ${invalid.price ? "border-red-500" : "border-neutral-300"} px-3 py-2`} aria-invalid={!!errors.price} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <label className="block text-sm text-neutral-700" htmlFor="compareAtPrice">Compare at</label>
                    <TooltipRoot>
                      <TooltipTrigger asChild>
                        <button type="button" aria-label="Compare at help" className="inline-flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none">
                          <Info size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipPortal>
                        <TooltipContent sideOffset={6} className="max-w-xs rounded-md border border-neutral-300 bg-white p-2 text-xs shadow-card">
                          Compare at price is the original or reference price shown as a strike-through to indicate savings. It should be greater than the current Price.
                          <TooltipArrow className="fill-white" />
                        </TooltipContent>
                      </TooltipPortal>
                    </TooltipRoot>
                  </div>
                  <input id="compareAtPrice" type="number" step="0.01" {...register("compareAtPrice")} className="w-full rounded-lg border border-neutral-300 px-3 py-2" aria-invalid={!!errors.compareAtPrice} />
                  {typeof compareAt === "number" && compareAt < (Number(price as any) || 0) && (
                    <p className="text-xs text-neutral-600 mt-1">Tip: Compare at should be greater than Price to indicate savings.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="costPerItem">Cost per item</label>
                  <input id="costPerItem" type="number" step="0.01" {...register("costPerItem")} className="w-full rounded-lg border border-neutral-300 px-3 py-2" aria-invalid={!!errors.costPerItem} />
                </div>
              </div>
              <div className="mt-2 text-sm text-neutral-700 flex gap-6">
                <div>Profit: <span className="font-medium">{formatCurrency(profit)}</span></div>
                <div>Profit margin: <span className="font-medium">{Number.isFinite(margin) ? `${margin.toFixed(0)}%` : "—"}</span></div>
              </div>
            </div>

            {/* Listing mode (segmented) directly below Pricing */}
            <div className="card rounded-xl border border-neutral-200 bg-white p-4 shadow-sm -mt-2">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-neutral-700 mb-1">Listing mode</div>
                  <div role="group" aria-label="Listing mode" className="flex w-full rounded-md border border-neutral-300 overflow-hidden">
                    <button type="button" aria-pressed={mode === "discover"} className={`flex-1 px-3 py-1.5 text-sm ${mode === "discover" ? "bg-black text-white" : "bg-white text-neutral-700"}`} onClick={() => setValue("mode", "discover", { shouldDirty: true })}>Discover Feed</button>
                    <button type="button" aria-pressed={mode === "deal"} className={`flex-1 px-3 py-1.5 text-sm border-l border-neutral-300 ${mode === "deal" ? "bg-black text-white" : "bg-white text-neutral-700"}`} onClick={() => setValue("mode", "deal", { shouldDirty: true })}>Deal Session</button>
                  </div>
                </div>
                {mode === "deal" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-neutral-700 mb-1" htmlFor="discountPercent">Discount %</label>
                      <input
                        id="discountPercent"
                        type="number"
                        min={1}
                        max={90}
                        {...register("discountPercent", { valueAsNumber: true })}
                        aria-invalid={mode === "deal" && (!dealOk)}
                        className={`w-full rounded-lg border px-3 py-2 ${mode === "deal" && (!dealOk) ? "border-red-500" : "border-neutral-300"}`}
                      />
                      {mode === "deal" && typeof discount === "number" && discount > 90 && (
                        <p className="text-xs text-red-600 mt-1">Max 90%</p>
                      )}
                      {mode === "deal" && typeof discount === "number" && discount < 1 && (
                        <p className="text-xs text-red-600 mt-1">Min 1%</p>
                      )}
                      {mode === "deal" && typeof discount === "number" && discount >= 1 && discount < 20 && (
                        <p className="text-xs text-neutral-600 mt-1">Tip: Deals under 20% may underperform.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-700 mb-1" htmlFor="dealPrice">Deal price</label>
                      <input
                        id="dealPrice"
                        type="number"
                        step="0.01"
                        value={dealPriceInput}
                        onChange={(e) => {
                          const txt = e.target.value;
                          setDealPriceInput(txt);
                          const p = Number(price as any);
                          const dp = Number(txt);
                          if (Number.isFinite(p) && p > 0 && Number.isFinite(dp)) {
                            const raw = (1 - dp / p) * 100;
                            const clamped = Math.max(1, Math.min(90, Math.round(raw)));
                            setValue("discountPercent", clamped as any, { shouldDirty: true });
                          }
                        }}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <div className="text-sm text-neutral-600">After discount</div>
                      <div className="font-medium">
                        {typeof discount === "number" && Number.isFinite(Number(price as any)) && !Number.isNaN(Number(price as any) * (1 - discount / 100)) ? formatCurrency(Number(price as any) * (1 - discount / 100)) : "—"}
                      </div>
                      <div className="text-xs text-neutral-600">
                        {(() => {
                          const p = Number(price as any);
                          const c = Number(cost as any) || 0;
                          const d = typeof discount === "number" ? discount : NaN;
                          const newPrice = Number.isFinite(p) && Number.isFinite(d) ? p * (1 - d / 100) : NaN;
                          if (!Number.isFinite(newPrice)) return "";
                          const prof = Math.max(0, newPrice - c);
                          const marg = newPrice > 0 ? (prof / newPrice) * 100 : NaN;
                          return `Profit ${formatCurrency(prof)} — Margin ${Number.isFinite(marg) ? marg.toFixed(0) + "%" : "—"}`;
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory & Identifiers */}
            <div className="card rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="sku">SKU</label>
                  <input id="sku" {...register("sku")} className={`w-full rounded-lg border ${invalid.sku ? "border-red-500" : "border-neutral-300"} px-3 py-2`} aria-invalid={!!errors.sku} />
                </div>
                <div>
                  <label className="block text-sm text-neutral-700 mb-1" htmlFor="inventory">Inventory</label>
                  <input id="inventory" type="number" {...register("inventory")} className={`w-full rounded-lg border ${invalid.inventory ? "border-red-500" : "border-neutral-300"} px-3 py-2`} aria-invalid={!!errors.inventory} />
                </div>
              </div>
            </div>

            {/* Physicals */}
            <div className="card rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <label className="block text-sm text-neutral-700 mb-1" htmlFor="weightValue">Weight per item</label>
              <div className="flex gap-2">
                <input
                  id="weightValue"
                  type="text"
                  inputMode="decimal"
                  value={weightValue ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setValue("weight.value", undefined as any, { shouldDirty: true });
                    } else {
                      const num = Number(raw);
                      if (!Number.isNaN(num)) setValue("weight.value", num as any, { shouldDirty: true });
                    }
                  }}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                />
                <select value={weightUnit ?? "g"} onChange={(e) => setValue("weight.unit", e.target.value as any, { shouldDirty: true })} className="rounded-lg border border-neutral-300 px-3 py-2">
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            {/* Variants */}
            <div className="card rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Variants</span>
                <button type="button" disabled={options.length >= 3} className="rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:opacity-50" onClick={addOption}>Add another option</button>
              </div>
              {options.length === 0 && <div className="text-sm text-neutral-600">No options added</div>}
              <div className="mt-2 space-y-3">
                {options.map((opt) => (
                  <div key={opt.id} className="rounded-lg border border-neutral-200 p-3">
                    <div className="text-sm text-neutral-700 mb-1">Option name</div>
                    <input id={`opt-name-${opt.id}`} list={`opt-suggest-${opt.id}`} value={opt.name} onChange={(e) => setOptionName(opt.id, e.target.value)} placeholder="Size" className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
                    <datalist id={`opt-suggest-${opt.id}`}>
                      {suggestionOptions.map((s) => <option key={s} value={s} />)}
                    </datalist>
                    <div className="mt-3 text-sm text-neutral-700 mb-1">Option values</div>
                    <div className="space-y-2">
                      {opt.values.map((v, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[auto,1fr,auto] items-center gap-2"
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp") { e.preventDefault(); moveOptionValue(opt.id, i, i - 1); }
                            if (e.key === "ArrowDown") { e.preventDefault(); moveOptionValue(opt.id, i, i + 1); }
                          }}
                          onDragOver={(e) => { if (dragState && dragState.optId === opt.id) e.preventDefault(); }}
                          onDrop={(e) => {
                            if (!dragState || dragState.optId !== opt.id) return;
                            e.preventDefault();
                            moveOptionValue(opt.id, dragState.fromIdx, i);
                            const newIndex = i;
                            requestAnimationFrame(() => {
                              const el = document.getElementById(`opt-val-${opt.id}-${newIndex}`) as HTMLInputElement | null;
                              el?.focus();
                            });
                            setDragState(null);
                          }}
                          tabIndex={0}
                        >
                          <span
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-neutral-300 cursor-grab active:cursor-grabbing"
                            draggable
                            aria-grabbed={dragState?.optId === opt.id}
                            onDragStart={(e) => { setDragState({ optId: opt.id, fromIdx: i }); try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", ""); } catch {} }}
                            onDragEnd={() => setDragState(null)}
                          >
                            <GripVertical size={14} />
                          </span>
                          <input
                            id={`opt-val-${opt.id}-${i}`}
                            value={v}
                            onChange={(e) => setOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, values: o.values.map((vv, ii) => (ii === i ? e.target.value : vv)) } : o)))}
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
                          />
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300"
                            aria-label="Delete value"
                            title="Delete"
                            onClick={() => removeOptionValue(opt.id, i)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded border border-neutral-300"><GripVertical size={14} /></span>
                        <div className="relative w-full">
                        <input
                          placeholder="Add another value"
                          data-variant-value="true"
                          className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-16"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const target = e.currentTarget as HTMLInputElement; // avoid React event pooling
                              const val = (target.value || "").trim();
                              if (val) {
                                addOptionValue(opt.id, val);
                                target.value = "";
                                const focusId = `opt-val-${opt.id}-${opt.values.length}`; // new index at end
                                requestAnimationFrame(() => {
                                  const el = document.getElementById(focusId) as HTMLInputElement | null;
                                  el?.focus();
                                });
                              }
                            }
                          }}
                        />
                        <span aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 text-xs inline-flex items-center gap-1">
                          Enter <CornerDownLeft size={14} />
                        </span>
                      </div>
                        <span aria-hidden className="inline-flex h-8 w-8 rounded-md border border-transparent" />
                      </div>
                      <div>
                        <button type="button" className="rounded-md border border-neutral-300 px-2 py-1 text-sm text-red-600" onClick={() => removeOption(opt.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {variantKeys.length > 0 && (
              <div className="card rounded-xl border border-neutral-200 bg-white p-4 shadow-sm grid grid-cols-1 gap-2">
                <div className="text-sm font-medium flex items-center gap-2">Variants {anyLow && <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px]">LOW</span>}</div>
                <div className="overflow-x-auto border border-neutral-200 rounded-md">
                  <table className="table min-w-[700px]">
                    <thead>
                      <tr>
                        <th>Variant</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Compare</th>
                        <th className="text-right">Cost</th>
                        <th>SKU</th>
                        <th className="text-right">Inventory</th>
                        <th className="text-right">Reserved</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantKeys.map((key) => {
                        const ov = JSON.parse(key) as Record<string, string>;
                        const vm = variantMap[key] ?? {};
                        const variantLabel = options.map((o) => ov[o.name]).filter(Boolean).join(" / ");
                        return (
                          <tr key={key}>
                            <td>
                              <div className="flex items-center gap-2">
                                <span>{variantLabel}</span>
                                {(vm.available ?? true) && (vm.inventory ?? 0) < 3 && (
                                  <span className="inline-flex items-center rounded-full border px-1 py-0.5 text-[10px]">LOW</span>
                                )}
                              </div>
                            </td>
                            <td className="text-right">
                              <input type="number" step="0.01" className="w-24 rounded border border-neutral-300 px-2 py-1 text-right" value={vm.price ?? ""} onChange={(e) => setVariantMap((prev) => ({ ...prev, [key]: { ...prev[key], price: e.target.value === "" ? undefined : Number(e.target.value) } }))} />
                            </td>
                            <td className="text-right">
                              <input type="number" step="0.01" className="w-24 rounded border border-neutral-300 px-2 py-1 text-right" value={vm.compareAtPrice ?? ""} onChange={(e) => setVariantMap((prev) => ({ ...prev, [key]: { ...prev[key], compareAtPrice: e.target.value === "" ? undefined : Number(e.target.value) } }))} />
                            </td>
                            <td className="text-right">
                              <input type="number" step="0.01" className="w-24 rounded border border-neutral-300 px-2 py-1 text-right" value={vm.costPerItem ?? ""} onChange={(e) => setVariantMap((prev) => ({ ...prev, [key]: { ...prev[key], costPerItem: e.target.value === "" ? undefined : Number(e.target.value) } }))} />
                            </td>
                            <td>
                              <input type="text" className="w-28 rounded border border-neutral-300 px-2 py-1" value={vm.sku ?? ""} onChange={(e) => setVariantMap((prev) => ({ ...prev, [key]: { ...prev[key], sku: e.target.value } }))} />
                            </td>
                            <td className="text-right">
                              <input type="number" className="w-20 rounded border border-neutral-300 px-2 py-1 text-right" value={vm.inventory ?? 0} onChange={(e) => setVariantMap((prev) => ({ ...prev, [key]: { ...prev[key], inventory: Number(e.target.value) } }))} />
                            </td>
                            <td className="text-right">
                              <span className="inline-block w-20 text-right">0</span>
                            </td>
                            <td>
                              <input type="checkbox" checked={vm.available ?? true} onChange={(e) => setVariantMap((prev) => ({ ...prev, [key]: { ...prev[key], available: e.target.checked } }))} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Media */}
            <div ref={imagesSectionRef} id="imagesSection" className={`card rounded-xl border ${imagesError ? "border-red-300" : "border-neutral-200"} bg-white p-4 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Product Image</span>
                <div className="flex items-center gap-2">
                  <input
                    key={openCycle}
                    id="fileInput"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onPickFiles(e.target.files)}
                  />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md border border-neutral-300 px-2 py-1 text-sm">Upload</button>
                </div>
              </div>
              <div
                className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2"
                onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) onPickFiles(e.dataTransfer.files); }}
              >
                {imageList.map((im, idx) => (
                  <div key={im.id} data-image-tile="1" className={`relative group border border-neutral-200 rounded-md overflow-hidden ${draggingIdx === idx ? "ring-2 ring-black/20" : ""}`} onDragOver={onImageDragOver(idx)} onDrop={onImageDrop(idx)}>
                    <div className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-white/90 border border-neutral-300 px-1 text-[11px]">
                      <span className="inline-flex items-center cursor-grab active:cursor-grabbing" draggable aria-label="Reorder image" aria-grabbed={draggingIdx === idx} onDragStart={onImageDragStart(idx)} onDragEnd={onImageDragEnd}>
                        <GripVertical size={12} />
                      </span>
                      {idx === 0 && <span>Primary</span>}
                    </div>
                    <img src={im.dataUrl || im.url} alt={im.alt || "Product"} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => onRemoveImage(idx)} className="absolute right-1 top-1 rounded bg-white/90 border border-neutral-300 px-1 text-xs">Remove</button>
                  </div>
                ))}
                {imageList.length === 0 && (
                  <div className="text-sm text-neutral-600">No images uploaded</div>
                )}
              </div>
            </div>

            {/* Deal Session card removed; handled by segmented control above */}

            {/* Actions (sticky) */}
            <div className="sticky bottom-0 bg-neutral-50">
              <div className="border-t border-neutral-200 pt-2 flex justify-end gap-2">
                {isEdit && (
                  <button type="button" onClick={async () => {
                    if (!initial) return;
                    await apiSubmitForReview(initial.id);
                    setPendingReview(true);
                    toast.success("Submitted for review");
                  }} className="rounded-md border border-neutral-300 px-3 py-2 text-sm">Submit for review</button>
                )}
                <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-neutral-300 px-3 py-2">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-black text-white px-3 py-2 disabled:opacity-50">
                  {isEdit ? (isSubmitting ? "Saving..." : "Save changes") : (isSubmitting ? "Adding..." : "Add Product")}
                </button>
              </div>
            </div>
          </form>
        </TooltipProvider>
      </div>
    </div>
  );
}
