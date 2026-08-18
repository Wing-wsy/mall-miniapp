import { request } from "@/utils/request";
import type { ProductDetailVO } from "@/api/product";

export interface PointProductCardVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  points: number;
  price?: number | string;
  multiSpec?: boolean;
}

export interface PointProductDetailVO {
  product: ProductDetailVO;
  points: number;
}

export interface PointLogVO {
  id: number;
  changeQty: number;
  afterQty: number;
  bizType: string;
  bizTypeText: string;
  orderId?: number;
  remark?: string;
  createTime?: string;
}

export function fetchPointProducts() {
  return request<PointProductCardVO[]>({
    url: "/api/app/point/products",
    method: "GET",
  });
}

export function fetchPointProductDetail(productId: number) {
  return request<PointProductDetailVO>({
    url: `/api/app/point/products/${productId}`,
    method: "GET",
  });
}

export function fetchPointLogs() {
  return request<PointLogVO[]>({
    url: "/api/app/point/logs",
    method: "GET",
  });
}
