/** @deprecated 逻辑已内联到 pages/goods/search.vue；保留此文件避免旧构建缓存引用报错 */
const STORAGE_KEY = "mall_search_history";
const MAX = 3;

function normalize(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const x of list) {
    const s = String(x ?? "").trim();
    if (s) out.push(s);
    if (out.length >= MAX) break;
  }
  return out;
}

export function getSearchHistory(): string[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    if (raw == null || raw === "") return [];
    if (Array.isArray(raw)) return normalize(raw);
    if (typeof raw === "string") {
      const text = raw.trim();
      if (!text) return [];
      if (text.startsWith("[")) {
        try {
          return normalize(JSON.parse(text));
        } catch {
          return [];
        }
      }
      return [text];
    }
  } catch {
    // ignore
  }
  return [];
}

export function pushSearchHistory(keyword: string): string[] {
  const kw = String(keyword || "").trim();
  if (!kw) return getSearchHistory();
  const next = [kw, ...getSearchHistory().filter((x) => x !== kw)].slice(0, MAX);
  try {
    uni.setStorageSync(STORAGE_KEY, next);
  } catch {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  return next;
}

export function clearSearchHistory() {
  try {
    uni.removeStorageSync(STORAGE_KEY);
  } catch {
    // ignore
  }
}
