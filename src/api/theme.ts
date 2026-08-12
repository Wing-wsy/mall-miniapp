import { request } from "@/utils/request";

export interface ThemeVO {
  code: string;
  name: string;
  festivalCategoryId?: number | null;
  defaultTheme: boolean;
  tokens: Record<string, string>;
  copy: Record<string, string>;
  assets: Record<string, string>;
  tabbar: {
    color?: string;
    selectedColor?: string;
    list?: Array<{
      index?: number;
      text?: string;
      iconPath?: string;
      selectedIconPath?: string;
    }>;
  };
}

export function fetchCurrentTheme() {
  return request<ThemeVO>({
    url: "/api/app/theme/current",
    method: "GET",
  });
}
