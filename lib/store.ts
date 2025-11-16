import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Address, OrderStatus, ShippingProfile } from "./types";

type AuthState = {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
};

type UIState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

type LangState = {
  lang: "en" | "th";
  setLang: (l: "en" | "th") => void;
};

type ProductFiltersState = {
  productSearch: string;
  productStatus: "all" | "active" | "pending";
  productCategory: string | "all";
  productMode: "all" | "discover" | "deal";
  productMinDiscount?: number;
  productPage: number;
  productPageSize: number;
  productSetFilters: (p: Partial<ProductFiltersState>) => void;
  productReset: () => void;
};

type OrderFiltersState = {
  orderSearch: string;
  orderStatus: OrderStatus | "all";
  orderDateFrom?: string;
  orderDateTo?: string;
  orderSetFilters: (p: Partial<OrderFiltersState>) => void;
  orderReset: () => void;
};

type OnboardingState = {
  identityVerified: boolean;
  bankLinked: boolean;
  taxProvided: boolean;
  setStep: (k: keyof Omit<OnboardingState, "setStep">, v: boolean) => void;
};

type SettingsState = {
  storeName: string;
  storeSlug: string;
  contactEmail: string;
  returnPolicy: string;
  taxIdMasked: string;
  notifyOrder: boolean;
  notifyPayout: boolean;
  storeAddress?: Address;
  update: (p: Partial<SettingsState>) => void;
};

type ShippingState = {
  profiles: ShippingProfile[];
  setProfiles: (p: ShippingProfile[]) => void;
};

export type AppState = AuthState & UIState & LangState & ProductFiltersState & OrderFiltersState & OnboardingState & SettingsState & ShippingState;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: () => set({ isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),

      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      lang: "th",
      setLang: (l) => set({ lang: l }),

      productSearch: "",
      productStatus: "all",
      productCategory: "all",
      productMode: "all",
      productMinDiscount: undefined,
      productPage: 1,
      productPageSize: 10,
      productSetFilters: (p) => set(p as any),
      productReset: () => set({ productSearch: "", productStatus: "all", productCategory: "all", productMode: "all", productMinDiscount: undefined, productPage: 1 }),

      orderSearch: "",
      orderStatus: "all",
      orderDateFrom: undefined,
      orderDateTo: undefined,
      orderSetFilters: (p) => set(p as any),
      orderReset: () => set({ orderSearch: "", orderStatus: "all", orderDateFrom: undefined, orderDateTo: undefined }),

      identityVerified: false,
      bankLinked: false,
      taxProvided: false,
      setStep: (k, v) => set({ [k]: v } as any),

      storeName: "Myshop",
      storeSlug: "myshop",
      contactEmail: "owner@example.com",
      returnPolicy: "Items can be returned within 30 days in original condition.",
      taxIdMasked: "•••-••-1234",
      notifyOrder: true,
      notifyPayout: true,
      storeAddress: {
        country: "Thailand",
        fullName: "Myshop",
        phone: "0812345678",
        province: "กรุงเทพมหานคร",
        district: "วัฒนา",
        subdistrict: "คลองตันเหนือ",
        postalCode: "10110",
        addressLine1: "55/7 Soi Sukhumvit 63, Ekkamai",
      },
      update: (p) => set(p as any),

      profiles: [],
      setProfiles: (p) => set({ profiles: p }),
    }),
    {
      name: "myswipe-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        lang: s.lang,
        identityVerified: s.identityVerified,
        bankLinked: s.bankLinked,
        taxProvided: s.taxProvided,
        storeName: s.storeName,
        storeSlug: s.storeSlug,
        contactEmail: s.contactEmail,
        returnPolicy: s.returnPolicy,
        taxIdMasked: s.taxIdMasked,
        notifyOrder: s.notifyOrder,
        notifyPayout: s.notifyPayout,
        storeAddress: s.storeAddress,
      }),
    }
  )
);
