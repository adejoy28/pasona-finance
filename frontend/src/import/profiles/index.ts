import type { BankProfile } from "./types";
import { genericProfile } from "./generic";
import { kudaProfile } from "./kuda";
import { opayProfile } from "./opay";
import { palmpayProfile } from "./palmpay";
import { sterlingProfile } from "./sterling";

export * from "./types";
export * from "./generic";
export * from "./kuda";
export * from "./opay";
export * from "./palmpay";
export * from "./sterling";
export * from "./generic-auto";

export type BankProfileKey = "generic" | "kuda" | "opay" | "palmpay" | "sterling";

export const PROFILES: Record<BankProfileKey, BankProfile> = {
  generic: genericProfile,
  kuda: kudaProfile,
  opay: opayProfile,
  palmpay: palmpayProfile,
  sterling: sterlingProfile,
};

export function getProfile(key: BankProfileKey | string): BankProfile {
  return PROFILES[key as BankProfileKey] ?? genericProfile;
}
