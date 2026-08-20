import { request } from "@/utils/request";
import type { AddressVO } from "@/api/address";
import type { CouponVO } from "@/api/coupon";

export interface OrderItemVO {
  id: number;
  productId: number;
  skuId: number;
  productName: string;
  coverUrl?: string;
  specName?: string;
  price: number | string;
  quantity: number;
  convertQty?: number;
  amount: number | string;
  points?: number;
  invalidReason?: string;
}

export interface ExpressTraceVO {
  time?: string;
  context?: string;
  location?: string;
}

export interface ExpressVO {
  expressCompany?: string;
  expressCompanyName?: string;
  expressNo?: string;
  expressState?: number;
  expressStateText?: string;
  coverUrl?: string;
  productName?: string;
  traces?: ExpressTraceVO[];
}

export interface OrderVO {
  id: number;
  orderNo: string;
  status: number;
  statusText: string;
  orderType?: number;
  goodsAmount: number | string;
  freightAmount: number | string;
  couponAmount?: number | string;
  couponName?: string;
  memberLevelName?: string;
  memberDiscount?: number | string;
  memberDiscountAmount?: number | string;
  pointsAmount?: number;
  payAmount: number | string;
  payChannel?: string;
  payStatus?: number;
  payTime?: string;
  payTradeNo?: string;
  expireTime?: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  buyerRemark?: string;
  cancelReason?: string;
  shipTime?: string;
  expressCompany?: string;
  expressCompanyName?: string;
  expressNo?: string;
  expressState?: number;
  latestTrace?: ExpressTraceVO | null;
  autoConfirmTime?: string;
  finishTime?: string;
  cancelTime?: string;
  createTime?: string;
  items: OrderItemVO[];
  canPay?: boolean;
  canCancel?: boolean;
  canConfirm?: boolean;
}

export interface OrderPreviewVO {
  address?: AddressVO | null;
  items: OrderItemVO[];
  goodsAmount: number | string;
  freightAmount: number | string;
  freightFree?: boolean;
  freightHint?: string;
  couponAmount?: number | string;
  couponName?: string;
  selectedCouponId?: number | null;
  coupons?: CouponVO[];
  payAmount: number | string;
  memberLevelName?: string;
  memberDiscount?: number | string;
  memberDiscountAmount?: number | string;
  couponStackMode?: string;
  memberDiscountApplied?: boolean;
  orderType?: number;
  pointsAmount?: number;
  memberPoints?: number;
  canSubmit: boolean;
}

export interface OrderCountVO {
  unpaid: number;
  waitShip: number;
  waitRecv: number;
  done: number;
}

export function previewOrder(cartIds: number[], couponId?: number | null, addressId?: number | null) {
  const data: { cartIds: number[]; couponId?: number; addressId?: number } = { cartIds };
  if (couponId != null) {
    data.couponId = couponId;
  }
  if (addressId) {
    data.addressId = addressId;
  }
  return request<OrderPreviewVO>({
    url: "/api/app/order/preview",
    method: "POST",
    data,
  });
}

export function createOrder(data: { cartIds: number[]; addressId: number; remark?: string; couponId?: number | null }) {
  return request<OrderVO>({
    url: "/api/app/order",
    method: "POST",
    data,
  });
}

export function previewPointsOrder(data: { productId: number; skuId: number; quantity: number; addressId?: number }) {
  return request<OrderPreviewVO>({
    url: "/api/app/order/preview-points",
    method: "POST",
    data,
  });
}

export function createPointsOrder(data: {
  productId: number;
  skuId: number;
  quantity: number;
  addressId: number;
  remark?: string;
}) {
  return request<OrderVO>({
    url: "/api/app/order/points",
    method: "POST",
    data,
  });
}

export function fetchOrderList(status?: number) {
  return request<OrderVO[]>({
    url: "/api/app/order/list",
    method: "GET",
    data: status != null ? { status } : {},
  });
}

export function fetchOrderCounts() {
  return request<OrderCountVO>({
    url: "/api/app/order/counts",
    method: "GET",
  });
}

export function fetchOrderDetail(id: number) {
  return request<OrderVO>({
    url: `/api/app/order/${id}`,
    method: "GET",
  });
}

export function fetchOrderExpress(id: number) {
  return request<ExpressVO>({
    url: `/api/app/order/${id}/express`,
    method: "GET",
  });
}

export function cancelOrder(id: number) {
  return request<OrderVO>({
    url: `/api/app/order/${id}/cancel`,
    method: "POST",
  });
}

export function confirmOrder(id: number) {
  return request<OrderVO>({
    url: `/api/app/order/${id}/confirm`,
    method: "POST",
  });
}

export function prepayOrder(orderId: number, channel = "mock") {
  return request<{ orderId: number; channel: string; status: string; tradeNo?: string }>({
    url: "/api/app/pay/prepay",
    method: "POST",
    data: { orderId, channel },
  });
}
