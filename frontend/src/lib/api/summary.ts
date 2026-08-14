import { api } from "./client";
import type { SummaryDto } from "./types";

export type GetSummaryParams = {
  from?: string;
  to?: string;
};

export function getSummary(params?: GetSummaryParams): Promise<SummaryDto> {
  return api.get<SummaryDto>("/summary", { query: params });
}
