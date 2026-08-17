import { request } from "@/utils/request";

export interface MemberVO {
  memberNo?: string;
  nickname: string;
  avatarUrl?: string;
  phone?: string;
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