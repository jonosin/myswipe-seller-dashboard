import { products as seedProducts } from "@/data/products";
import { orders as seedOrders } from "@/data/orders";
import { payoutData as seedPayout } from "@/data/payouts";
import { shippingData as seedShipping } from "@/data/shipping";
import type { Order, OrderStatus, PayoutData, Product, ShippingData, ShippingProfile } from "./types";

let products: Product[] = [...seedProducts];
let orders: Order[] = [...seedOrders];
let payout: PayoutData = { ...seedPayout, history: [...seedPayout.history] };
let shipping: ShippingData = { ...seedShipping, profiles: [...seedShipping.profiles] };

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

export async function listProducts() {
  await delay();
  return [...products];
}

export async function addProduct(input: Omit<Product, "id">) {
  await delay();
  const p: Product = { id: crypto.randomUUID(), ...input };
  products = [p, ...products];
  return p;
}

export async function updateProduct(id: string, patch: Partial<Product>) {
  await delay();
  products = products.map((p) => (p.id === id ? { ...p, ...patch } : p));
  return products.find((p) => p.id === id)!;
}

export async function removeProduct(id: string) {
  await delay();
  products = products.filter((p) => p.id !== id);
}

export async function listOrders() {
  await delay();
  return [...orders];
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await delay();
  orders = orders.map((o) => (o.id === id ? { ...o, status } : o));
  return orders.find((o) => o.id === id)!;
}

export async function getPayout(): Promise<PayoutData> {
  await delay();
  return { ...payout, history: [...payout.history] };
}

export async function getShipping(): Promise<ShippingData> {
  await delay();
  return { ...shipping, profiles: [...shipping.profiles] };
}

export async function saveShippingProfile(input: Omit<ShippingProfile, "id"> & { id?: string }) {
  await delay();
  if (input.id) {
    shipping.profiles = shipping.profiles.map((p) => (p.id === input.id ? { ...(p as ShippingProfile), ...input } : p));
    return shipping.profiles.find((p) => p.id === input.id)!;
  }
  const profile: ShippingProfile = { ...input, id: crypto.randomUUID() } as ShippingProfile;
  shipping.profiles = [profile, ...shipping.profiles];
  return profile;
}

export async function deleteShippingProfile(id: string) {
  await delay();
  shipping.profiles = shipping.profiles.filter((p) => p.id !== id);
}

export async function updateShippingSettings(patch: Partial<Pick<ShippingData, "originAddress" | "handlingTimeDays">>) {
  await delay();
  shipping = { ...shipping, ...patch };
  return shipping;
}

export async function getDashboardMetrics() {
  const [ps, os, po] = await Promise.all([listProducts(), listOrders(), getPayout()]);
  const totalSales = os.reduce((sum, o) => sum + o.total, 0);
  const pendingPayouts = po.currentBalance;
  const activeListings = ps.filter((p) => p.status === "active").length;
  const inTransit = os.filter((o) => o.status === "in_transit").length;
  return { totalSales, pendingPayouts, activeListings, inTransit, recentOrders: os.slice(0, 5) };
}
