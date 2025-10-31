export type Currency = "THB";

export type MediaType = "image" | "video" | "thumbnail";

export type Media = {
  id: string;
  url: string; // data URL or public path in mock
  position: number; // first = primary
  alt?: string;
  type: MediaType;
  thumbnailUrl?: string; // for videos, optional custom thumbnail
  file?: File; // optional: when present, use this Blob for upload (client-only)
};

export type Variant = {
  id: string;
  size?: string;
  color?: string;
  sku?: string;
  price_override_minor?: number; // optional
  active: boolean;
  title?: string; // may be derived from size/color if omitted
};

export type Product = {
  id: string;
  title: string;
  description?: string;
  price_minor: number; // derived from UI major input
  currency: Currency;
  category: string;
  brand?: string;
  sku?: string; // optional root-level SKU
  weight?: { value?: number; unit: "g" | "kg" };
  active: boolean; // admin-controlled
  deal_active: boolean;
  deal_percent?: number; // 1–90 when deal_active
  deal_price_minor?: number; // alternative to percent; must be < price_minor
  images: Media[];
  videos?: Media[];
  variants: Variant[];
  created_at: string; // ISO
};

export type ProductCreate = Omit<Product, "id" | "created_at" | "active"> & { active?: boolean };
export type ProductUpdate = Partial<ProductCreate>;

export type ProductSummary = {
  id: string;
  title: string;
  thumbnail_url?: string;
  active: boolean; // live when true
  deal_active: boolean;
  deal_percent?: number;
  created_at: string;
  category?: string;
  price_minor: number;
  currency: Currency;
  mode: "discover" | "deal"; // derive from deal_active
  review_status?: "pending_review"; // optional pending state
  coupon_code?: string;
  is_swipe_hour?: boolean;
};

export type ListProductsParams = {
  q?: string;
  status?: "active" | "pending_review" | "draft";
  mode?: "discover" | "deal";
  min_discount?: number;
  page?: number;
  page_size?: number;
};

export type ListProductsResponse = {
  items: ProductSummary[];
  page: number;
  page_size: number;
  total: number;
};
