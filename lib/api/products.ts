import { products as legacy } from "@/data/products";
import { apiFetch } from "@/lib/api/client";
import { toMinor } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
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

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const publicImage = (p: string | undefined | null) => (p ? `${SUPA}/storage/v1/object/public/product-images/${p}` : undefined);
const publicVideo = (p: string | undefined | null) => (p ? `${SUPA}/storage/v1/object/public/product-videos/${p}` : undefined);

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
    created_at: p.created_at,
    category: p.category,
    price_minor: p.price_minor,
    currency: p.currency,
    mode: p.deal_active ? "deal" : "discover",
    review_status: pendingReview.has(p.id) ? "pending_review" : undefined,
  };
}

export async function listProducts(params: ListProductsParams = {}): Promise<ListProductsResponse> {
  const { page = 1, page_size = 20 } = params;
  

  const ensurePage = async (targetPage: number, limit: number) => {
    let cursor: string | null = null;
    let items: any[] = [];
    for (let i = 1; i <= targetPage; i++) {
      const qs = new URLSearchParams();
      qs.set("limit", String(limit));
      if (cursor) qs.set("cursor", cursor);
      const res = await apiFetch(`/v1/seller/products?${qs.toString()}`);
      const rows = (res.items || []) as Array<any>;
      cursor = (res.nextCursor as string | null) ?? null;
      if (i === targetPage) items = rows;
      if (!cursor) break;
    }
    return { items, nextCursor: null as string | null };
  };

  const { items: rows, nextCursor } = await ensurePage(page, page_size);
  let mapped: ProductSummary[] = await Promise.all((rows || []).map(async (r: any) => {
    let thumb: string | undefined;
    let video: string | undefined;
    let firstIsVideo = false;
    let hasVideo = false;
    try {
      const full = await getProduct(r.id);
      const imgs = Array.isArray(full.images) ? full.images : [];
      const vids = Array.isArray((full as any).videos) ? (full as any).videos : [];
      hasVideo = vids.length > 0;
      const combined = [
        ...imgs.map((m: any) => ({ kind: 'image' as const, pos: m.position, img: m.url as string, vid: undefined as string | undefined })),
        ...vids.map((v: any) => ({ kind: 'video' as const, pos: v.position, img: (v.thumbnail as string | undefined), vid: v.url as string })),
      ].sort((a, b) => ((a.pos ?? 0) - (b.pos ?? 0)));
      const first = combined[0];
      thumb = first?.img;
      if (first?.kind === 'video') { firstIsVideo = true; video = first.vid; }
    } catch {
      // Fallback: prefer image; if only video is present, show video
      const imgs = Array.isArray(r.images) ? r.images : [];
      const vids = Array.isArray(r.videos) ? r.videos : [];
      hasVideo = vids.length > 0;
      if (imgs.length > 0) {
        thumb = publicImage(imgs[0].url);
      } else if (vids.length > 0) {
        firstIsVideo = true;
        video = publicVideo(vids[0].url);
        thumb = vids[0].thumbnail ? publicImage(vids[0].thumbnail) : undefined;
      }
    }
    const base: any = {
      id: r.id,
      title: r.title,
      thumbnail_url: thumb,
      video_url: video,
      first_is_video: firstIsVideo,
      active: !!r.active,
      deal_active: !!r.deal_active,
      deal_percent: r.deal_percent ?? undefined,
      created_at: r.created_at,
      category: r.category ?? undefined,
      price_minor: r.price_minor ?? 0,
      currency: (r.currency as any) || "THB",
      mode: r.deal_active ? "deal" : "discover",
      coupon_code: r.coupon_code ?? undefined,
      is_swipe_hour: !!r.is_swipe_hour,
    };
    (base as any).has_video = hasVideo;
    const ms = (r as any).moderation_status as string | undefined;
    if (ms === 'rejected') {
      (base as any).review_status = 'rejected';
      if (typeof (r as any).rejected_reason === 'string') (base as any).rejected_reason = (r as any).rejected_reason;
    } else if (!r.active && ms && ms !== 'approved') {
      (base as any).review_status = 'pending_review';
    }
    return base as ProductSummary;
  }));
  const { q, status, mode, min_discount } = params;
  if (q) {
    const qq = q.toLowerCase();
    mapped = mapped.filter((p) => p.title.toLowerCase().includes(qq));
  }
  if (status === "active") mapped = mapped.filter((p) => p.active);
  if (status === "pending_review") mapped = mapped.filter((p: any) => (!p.active) && ((p as any).review_status === "pending_review"));
  if (status === "rejected") mapped = mapped.filter((p: any) => ((p as any).review_status === "rejected"));
  if (status === "draft") mapped = mapped.filter((p: any) => (!p.active) && ((p as any).review_status !== "pending_review") && ((p as any).review_status !== "rejected"));
  if (mode === "deal") mapped = mapped.filter((p) => p.mode === "deal");
  if (mode === "discover") mapped = mapped.filter((p) => p.mode === "discover");
  if (typeof min_discount === "number") mapped = mapped.filter((p) => (p.deal_percent ?? 0) >= min_discount);
  const total = page * page_size + (!nextCursor ? mapped.length : page_size);
  return { items: mapped, page, page_size, total };
}

export async function getProduct(id: string): Promise<Product> {
  const dto = await apiFetch(`/v1/products/${id}`);
  // Backend already returns public URLs for images/videos in dto
  const images = (dto.images || []).map((m: any) => ({ id: m.id, url: m.url, position: m.position, alt: m.alt_text }));
  const dtoVideos: any[] = Array.isArray(dto.videos) ? dto.videos : [];
  const videos = dtoVideos.map((v: any) => ({ id: v.id, url: v.url, position: v.position, alt: undefined, type: 'video' as const, thumbnailUrl: v.thumbnail || undefined }));
  const variants = (dto.variants || []).map((v: any) => ({ id: v.id, size: v.size || undefined, color: v.color || undefined, sku: v.sku || undefined, price_override_minor: v.price_minor ?? undefined, active: !!v.active, title: v.title || undefined }));
  const out: Product = {
    id: dto.id,
    title: dto.title,
    description: dto.description || undefined,
    price_minor: dto.pricing?.original_price_minor ?? dto.price_minor ?? 0,
    currency: dto.pricing?.currency ?? dto.currency ?? "THB",
    category: dto.category,
    brand: dto.brand ?? undefined,
    sku: undefined,
    weight: undefined,
    active: !!dto.active,
    deal_active: !!dto.pricing?.is_deal || !!dto.deal_active,
    deal_percent: dto.pricing?.discount_percent ?? dto.deal_percent ?? undefined,
    deal_price_minor: dto.pricing?.display_price_minor ?? dto.deal_price_minor ?? undefined,
    images,
    videos,
    variants,
    created_at: dto.created_at,
  };
  // Provide raw media back to ProductForm for initial tiles/order
  (out as any)._fullMedia = {
    images: (dto.images || []).map((m: any) => ({ url: m.url, position: m.position, alt_text: m.alt_text })),
    videos: dtoVideos.map((v: any) => ({ url: v.url, thumbnail: v.thumbnail || null, position: v.position }))
  };
  // Attach discovery extras for edit form
  (out as any).external_url = dto.external_url ?? "";
  (out as any).coupon_code = dto.coupon_code ?? "";
  (out as any).is_swipe_hour = !!dto.is_swipe_hour;
  return out;
}

// Reusable helper: upload images/videos for a product and attach via backend
async function uploadProductMedia(pid: string, images: Media[] = [], videos: Media[] = []) {
  const uploadWithFallback = async (
    bucket: 'product-images' | 'product-videos',
    signed: { path: string; token: string; uploadUrl: string },
    blob: Blob,
    type: string
  ) => {
    try {
      const up = await supabase.storage.from(bucket).uploadToSignedUrl(signed.path, signed.token, blob, { contentType: type, upsert: true });
      if ((up as any)?.error) throw new Error((up as any).error.message || 'Upload failed');
    } catch (e) {
      const resp = await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': type, 'x-upsert': 'true' }, body: blob });
      if (!resp.ok) {
        let t = ''; try { t = await resp.text(); } catch {}
        throw new Error(t || `Upload failed (${resp.status})`);
      }
    }
  };
  const toBlob = async (url: string, f?: File | Blob): Promise<{ blob: Blob, type: string, ext: string }> => {
    const extFromType = (type: string): string => {
      const t = (type || '').toLowerCase();
      if (t.includes('png')) return 'png';
      if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
      if (t.includes('gif')) return 'gif';
      if (t.includes('webp')) return 'webp';
      if (t.includes('webm')) return 'webm';
      if (t.includes('mp4')) return 'mp4';
      if (t.includes('quicktime')) return 'mov';
      if (t.startsWith('video/')) { const sub = t.split('/')[1] || ''; return sub ? sub.replace(/[^a-z0-9]/g,'') : 'mp4'; }
      return 'bin';
    };
    if (f instanceof Blob) { const type = f.type || 'application/octet-stream'; return { blob: f, type, ext: extFromType(type) }; }
    if (url.startsWith('data:')) {
      const m = /^data:([^;]+);base64,(.*)$/.exec(url); const type = m?.[1] || 'application/octet-stream'; const b64 = m?.[2] || '';
      const bin = typeof atob !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary'); const arr = new Uint8Array(bin.length);
      for (let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
      return { blob: new Blob([arr], { type }), type, ext: extFromType(type) };
    }
    const resp = await fetch(url); const blob = await resp.blob(); const type = blob.type || 'application/octet-stream';
    return { blob, type, ext: extFromType(type) };
  };

  for (const m of images) {
    const { blob, type, ext } = await toBlob(m.url, (m as any).file as any);
    const signed = await apiFetch(`/v1/media/image-signed-url`, { method: 'POST', json: { fileName: `upload.${ext}`, contentType: type, productId: pid } });
    await uploadWithFallback('product-images', signed, blob, type);
    await apiFetch(`/v1/products/${pid}/images`, { method: 'POST', json: { path: signed.path, alt_text: m.alt, position: (m as any).position } });
  }

  for (const v of videos) {
    const { blob, type, ext } = await toBlob(v.url, (v as any).file as any);
    const signed = await apiFetch(`/v1/media/video-signed-url`, { method: 'POST', json: { fileName: `upload.${ext}`, contentType: type, productId: pid } });
    await uploadWithFallback('product-videos', signed, blob, type);
    let thumbPath: string | undefined;
    const thumbUrl = (v as any).thumbnailUrl as string | undefined;
    if (thumbUrl && thumbUrl.startsWith('data:')) {
      try {
        const t = await toBlob(thumbUrl);
        const thumbSigned = await apiFetch(`/v1/media/image-signed-url`, { method: 'POST', json: { fileName: `thumb.${t.ext}`, contentType: t.type, productId: pid } });
        await uploadWithFallback('product-images', thumbSigned, t.blob, t.type);
        thumbPath = thumbSigned.path as string;
      } catch {}
    }
    await apiFetch(`/v1/products/${pid}/videos`, { method: 'POST', json: { path: signed.path, thumbnail: thumbPath ?? thumbUrl, position: (v as any).position } });
  }
}

export async function createProduct(input: ProductCreate): Promise<Product> {
  const base = await apiFetch(`/v1/products`, { method: "POST", json: {
    title: input.title,
    description: input.description,
    price_minor: input.price_minor,
    currency: input.currency,
    category: input.category,
    brand: input.brand,
    // discovery extras
    external_url: (input as any).external_url,
    coupon_code: (input as any).coupon_code,
    is_swipe_hour: !!(input as any).is_swipe_hour,
    active: true
  }});
  const pid = base.id as string;
  // For deal products, activate deal immediately to avoid appearing in Discover during media upload
  if ((input as any).deal_active) {
    try {
      await apiFetch(`/v1/products/${pid}/deal`, { method: "PATCH", json: { deal_active: true, deal_percent: (input as any).deal_percent } });
    } catch {}
  }
  const variantsArr = Array.isArray(input.variants) ? input.variants : [];
  const hasProvidedVariants = variantsArr.length > 0;
  const toCreate = hasProvidedVariants ? variantsArr : [{
    sku: undefined,
    title: 'Default',
    price_override_minor: undefined,
    size: undefined,
    color: undefined,
    active: true,
  }];
  for (const v of toCreate) {
    await apiFetch(`/v1/products/${pid}/variants`, { method: "POST", json: {
      sku: v.sku,
      title: v.title,
      price_minor: v.price_override_minor ?? input.price_minor,
      size: v.size,
      color: v.color,
      active: v.active ?? true,
    }});
  }
  await uploadProductMedia(pid, input.images || [], (input.videos || []).map(v => ({ ...v, type: 'video' as const })));
  return { id: pid } as unknown as Product;
}

export async function updateProduct(id: string, input: ProductUpdate): Promise<Product> {
  const core: any = {};
  if (typeof input.title === "string") core.title = input.title;
  if (typeof input.description === "string") core.description = input.description;
  if (typeof input.price_minor === "number") core.price_minor = input.price_minor;
  if (typeof input.currency === "string") core.currency = input.currency;
  if (typeof input.category === "string") core.category = input.category;
  if (typeof input.brand === "string") core.brand = input.brand;
  if (typeof (input as any).external_url === "string") core.external_url = (input as any).external_url;
  if ((input as any).coupon_code !== undefined) core.coupon_code = (input as any).coupon_code;
  if (typeof (input as any).is_swipe_hour === "boolean") core.is_swipe_hour = !!(input as any).is_swipe_hour;
  if (Object.keys(core).length) await apiFetch(`/v1/products/${id}`, { method: "PATCH", json: core });
  // Also upload/attach any newly provided media on edit
  try {
    const imgs: Media[] = Array.isArray((input as any).images) ? (input as any).images : [];
    const vids: Media[] = Array.isArray((input as any).videos) ? (input as any).videos : [];
    if (imgs.length || vids.length) {
      await uploadProductMedia(id, imgs, vids.map(v => ({ ...v, type: 'video' as const })));
    }
  } catch {}
  if (typeof input.deal_active === "boolean" || typeof input.deal_percent === "number" || typeof input.deal_price_minor === "number") {
    await apiFetch(`/v1/products/${id}/deal`, { method: "PATCH", json: {
      deal_active: !!input.deal_active,
      deal_percent: input.deal_percent,
      deal_price_minor: input.deal_price_minor,
    }});
  }
  const full = await getProduct(id);
  return full;
}

export async function submitProductForReview(id: string): Promise<{ id: string; status: "pending_review" }> {
  // Placeholder: activate product as a stand-in for review workflow
  try { await apiFetch(`/v1/products/${id}`, { method: "PATCH", json: { active: true } }); } catch {}
  return { id, status: "pending_review" };
}

export async function adminApproveProduct(id: string): Promise<{ id: string; active: true }> {
  await delay();
  const p = store.find((x) => x.id === id);
  if (!p) throw new Error("Not found");
  const hasImages = (p.images?.length || 0) > 0;
  const hasActiveVariant = p.variants.some((v) => v.active);
  if (!hasImages || !hasActiveVariant) {
    throw new Error("Cannot approve: require at least 1 image and 1 active variant");
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
  await apiFetch(`/v1/products/${id}`, { method: "DELETE" });
}
