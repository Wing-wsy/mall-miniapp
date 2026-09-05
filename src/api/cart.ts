import { request } from "@/utils/request";

export interface CartItemVO {
  id: number;
  itemType?: number;
  productId?: number;
  skuId?: number;
  sellUnitId?: number;
  comboId?: number;
  productName: string;
  coverUrl?: string;
  attrText?: string;
  specName?: string;
  sellUnitName?: string;
  price: number | string;
  originPrice?: number | string;
  memberPrice?: number | string | null;
  sharePrice?: number | string | null;
  quantity: number;
  convertQty?: number;
  sellableQty?: number;
  components?: { productName: string; specName?: string; attrText?: string; quantity: number }[];
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

export function addCart(skuId?: number, quantity = 1, comboId?: number, sellUnitId?: number) {
  return request<CartItemVO>({
    url: "/api/app/cart",
    method: "POST",
    data: comboId
      ? { comboId, quantity }
      : { skuId, quantity, ...(sellUnitId != null ? { sellUnitId } : {}) },
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

export function cartItemLabel(item: {
  itemType?: number;
  attrText?: string;
  specName?: string;
  sellUnitName?: string;
}) {
  if (item.itemType === 2) {
    return "礼盒";
  }
  const attr = item.attrText || item.specName || "";
  const unit = item.sellUnitName || "";
  if (attr && unit) {
    return `${attr} · ${unit}`;
  }
  return attr || unit || "";
}
