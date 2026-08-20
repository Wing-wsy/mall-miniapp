import { request } from "@/utils/request";

export interface CouponVO {
  id: number;
  couponNo: string;
  name: string;
  benefitType: string;
  benefitText: string;
  thresholdAmount?: number | string;
  benefitValue?: number | string;
  status: number;
  statusText: string;
  expireTime?: string;
  createTime?: string;
  usable?: boolean;
  reason?: string;
  tip?: string;
  couponAmount?: number | string;
}

export interface CouponActivityVO {
  templateId: number;
  name: string;
  benefitText: string;
  validDays: number;
  claimStart?: string;
  claimEnd?: string;
  remainQuota?: number | null;
  claimed: boolean;
  soldOut: boolean;
  canClaim: boolean;
}

export function fetchMyCoupons(status?: number) {
  return request<CouponVO[]>({
    url: "/api/app/coupon/mine",
    method: "GET",
    data: status != null ? { status } : {},
  });
}

export function fetchCouponActivities() {
  return request<CouponActivityVO[]>({
    url: "/api/app/coupon/activities",
    method: "GET",
  });
}

export function claimCoupon(templateId: number) {
  return request<CouponVO>({
    url: "/api/app/coupon/claim",
    method: "POST",
    data: { templateId },
  });
}
