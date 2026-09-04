import { request } from "@/utils/request";

export interface CartItemVO {
  id: number;
  itemType?: number;
  productId?: number;
  skuId?: number;
  comboId?: number;
  productName: string;
  coverUrl?: string;
  specName?: string;
  price: number | string;
  originPrice?: number | string;
  memberPrice?: number | string | null;
  sharePrice?: number | string | null;
  quantity: number;
  convertQty?: number;
  sellableQty?: number;
  components?: { productName: string; specName?: string; quantity: number }[];
  invalidReason?: string;
}

export interface CartListVO {
  items: CartItemVO[];
  totalQuantity: number;
  totalAmount: number | string;
}

export function fetchCartList() {
  return request<CartListVO>({
    url: "/api/app/cart/list",
    method: "GET",
  });
}

export function fetchCartCount() {
  return request<{ totalQuantity: number }>({
    url: "/api/app/cart/count",
    method: "GET",
  });
}

export function addCart(skuId?: number, quantity = 1, comboId?: number) {
  return request<CartItemVO>({
    url: "/api/app/cart",
    method: "POST",
    data: comboId ? { comboId, quantity } : { skuId, quantity },
  });
}

export function updateCartQty(id: number, quantity: number) {
  return request<CartItemVO>({
    url: `/api/app/cart/${id}`,
    method: "PUT",
    data: { quantity },
  });
}

export function deleteCart(id: number) {
  return request<null>({
    url: `/api/app/cart/${id}`,
    method: "DELETE",
  });
}
