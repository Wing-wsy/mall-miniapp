import { request } from "@/utils/request";
import type { ProductCardVO } from "@/api/product";

export function fetchFavoriteList() {
  return request<ProductCardVO[]>({
    url: "/api/app/favorite/list",
    method: "GET",
  });
}

export function checkFavorite(productId: number) {
  return request<{ favorited: boolean }>({
    url: "/api/app/favorite/check",
    method: "GET",
    data: { productId },
    silent: true,
  });
}

export function toggleFavorite(productId: number) {
  return request<{ favorited: boolean }>({
    url: "/api/app/favorite/toggle",
    method: "POST",
    data: { productId },
  });
}
