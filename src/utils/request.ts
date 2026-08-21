// WeChat treats 127.0.0.1 as an invalid upload URL (including large JSON POSTs).
// export const BASE_URL = "http://192.168.10.122:9081";
export const BASE_URL = "http://10.50.200.10:9081";

export interface ApiResult<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

function toQuery(data: Record<string, unknown>) {
  return Object.keys(data)
    .filter((key) => {
      const value = data[key];
      return value !== undefined && value !== null && value !== "";
    })
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]))}`)
    .join("&");
}

export function request<T = unknown>(options: UniApp.RequestOptions) {
  const token = uni.getStorageSync("mall_app_token") || "";
  const method = String(options.method || "GET").toUpperCase();
  const { url: rawUrl = "", data: rawData, header: rawHeader, ...rest } = options;
  let url = `${BASE_URL}${rawUrl}`;
  let data: UniApp.RequestOptions["data"] | undefined = rawData;
  if (method === "GET" && data && typeof data === "object" && !Array.isArray(data)) {
    const qs = toQuery(data as Record<string, unknown>);
    if (qs) {
      url += (rawUrl.includes("?") ? "&" : "?") + qs;
    }
    data = undefined;
  }
  return new Promise<ApiResult<T>>((resolve, reject) => {
    const req: UniApp.RequestOptions = {
      ...rest,
      url,
      method: options.method,
      header: {
        ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
        ...(rawHeader || {}),
        ...(token ? { Authorization: token } : {}),
      },
      success: (res) => {
        const body = res.data as ApiResult<T>;
        if (body && typeof body.code === "number" && body.code !== 0) {
          if (body.code === 401) {
            uni.removeStorageSync("mall_app_token");
            uni.removeStorageSync("mall_app_user");
          }
          reject(new ApiError(body.code, body.message || "请求失败"));
          return;
        }
        resolve(body);
      },
      fail: (err) => {
        reject(new Error(err.errMsg || "网络异常"));
      },
    };
    if (data !== undefined) {
      req.data = data;
    }
    uni.request(req);
  });
}
