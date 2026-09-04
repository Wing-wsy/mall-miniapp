import { request } from "@/utils/request";

export interface ComboItemVO {
  productId: number;
  skuId: number;
  productName: string;
  coverUrl?: string;
  specName?: string;
  skuPrice?: number | string;
  quantity: number;
}

export interface ComboVO {
  id: number;
  name: string;
  subtitle?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  detailImageUrls?: string[];
  price: number | string;
  originPrice?: number | string;
  memberPrice?: number | string | null;
  detailHtml?: string;
  freightQty?: number;
  sellableQty?: number;
  itemCount?: number;
  items?: ComboItemVO[];
}

export interface ComboPageVO {
  total: number;
  records: ComboVO[];
}

export function fetchComboList(pageNum = 1, pageSize = 10) {
  return request<ComboPageVO>({
    url: "/api/app/combo/list",
    method: "GET",
    data: { pageNum, pageSize },
  });
}

export function fetchComboDetail(id: number) {
  return request<ComboVO>({
    url: `/api/app/combo/${id}`,
    method: "GET",
  });
}
