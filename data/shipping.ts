import type { ShippingData } from "@/lib/types";

export const shippingData: ShippingData = {
  originAddress: {
    country: "Thailand",
    fullName: "Myshop Warehouse",
    phone: "+66 85 222 3344",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
    subdistrict: "ศรีภูมิ",
    postalCode: "50200",
    addressLine1: "129/3 Thapae Rd",
  },
  handlingTimeDays: 2,
  profiles: [
    {
      id: "sp1",
      name: "Domestic (TH)",
      regions: ["TH"],
      rateRules: [
        { id: "r1", name: "Standard (3-5 days)", price: 80 },
        { id: "r2", name: "Express (1-2 days)", price: 150 },
      ],
    },
    {
      id: "sp2",
      name: "International",
      regions: ["SG", "MY", "VN", "JP"],
      rateRules: [
        { id: "r3", name: "Economy (7-14 days)", price: 400 },
        { id: "r4", name: "Priority (3-5 days)", price: 900 },
      ],
    },
  ],
};
