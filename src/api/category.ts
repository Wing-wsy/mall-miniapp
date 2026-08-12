import { request } from "@/utils/request";

export interface CategoryNodeVO {
  id: number;
  parentId: number;
  name: string;
  iconUrl?: string;
  children?: CategoryNodeVO[];
}

export function fetchProductCategoryTree() {
  return request<CategoryNodeVO[]>({
    url: "/api/app/category/product/tree",
    method: "GET",
  });
}

export function fetchFestivalCategoryTree() {
  return request<CategoryNodeVO[]>({
    url: "/api/app/category/festival/tree",
    method: "GET",
  });
}
