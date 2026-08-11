const BASE_URL = "http://127.0.0.1:9081";

export interface ApiResult<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export function request<T = unknown>(options: UniApp.RequestOptions) {
  const token = uni.getStorageSync("mall_app_token") || "";
  return new Promise<ApiResult<T>>((resolve, reject) => {
    uni.request({
      ...options,
      url: `${BASE_URL}${options.url}`,
      header: {
        ...(options.header || {}),
        ...(token ? { Authorization: token } : {}),
      },
      success: (res) => {
        const body = res.data as ApiResult<T>;
        if (body && typeof body.code === "number" && body.code !== 0) {
          reject(new Error(body.message || "请求失败"));
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
