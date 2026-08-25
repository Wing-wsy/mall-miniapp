const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function isRemoteHttpUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function isDevtools() {
  try {
    return uni.getSystemInfoSync().platform === "devtools";
  } catch {
    return false;
  }
}

function userDataPath() {
  try {
    return String((uni as any).env?.USER_DATA_PATH || "");
  } catch {
    return "";
  }
}

function guessExt(url: string) {
  const match = url.toLowerCase().match(/\.(png|jpe?g|gif|webp|bmp)(\?|#|$)/);
  if (!match) {
    return "jpg";
  }
  return match[1] === "jpeg" ? "jpg" : match[1];
}

function hash(url: string) {
  let value = 0;
  for (let i = 0; i < url.length; i++) {
    value = (value * 31 + url.charCodeAt(i)) | 0;
  }
  return String(value >>> 0);
}

/**
 * 开发者工具直接用原 URL。
 * 真机预览里 <image> 经常加载不了局域网 HTTP，改走 request（与接口同一通道）再落本地文件。
 */
export function prefetchImage(url: string): Promise<string> {
  const raw = (url || "").trim();
  if (!raw || !isRemoteHttpUrl(raw) || isDevtools()) {
    return Promise.resolve(raw);
  }
  const cached = cache.get(raw);
  if (cached) {
    return Promise.resolve(cached);
  }
  const inflight = pending.get(raw);
  if (inflight) {
    return inflight;
  }
  const task = new Promise<string>((resolve) => {
    const dir = userDataPath();
    if (!dir) {
      uni.downloadFile({
        url: raw,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) {
            cache.set(raw, res.tempFilePath);
            resolve(res.tempFilePath);
            return;
          }
          resolve(raw);
        },
        fail: () => resolve(raw),
      });
      return;
    }
    const filePath = `${dir}/mall_${hash(raw)}.${guessExt(raw)}`;
    uni.request({
      url: raw,
      method: "GET",
      responseType: "arraybuffer",
      success: (res) => {
        if (res.statusCode !== 200 || !res.data) {
          resolve(raw);
          return;
        }
        uni.getFileSystemManager().writeFile({
          filePath,
          data: res.data as ArrayBuffer,
          success: () => {
            cache.set(raw, filePath);
            resolve(filePath);
          },
          fail: () => resolve(raw),
        });
      },
      fail: () => resolve(raw),
    });
  }).finally(() => {
    pending.delete(raw);
  });
  pending.set(raw, task);
  return task;
}

export async function prefetchCoverUrls(items?: Array<{ coverUrl?: string } | null | undefined>) {
  await Promise.all((items || []).filter(Boolean).map((item) => prefetchImageField(item as Record<string, any>, "coverUrl")));
}

export async function prefetchImageField<T extends Record<string, any>>(item: T, key: keyof T) {
  const value = item[key];
  if (typeof value === "string" && value) {
    item[key] = (await prefetchImage(value)) as T[keyof T];
    return;
  }
  if (Array.isArray(value)) {
    item[key] = (await Promise.all(value.map((url) => prefetchImage(String(url || ""))))) as T[keyof T];
  }
}
