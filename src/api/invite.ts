import { request } from "@/utils/request";
import type { MemberLevelVO } from "@/api/auth";

export function redeemMemberLevelInvite(code: string) {
  return request<MemberLevelVO>({
    url: "/api/app/member-level/invite/redeem",
    method: "POST",
    data: { code },
  });
}
