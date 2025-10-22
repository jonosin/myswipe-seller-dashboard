import type { KycStatus, SellerProfile, SellerStatus } from "@/types/seller";

let profile: SellerProfile = {
  display_name: "MySwipe Seller",
  logo_url: undefined,
  seller_status: "approved",
  stripe_account_id: null,
};

let kyc: KycStatus = "not_started";

const delay = (ms=300) => new Promise((res)=>setTimeout(res, ms));

export async function getSellerProfile(): Promise<SellerProfile> {
  await delay();
  return { ...profile };
}

export async function updateSellerProfile(input: Partial<SellerProfile>): Promise<SellerProfile> {
  await delay();
  profile = { ...profile, ...input };
  return { ...profile };
}

export async function getSellerStatus(): Promise<{ status: SellerStatus }>{
  await delay();
  return { status: profile.seller_status };
}

export async function getKycStatus(): Promise<{ status: KycStatus }>{
  await delay();
  return { status: kyc };
}

export async function startKyc(): Promise<{ started: true }>{
  await delay();
  kyc = "in_progress";
  return { started: true };
}
