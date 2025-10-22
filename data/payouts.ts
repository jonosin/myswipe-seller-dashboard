import type { PayoutData } from "@/lib/types";

export const payoutData: PayoutData = {
  currentBalance: 324.5,
  nextPayoutDate: new Date(Date.now() + 5*86400000).toISOString(),
  schedule: "weekly",
  history: [
    { id: "ph1", date: new Date(Date.now() - 7*86400000).toISOString(), amount: 210.15, status: "paid" },
    { id: "ph2", date: new Date(Date.now() - 14*86400000).toISOString(), amount: 98.2, status: "paid" },
    { id: "ph3", date: new Date(Date.now() - 21*86400000).toISOString(), amount: 143.9, status: "paid" },
  ],
};
