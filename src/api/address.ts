import { request } from "@/utils/request";

export interface AddressVO {
  id: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district: string;
  detailAddress: string;
  isDefault: boolean;
  fullAddress: string;
}

export interface AddressSavePayload {
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  district?: string;
  detailAddress: string;
  isDefault?: boolean;
}

export function fetchAddressList() {
  return request<AddressVO[]>({
    url: "/api/app/address/list",
    method: "GET",
  });
}

export function fetchAddressDetail(id: number) {
  return request<AddressVO>({
    url: `/api/app/address/${id}`,
    method: "GET",
  });
}

export function createAddress(data: AddressSavePayload) {
  return request<AddressVO>({
    url: "/api/app/address",
    method: "POST",
    data,
  });
}

export function updateAddress(id: number, data: AddressSavePayload) {
  return request<AddressVO>({
    url: `/api/app/address/${id}`,
    method: "PUT",
    data,
  });
}

export function deleteAddress(id: number) {
  return request<null>({
    url: `/api/app/address/${id}`,
    method: "DELETE",
  });
}

export function setDefaultAddress(id: number) {
  return request<null>({
    url: `/api/app/address/${id}/default`,
    method: "PUT",
  });
}
