import { request } from "@/utils/request";

export interface NavEntryVO {
  id: number;
  title: string;
  iconUrl?: string;
  linkType: string;
  linkValue?: string;
}

export function fetchNavEntryList() {
  return request<NavEntryVO[]>({
    url: "/api/app/nav-entry/list",
    method: "GET",
  });
}
