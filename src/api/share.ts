import { request } from "@/utils/request";

export interface ShareMeVO {
  canShare: boolean;
  shareActive: boolean;
  shareRate?: number | string | null;
  shareRateMin?: number | string | null;
  shareRateMax?: number | string | null;
  shareCommissionRate?: number | string | null;
  shareCode?: string | null;
}

export interface ShareDownlineVO {
  memberNo?: string;
  nickname?: string;
  avatarUrl?: string;
  phone?: string;
  createTime?: string;
}

export interface ShareDownlinePageVO {
  total: number;
  list: ShareDownlineVO[];
}

export interface ShareLinkVO {
  urlLink: string;
  miniPath: string;
}

export function fetchShareMe() {
  return request<ShareMeVO>({
    url: "/api/app/share/me",
    method: "GET",
  });
}

export function saveShareRate(shareRate: number) {
  return request<ShareMeVO>({
    url: "/api/app/share/rate",
    method: "PUT",
    data: { shareRate },
  });
}

export function fetchShareDownlines(page = 1, size = 20) {
  return request<ShareDownlinePageVO>({
    url: "/api/app/share/downlines",
    method: "GET",
    data: { page, size },
  });
}

export function bindShare(data: { sc: string; productId?: number }) {
  return request<{ bound: boolean; productId?: number }>({
    url: "/api/app/share/bind",
    method: "POST",
    data,
  });
}

export function createShareLink(productId?: number) {
  return request<ShareLinkVO>({
    url: "/api/app/share/link",
    method: "POST",
    data: productId ? { productId } : {},
  });
}
