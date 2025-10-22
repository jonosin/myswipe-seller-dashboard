import { products as legacy } from "@/data/products";
import { toMinor, toMajor } from "@/lib/utils";
import type {
  ListProductsParams,
  ListProductsResponse,
  Media,
  Product,
  ProductCreate,
  ProductSummary,
  ProductUpdate,
  Variant,
} from "@/types/product";

// In-memory mock store in DTO shape
let store: Product[] = legacy.map((p, idx): Product => {
  const price_minor = toMinor(p.price);
  const deal_active = (p.mode ?? "discover") === "deal";
  const images: Media[] = (p.images || []).map((url, i) => ({ id: `${p.id}-img-${i+1}`, url, position: i, type: i === 0 ? "thumbnail" : "image" }));
  const variants: Variant[] = (p.variants || []).map((v, i) => ({
    id: `${p.id}-var-${i+1}`,
    size: v.size,
    color: v.color,
    sku: v.sku,
    stock: v.stock,
    active: true,
  }));
  const created_at = new Date(Date.now() - idx * 86400000).toISOString();
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price_minor,
    currency: "THB",
    category: p.category,
    sku: p.sku,
    inventory: p.inventory,
    weight: p.weight ? { value: p.weight.value, unit: p.weight.unit } : undefined,
    active: (p.status === "active"),
    deal_active,
    deal_percent: p.discountPercent,
    images,
    variants,
    created_at,
  };
});

const delay = (ms=300) => new Promise((res)=>setTimeout(res, ms));

// In-memory review state (mock)
const pendingReview = new Set<string>();

function summarize(p: Product): ProductSummary {
  return {
    id: p.id,
    title: p.title,
    thumbnail_url: p.images.find((m) => m.position === 0)?.url,
    active: p.active,
    deal_active: p.deal_active,
    deal_percent: p.deal_percent,
    low_stock: p.variants.some((v) => v.active && v.stock < 3),
    created_at: p.created_at,
    category: p.category,
    price_minor: p.price_minor,
    currency: p.currency,
    mode: p.deal_active ? "deal" : "discover",
    review_status: pendingReview.has(p.id) ? "pending_review" : undefined,
    inventory: typeof p.inventory === "number" ? p.inventory : p.variants.reduce((sum, v) => sum + (v.stock || 0), 0),
  };
}

export async function listProducts(params: ListProductsParams = {}): Promise<ListProductsResponse> {
  await delay();
  let items = store.slice();
  const { q, status, mode, min_discount, page = 1, page_size = 20 } = params;
  if (q) {
    const qq = q.toLowerCase();
    items = items.filter((p) => p.title.toLowerCase().includes(qq));
  }
  if (status) {
    if (status === "active") items = items.filter((p) => p.active === true);
    if (status === "draft") items = items.filter((p) => p.active === false);
    if (status === "pending_review") {
      // mock: none pending by default – skip
      items = items.filter(() => false);
    }
  }
  if (mode) {
    if (mode === "deal") items = items.filter((p) => p.deal_active);
    if (mode === "discover") items = items.filter((p) => !p.deal_active);
  }
  if (typeof min_discount === "number") {
    items = items.filter((p) => (p.deal_percent ?? 0) >= min_discount);
  }
  const total = items.length;
  const start = (page - 1) * page_size;
  const pageItems = items.slice(start, start + page_size).map(summarize);
  return { items: pageItems, page, page_size, total };
}

export async function getProduct(id: string): Promise<Product> {
  await delay();
  const p = store.find((x) => x.id === id);
  if (!p) throw new Error("Not found");
  return JSON.parse(JSON.stringify(p));
}

export async function createProduct(input: ProductCreate): Promise<Product> {
  await delay();
  const p: Product = {
    ...input,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    active: input.active ?? false,
  };
  store = [p, ...store];
  return p;
}

export async function updateProduct(id: string, input: ProductUpdate): Promise<Product> {
  await delay();
  store = store.map((p) => (p.id === id ? { ...p, ...input } as Product : p));
  const out = store.find((p) => p.id === id)!;
  return JSON.parse(JSON.stringify(out));
}

export async function submitProductForReview(id: string): Promise<{ id: string; status: "pending_review" }> {
  await delay();
  pendingReview.add(id);
  return { id, status: "pending_review" };
}

export async function adminApproveProduct(id: string): Promise<{ id: string; active: true }> {
  await delay();
  const p = store.find((x) => x.id === id);
  if (!p) throw new Error("Not found");
  const hasImages = (p.images?.length || 0) > 0;
  const hasSellableVariant = p.variants.some((v) => v.active && (v.stock || 0) > 0);
  if (!hasImages || !hasSellableVariant) {
    throw new Error("Cannot approve: require at least 1 image and 1 active variant with stock > 0");
  }
  store = store.map((pp) => (pp.id === id ? { ...pp, active: true } : pp));
  pendingReview.delete(id);
  return { id, active: true };
}

export async function adminRejectProduct(id: string, reason: string): Promise<{ id: string; active: false; reject_reason: string }> {
  await delay();
  store = store.map((p) => (p.id === id ? { ...p, active: false } : p));
  pendingReview.delete(id);
  return { id, active: false, reject_reason: reason };
}

export async function attachMedia(productId: string, media: Array<Pick<Media, "url" | "alt" | "type">>): Promise<Product> {
  await delay();
  store = store.map((p) => {
    if (p.id !== productId) return p;
    const base = p.images.length;
    const added: Media[] = media.map((m, i) => ({ id: crypto.randomUUID(), url: m.url, alt: m.alt, type: m.type, position: base + i }));
    return { ...p, images: [...p.images, ...added] };
  });
  return store.find((p) => p.id === productId)!;
}

export async function reorderMedia(productId: string, positions: { id: string; position: number }[]): Promise<Product> {
  await delay();
  store = store.map((p) => {
    if (p.id !== productId) return p;
    const map = new Map(positions.map((x) => [x.id, x.position]));
    const arr = p.images.map((m) => ({ ...m, position: map.get(m.id) ?? m.position }));
    arr.sort((a, b) => a.position - b.position);
    return { ...p, images: arr };
  });
  return store.find((p) => p.id === productId)!;
}

export async function removeMedia(productId: string, mediaId: string): Promise<Product> {
  await delay();
  store = store.map((p) => {
    if (p.id !== productId) return p;
    const arr = p.images.filter((m) => m.id !== mediaId).map((m, i) => ({ ...m, position: i }));
    return { ...p, images: arr };
  });
  return store.find((p) => p.id === productId)!;
}

// Convenience not in spec but used by current UI for bulk delete
export async function removeProduct(id: string): Promise<void> {
  await delay();
  store = store.filter((p) => p.id !== id);
}
