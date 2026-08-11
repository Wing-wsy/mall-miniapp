const BASE_URL = "http://127.0.0.1:9081";

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

export function request<T = unknown>(options: UniApp.RequestOptions) {
  const token = uni.getStorageSync("mall_app_token") || "";
  return new Promise<ApiResult<T>>((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      header: {
        "Content-Type": "application/json",
        ...(options.header || {}),
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
    });
  });
}