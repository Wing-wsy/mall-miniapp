import { request } from "@/utils/request";

export interface AppSupplierVO {
  id: number;
  name: string;
  contact: string;
  email?: string;
  address?: string;
  status: number;
  statusText?: string;
  auditRemark?: string;
  createTime?: string;
  canCancel?: boolean;
  canDelete?: boolean;
  canEditProfile?: boolean;
}

export interface AppSupplierHomeVO {
  canApply: boolean;
  showEntry: boolean;
  maxPerMember: number;
  usedCount: number;
  remainCount: number;
  showLogin: boolean;
  loginUrl?: string;
  username?: string;
  password?: string;
  list: AppSupplierVO[];
}

export function fetchSupplierHome() {
  return request<AppSupplierHomeVO>({
    url: "/api/app/supplier/mine",
    method: "GET",
  });
}

export function fetchSupplierEntry() {
  return request<boolean>({
    url: "/api/app/supplier/entry",
    method: "GET",
  });
}

export function createSupplier(data: {
  name: string;
  contact: string;
  email?: string;
  address?: string;
}) {
  return request<AppSupplierVO>({
    url: "/api/app/supplier",
    method: "POST",
    data,
  });
}

export function fetchSupplierDetail(id: number) {
  return request<AppSupplierVO>({
    url: `/api/app/supplier/${id}`,
    method: "GET",
  });
}

export function updateSupplierProfile(
  id: number,
  data: { contact: string; address: string; email?: string }
) {
  return request<AppSupplierVO>({
    url: `/api/app/supplier/${id}/profile`,
    method: "PUT",
    data,
  });
}

export function cancelSupplier(id: number) {
  return request<null>({
    url: `/api/app/supplier/${id}/cancel`,
    method: "POST",
  });
}

export function deleteRejectedSupplier(id: number) {
  return request<null>({
    url: `/api/app/supplier/${id}/delete`,
    method: "POST",
  });
}
