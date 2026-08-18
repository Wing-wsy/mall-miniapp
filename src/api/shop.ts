import { request } from "@/utils/request";

export interface ShopContactVO {
  phone: string;
  email: string;
  notice?: string;
}

export function fetchShopContact() {
  return request<ShopContactVO>({
    url: "/api/app/shop/contact",
    method: "GET",
  });
}
