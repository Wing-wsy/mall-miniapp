import { request } from "@/utils/request";

export interface BannerVO {
  id: number;
  title?: string;
  imageUrl?: string;
  productId: number;
}

export function fetchBannerList() {
  return request<BannerVO[]>({
    url: "/api/app/banner/list",
    method: "GET",
  });
}
