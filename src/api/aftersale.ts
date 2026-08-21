import { request } from "@/utils/request";
import type { OrderItemVO } from "@/api/order";

export interface AfterSaleLogVO {
  action?: string;
  actionText?: string;
  fromStatus?: number;
  toStatus?: number;
  toStatusText?: string;
  remark?: string;
  createTime?: string;
}

export interface AfterSaleVO {
  id: number;
  orderId: number;
  orderNo?: string;
  orderType?: number;
  orderStatus?: number;
  afterSaleNo: string;
  type: number;
  typeText?: string;
  status: number;
  statusText?: string;
  reason?: string;
  reasonText?: string;
  remark?: string;
  images?: string[];
  refundAmount?: number | string;
  refundPoints?: number;
  rejectReason?: string;
  returnExpressCompany?: string;
  returnExpressCompanyName?: string;
  returnExpressNo?: string;
  returnName?: string;
  returnPhone?: string;
  returnAddress?: string;
  returnTime?: string;
  receiveTime?: string;
  refundTime?: string;
  createTime?: string;
  items?: OrderItemVO[];
  logs?: AfterSaleLogVO[];
  canCancel?: boolean;
  canFillReturn?: boolean;
}

export interface AfterSaleReasonVO {
  code: string;
  label: string;
  type: number;
}

export function fetchAfterSaleReasons(type?: number) {
  return request<AfterSaleReasonVO[]>({
    url: "/api/app/after-sale/reasons",
    method: "GET",
    data: type != null ? { type } : {},
  });
}

export function fetchAfterSaleList(status?: number) {
  return request<AfterSaleVO[]>({
    url: "/api/app/after-sale/list",
    method: "GET",
    data: status != null ? { status } : {},
  });
}

export function fetchAfterSaleDetail(id: number) {
  return request<AfterSaleVO>({
    url: `/api/app/after-sale/${id}`,
    method: "GET",
  });
}

export function applyAfterSale(data: {
  orderId: number;
  type: number;
  reason: string;
  remark?: string;
  images?: string[];
}) {
  return request<AfterSaleVO>({
    url: "/api/app/after-sale",
    method: "POST",
    data,
  });
}

export function cancelAfterSale(id: number) {
  return request<AfterSaleVO>({
    url: `/api/app/after-sale/${id}/cancel`,
    method: "POST",
  });
}

export function fillAfterSaleReturn(id: number, data: { expressCompany: string; expressNo: string }) {
  return request<AfterSaleVO>({
    url: `/api/app/after-sale/${id}/return`,
    method: "POST",
    data,
  });
}
