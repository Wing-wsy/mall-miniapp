import { request, type ApiResult } from "@/utils/request";

export interface PingData {
  service: string;
  status: string;
}

export function pingAppApi() {
  return request<PingData>({
    url: "/ping",
    method: "GET",
  }).then((res: ApiResult<PingData>) => res);
}
