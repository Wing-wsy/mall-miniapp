import { request } from "@/utils/request";

export interface ProductDetailVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  price: number | string;
  originPrice?: number | string;
  detailHtml?: string;
  categoryId?: number;
  categoryPath?: string;
  festivalPaths?: string[];
}

export interface ProductCardVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  price: number | string;
  originPrice?: number | string;
}

export function fetchProductDetail(id: number) {
  return request<ProductDetailVO>({
    url: `/api/app/product/${id}`,
    method: "GET",
  });
}

export function fetchProductListByCategory(categoryId: number) {
  return request<ProductCardVO[]>({
    url: "/api/app/product/list",
    method: "GET",
    data: { categoryId },
  });
}

export function fetchProductListByFestival(festivalId: number) {
  return request<ProductCardVO[]>({
    url: "/api/app/product/list",
    method: "GET",
    data: { festivalId },
  });
}

export function fetchHotProducts(limit = 8) {
  return request<ProductCardVO[]>({
    url: "/api/app/product/hot",
    method: "GET",
    data: { limit },
  });
}
