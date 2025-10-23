import type { Order } from "@/lib/types";

export const orders: Order[] = [
  {
    id: "o1001",
    createdAt: new Date().toISOString(),
    items: [
      { productId: "p1", title: "Classic Tee", size: "M", color: "Black", qty: 1, price: 24 },
      { productId: "p3", title: "Slim Fit Jeans", size: "32", color: "Indigo", qty: 1, price: 68 },
    ],
    buyer: {
      name: "Suda Wattanakorn",
      email: "suda@example.com",
      address: {
        country: "Thailand",
        fullName: "Suda Wattanakorn",
        phone: "0812345678",
        province: "กรุงเทพมหานคร",
        district: "วัฒนา",
        subdistrict: "คลองตันเหนือ",
        postalCode: "10110",
        addressLine1: "55/7 Soi Sukhumvit 63, Ekkamai",
      },
    },
    status: "paid",
    total: 92,
    shippingCost: 6,
    tracking: undefined,
  },
  {
    id: "o1002",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    items: [
      { productId: "p2", title: "Oversized Hoodie", size: "L", color: "Gray", qty: 1, price: 58 },
    ],
    buyer: {
      name: "Anan Chiangmai",
      email: "anan@example.com",
      address: {
        country: "Thailand",
        fullName: "Anan Chiangmai",
        phone: "+66 85 222 3344",
        province: "เชียงใหม่",
        district: "เมืองเชียงใหม่",
        subdistrict: "ศรีภูมิ",
        postalCode: "50200",
        addressLine1: "129/3 Thapae Rd",
      },
    },
    status: "in_transit",
    total: 58,
    shippingCost: 8,
    tracking: "1Z999999",
  },
  {
    id: "o1003",
    createdAt: new Date(Date.now() - 2*86400000).toISOString(),
    items: [
      { productId: "p5", title: "Athletic Shorts", size: "M", color: "Black", qty: 2, price: 58 },
    ],
    buyer: {
      name: "Niran Phuket",
      email: "niran@example.com",
      address: {
        country: "Thailand",
        fullName: "Niran Phuket",
        phone: "0901234567",
        province: "ภูเก็ต",
        district: "กะทู้",
        subdistrict: "ป่าตอง",
        postalCode: "83150",
        addressLine1: "2/14 Soi Bangla",
      },
    },
    status: "fulfilled",
    total: 58,
    shippingCost: 5,
    tracking: "9400ABC",
  },
  {
    id: "o1004",
    createdAt: new Date(Date.now() - 3*86400000).toISOString(),
    items: [
      { productId: "p4", title: "Linen Shirt", size: "L", color: "White", qty: 1, price: 44 },
    ],
    buyer: {
      name: "Taylor Moss",
      email: "taylor@example.com",
      address: {
        line1: "9 Lake View",
        city: "Chicago",
        state: "IL",
        postalCode: "60601",
        country: "US",
      },
    },
    status: "refunded",
    total: 44,
    shippingCost: 0,
  },
  {
    id: "o1005",
    createdAt: new Date(Date.now() - 4*86400000).toISOString(),
    items: [
      { productId: "p1", title: "Classic Tee", size: "S", color: "Black", qty: 1, price: 24 },
    ],
    buyer: {
      name: "Riley Chen",
      email: "riley@example.com",
      address: {
        line1: "200 Elm St",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "US",
      },
    },
    status: "paid",
    total: 24,
    shippingCost: 5,
  }
];
