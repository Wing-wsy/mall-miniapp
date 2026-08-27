import { request } from "@/utils/request";

export interface BalanceVO {
  balance: number | string;
}

export interface BalanceLogVO {
  id: number;
  changeAmount: number | string;
  afterAmount: number | string;
  bizType: string;
  bizTypeText: string;
  orderId?: number;
  remark?: string;
  createTime?: string;
}

export function fetchBalance() {
  return request<BalanceVO>({
    url: "/api/app/balance",
    method: "GET",
  });
}

export function fetchBalanceLogs() {
  return request<BalanceLogVO[]>({
    url: "/api/app/balance/logs",
    method: "GET",
  });
}
