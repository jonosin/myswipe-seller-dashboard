export type ProductStatus = "active" | "draft";

export type ProductVariant = {
  // Legacy/simple fields (kept for backward compatibility)
  size?: string;
  color?: string;
  stock: number;

  // Extended variant fields (optional)
  optionValues?: Record<string, string>;
  price?: number;
  compareAtPrice?: number | null;
  costPerItem?: number;
  sku?: string;
  available?: boolean;
};

export type ProductImage = {
  id: string;
  url: string;
  alt?: string;
  sortOrder: number;
};

export type ProductPricing = {
  price: number;
  compareAtPrice?: number | null;
  costPerItem?: number;
};

export type ProductWeight = {
  value: number;
  unit: "g" | "kg";
};

export type ProductOption = {
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  brand?: string; // optional, non-breaking
  price: number;
  compareAtPrice?: number | null;
  // Optional cost at root for compatibility with views that don't use pricing object
  costPerItem?: number;
  sku: string;
  inventory: number;
  variants: ProductVariant[];
  images: string[];
  // Optional extended fields (mock-only, non-breaking)
  imagesMeta?: ProductImage[];
  pricing?: ProductPricing;
  weight?: ProductWeight;
  options?: ProductOption[];
  visibility: "public" | "private";
  status: ProductStatus;
  mode?: "discover" | "deal";
  discountPercent?: number; // only for mode === "deal"
  // Phase 2 discovery fields
  external_url?: string;
  coupon_code?: string;
  is_swipe_hour?: boolean;
};

export type OrderStatus = "paid" | "fulfilled" | "in_transit" | "refunded";

export type OrderItem = {
  productId: string;
  title: string;
  size?: string;
  color?: string;
  qty: number;
  price: number;
};

export type Address = {
  // Legacy/general fields (kept for backward compatibility)
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;

  // Thailand-specific fields (optional to keep mocks flexible)
  fullName?: string;
  phone?: string; // Accepts +66 or local 0-leading
  province?: string; // จังหวัด
  district?: string; // เขต/อำเภอ
  subdistrict?: string; // แขวง/ตำบล
  addressLine1?: string; // ที่อยู่ บรรทัดที่ 1
  addressLine2?: string; // ที่อยู่ บรรทัดที่ 2 (ถ้ามี)
  isDefault?: boolean;
};

export type Buyer = {
  name: string;
  email: string;
  address: Address;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  buyer: Buyer;
  status: OrderStatus;
  total: number;
  shippingCost: number;
  tracking?: string;
};

export type PayoutHistoryEntry = {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
};

export type PayoutData = {
  currentBalance: number;
  nextPayoutDate: string;
  schedule: "weekly" | "daily" | "monthly";
  history: PayoutHistoryEntry[];
};

export type ShippingRateRule = {
  id: string;
  name: string;
  price: number;
};

export type ShippingProfile = {
  id: string;
  name: string;
  regions: string[];
  rateRules: ShippingRateRule[];
};

export type ShippingData = {
  originAddress: Address;
  handlingTimeDays: number;
  profiles: ShippingProfile[];
};
