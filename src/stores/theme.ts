import { defineStore } from "pinia";
import { fetchCurrentTheme, type ThemeVO } from "@/api/theme";

const TAB_NAMES = ["home", "category", "cart", "mine"] as const;
const TAB_TEXTS = ["首页", "分类", "购物车", "我的"];

/** 内置节日图标包（微信 tabBar 优先本地路径） */
const BUILTIN_TAB_PACKS: Record<string, string> = {
  default: "static/tab",
  zhongqiu: "static/tab/zhongqiu",
  duanwu: "static/tab/duanwu",
};

const DEFAULT_THEME: ThemeVO = {
  code: "default",
  name: "默认皮肤",
  festivalCategoryId: null,
  defaultTheme: true,
  tokens: {
    primary: "#FF5A3D",
    primarySoft: "#FFE8E2",
    price: "#FF5A3D",
    pageBg: "#F7F7F7",
    navText: "#111827",
    brand: "#FF5A3D",
  },
  copy: {
    brandName: "Mall",
    navTitle: "Mall精选",
    searchPlaceholder: "搜索商品、品牌",
    heroTag: "今日精选",
    heroTitle: "品质好物 用心挑选",
    heroSub: "点击查看商品详情",
  },
  assets: {
    heroImageUrl: "",
    pageBgImageUrl: "",
  },
  tabbar: {
    color: "#B0B0B0",
    selectedColor: "#FF5A3D",
    list: [],
  },
};

function asTheme(raw: any): ThemeVO {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_THEME };
  return {
    code: String(raw.code || "default"),
    name: String(raw.name || "默认皮肤"),
    festivalCategoryId: raw.festivalCategoryId ?? null,
    defaultTheme: !!raw.defaultTheme,
    tokens: { ...DEFAULT_THEME.tokens, ...(raw.tokens || {}) },
    copy: { ...DEFAULT_THEME.copy, ...(raw.copy || {}) },
    assets: { ...DEFAULT_THEME.assets, ...(raw.assets || {}) },
    tabbar: {
      color: (raw.tabbar && raw.tabbar.color) || DEFAULT_THEME.tabbar.color,
      selectedColor: (raw.tabbar && raw.tabbar.selectedColor) || DEFAULT_THEME.tabbar.selectedColor,
      list: Array.isArray(raw.tabbar?.list) ? raw.tabbar.list : [],
    },
  };
}

function applyCssVars(tokens: Record<string, string>) {
  try {
    uni.setStorageSync("mall_theme_tokens", tokens);
  } catch (e) {
    // ignore
  }
}

function isRemoteUrl(url?: string) {
  return !!url && /^https?:\/\//i.test(url);
}

function downloadIcon(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200 && res.tempFilePath) resolve(res.tempFilePath);
        else reject(new Error("download fail"));
      },
      fail: reject,
    });
  });
}

function builtinPack(code: string) {
  return BUILTIN_TAB_PACKS[code] || BUILTIN_TAB_PACKS.default;
}

async function resolveTabIcons(theme: ThemeVO) {
  const pack = builtinPack(theme.code);
  const remoteList = theme.tabbar.list || [];
  const result: Array<{ index: number; text: string; iconPath: string; selectedIconPath: string }> = [];

  for (let i = 0; i < 4; i++) {
    const remote = remoteList[i] || {};
    const text = remote.text || TAB_TEXTS[i];
    let iconPath = `${pack}/${TAB_NAMES[i]}.png`;
    let selectedIconPath = `${pack}/${TAB_NAMES[i]}-active.png`;

    // 后台上传的网络图：下载到本地临时文件后再设（微信要求）
    try {
      if (isRemoteUrl(remote.iconPath)) {
        iconPath = await downloadIcon(remote.iconPath!);
      } else if (remote.iconPath && (remote.iconPath.startsWith("/static/") || remote.iconPath.startsWith("static/"))) {
        iconPath = remote.iconPath.replace(/^\//, "");
      }
      if (isRemoteUrl(remote.selectedIconPath)) {
        selectedIconPath = await downloadIcon(remote.selectedIconPath!);
      } else if (
        remote.selectedIconPath &&
        (remote.selectedIconPath.startsWith("/static/") || remote.selectedIconPath.startsWith("static/"))
      ) {
        selectedIconPath = remote.selectedIconPath.replace(/^\//, "");
      }
    } catch (e) {
      // 下载失败则回退内置包
      iconPath = `${pack}/${TAB_NAMES[i]}.png`;
      selectedIconPath = `${pack}/${TAB_NAMES[i]}-active.png`;
    }

    result.push({ index: i, text, iconPath, selectedIconPath });
  }
  return result;
}

async function applyTabBar(theme: ThemeVO) {
  const selectedColor = theme.tabbar.selectedColor || "#FF5A3D";
  const color = theme.tabbar.color || "#B0B0B0";
  try {
    uni.setTabBarStyle({
      color,
      selectedColor,
      backgroundColor: "#FFFFFF",
      borderStyle: "white",
    });
  } catch (e) {
    // ignore
  }

  const items = await resolveTabIcons(theme);
  for (const item of items) {
    try {
      uni.setTabBarItem({
        index: item.index,
        text: item.text,
        iconPath: item.iconPath,
        selectedIconPath: item.selectedIconPath,
      });
    } catch (e) {
      // ignore
    }
  }
}

export const useThemeStore = defineStore("theme", {
  state: () => ({
    theme: { ...DEFAULT_THEME } as ThemeVO,
    loaded: false,
  }),
  getters: {
    tokens: (s) => s.theme.tokens,
    copy: (s) => s.theme.copy,
    assets: (s) => s.theme.assets,
    primary: (s) => s.theme.tokens.primary || "#FF5A3D",
    pageBg: (s) => s.theme.tokens.pageBg || "#F7F7F7",
    brandName: (s) => s.theme.copy.brandName || "Mall",
    searchPlaceholder: (s) => s.theme.copy.searchPlaceholder || "搜索商品、品牌",
  },
  actions: {
    async applyLocal(theme: ThemeVO) {
      this.theme = theme;
      applyCssVars(theme.tokens);
      await applyTabBar(theme);
    },
    async loadCurrent() {
      try {
        const res = await fetchCurrentTheme();
        const theme = asTheme(res.data);
        await this.applyLocal(theme);
        this.loaded = true;
        return theme;
      } catch (e) {
        await this.applyLocal({ ...DEFAULT_THEME });
        this.loaded = true;
        return this.theme;
      }
    },
  },
});
