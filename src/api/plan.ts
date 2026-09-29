import { request } from "@/utils/request";

export interface PlanItemVO {
  id: number;
  productId?: number;
  skuId?: number;
  sellUnitId?: number;
  sellUnitName?: string;
  attrText?: string;
  productName: string;
  coverUrl?: string;
  specName?: string;
  price: number | string;
  originPrice?: number | string;
  memberPrice?: number | string | null;
  sharePrice?: number | string | null;
  quantity: number;
  convertQty?: number;
  minOrderQty?: number;
  invalidReason?: string;
}

export interface PlanSummaryVO {
  id: number;
  name: string;
  productCount: number;
  totalQuantity: number;
  amount: number | string;
}

export interface PlanDetailVO extends PlanSummaryVO {
  canSubmit: boolean;
  items: PlanItemVO[];
}

export function fetchPlanList() {
  return request<PlanSummaryVO[]>({
    url: "/api/app/plan/list",
    method: "GET",
  });
}

export function fetchPlanDetail(id: number) {
  return request<PlanDetailVO>({
    url: `/api/app/plan/${id}`,
    method: "GET",
  });
}

export function createPlan(name: string) {
  return request<PlanDetailVO>({
    url: "/api/app/plan",
    method: "POST",
    data: { name },
  });
}

export function renamePlan(id: number, name: string) {
  return request<PlanDetailVO>({
    url: `/api/app/plan/${id}`,
    method: "PUT",
    data: { name },
  });
}

export function deletePlan(id: number) {
  return request<void>({
    url: `/api/app/plan/${id}`,
    method: "DELETE",
  });
}

export function addPlanItem(planId: number, data: { skuId: number; sellUnitId: number; quantity: number }) {
  return request<PlanItemVO>({
    url: `/api/app/plan/${planId}/items`,
    method: "POST",
    data,
  });
}

export function updatePlanItem(
  itemId: number,
  data: { quantity: number; skuId?: number; sellUnitId?: number }
) {
  return request<PlanItemVO>({
    url: `/api/app/plan/items/${itemId}`,
    method: "PUT",
    data,
  });
}

export function exportPlanPpt(planId: number) {
  return request<{ fileName: string; objectKey: string; downloadUrl: string }>({
    url: `/api/app/plan/${planId}/export-ppt`,
    method: "POST",
  });
}

export function deletePlanItem(itemId: number) {
  return request<void>({
    url: `/api/app/plan/items/${itemId}`,
    method: "DELETE",
  });
}
