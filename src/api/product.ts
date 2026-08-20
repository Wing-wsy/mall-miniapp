import { request } from "@/utils/request";

export interface ProductSkuVO {
  id: number;
  specId: number;
  specName: string;
  price: number | string;
  originPrice?: number | string;
  memberPrice?: number | string | null;
  isBase?: number;
  convertQty?: number;
  sellableQty?: number;
}

export interface ProductDetailVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  price: number | string;
  originPrice?: number | string;
  memberPrice?: number | string | null;
  detailHtml?: string;
  detailImageUrls?: string[];
  categoryId?: number;
  categoryPath?: string;
  festivalPaths?: string[];
  stock?: number;
  baseSpecName?: string;
  skus?: ProductSkuVO[];
}

export interface ProductCardVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  price: number | string;
  originPrice?: number | string;
  memberPrice?: number | string | null;
  multiSpec?: boolean;
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

export interface ProductPageVO {
  list: ProductCardVO[];
  total: number;
  page: number;
  size: number;
  hasMore: boolean;
}

export function fetchProductFeed(page = 1, size = 10) {
  return request<ProductPageVO>({
    url: `/api/app/product/feed?page=${page}&size=${size}`,
    method: "GET",
  });
}

export function searchProducts(keyword: string, page = 1, size = 10) {
  const q = [
    `keyword=${encodeURIComponent(keyword)}`,
    `page=${encodeURIComponent(String(page))}`,
    `size=${encodeURIComponent(String(size))}`,
  ].join("&");
  return request<ProductPageVO>({
    url: `/api/app/catalog/search?${q}`,
    method: "GET",
  });
}
