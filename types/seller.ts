export type SellerStatus = "pending" | "approved" | "disabled";

export type SellerProfile = {
  display_name: string;
  logo_url?: string;
  seller_status: SellerStatus;
  stripe_account_id?: string | null;
};

export type KycStatus = "not_started" | "in_progress" | "verified" | "rejected";
