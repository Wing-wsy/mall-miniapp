import { request } from "@/utils/request";
import type { OrderPreviewVO, OrderVO } from "@/api/order";

export function previewVoucher(data: { code: string; addressId?: number }) {
  return request<OrderPreviewVO>({
    url: "/api/app/voucher/preview",
    method: "POST",
    data,
  });
}

export function redeemVoucher(data: { code: string; addressId: number; remark?: string }) {
  return request<OrderVO>({
    url: "/api/app/voucher/redeem",
    method: "POST",
    data,
  });
}
