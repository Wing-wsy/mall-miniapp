import { request } from "@/utils/request";

export interface MemberLevelVO {
  id: number;
  name: string;
  iconUrl?: string;
  discount?: number | string;
  couponStackMode?: "STACK" | "MUTEX";
  privileges?: string[];
}

export interface MemberVO {
  memberNo?: string;
  nickname: string;
  avatarUrl?: string;
  phone?: string;
  points?: number;
  balance?: number | string | null;
  level?: MemberLevelVO | null;
}

export interface LoginResult {
  token: string;
  userInfo: MemberVO;
}

export function loginByCode(code: string) {
  return request<LoginResult>({
    url: "/api/app/auth/login",
    method: "POST",
    data: { code },
  });
}

export function bindPhone(data: { code?: string; phone?: string }) {
  return request<MemberVO>({
    url: "/api/app/auth/bind-phone",
    method: "POST",
    data,
  });
}

export function fetchProfile() {
  return request<MemberVO>({
    url: "/api/app/auth/me",
    method: "GET",
  });
}

export function logoutApi() {
  return request<null>({
    url: "/api/app/auth/logout",
    method: "POST",
  });
}
