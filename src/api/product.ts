import { request } from "@/utils/request";

export interface ProductDetailVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  price: number | string;
  originPrice?: number | string;
  detailHtml?: string;
}

export function fetchProductDetail(id: number) {
  return request<ProductDetailVO>({
    url: `/api/app/product/${id}`,
    method: "GET",
  });
}
