import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { fetchProfile, loginByCode, logoutApi, bindPhone, type MemberVO } from "@/api/auth";

export const useUserStore = defineStore("user", () => {
  const token = ref(uni.getStorageSync("mall_app_token") || "");
  const userInfo = ref<MemberVO | null>(readCachedUser());

  const isLogin = computed(() => !!token.value);

  function readCachedUser(): MemberVO | null {
    try {
      const raw = uni.getStorageSync("mall_app_user");
      return raw ? (JSON.parse(raw) as MemberVO) : null;
    } catch {
      return null;
    }
  }

  function setToken(value: string) {
    token.value = value;
    uni.setStorageSync("mall_app_token", value);
  }

  function setUserInfo(info: MemberVO | null) {
    userInfo.value = info;
    if (info) {
      uni.setStorageSync("mall_app_user", JSON.stringify(info));
    } else {
      uni.removeStorageSync("mall_app_user");
    }
  }

  function clearSession() {
    token.value = "";
    userInfo.value = null;
    uni.removeStorageSync("mall_app_token");
    uni.removeStorageSync("mall_app_user");
  }

  async function loginWithWxCode() {
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: "weixin",
        success: resolve,
        fail: reject,
      });
    });
    if (!loginRes.code) {
      throw new Error("未获取到微信 code");
    }
    const { data } = await loginByCode(loginRes.code);
    setToken(data.token);
    setUserInfo(data.userInfo);
    return data;
  }

  /** 开发工具/mock：无微信 code 时用本地假 code */
  async function loginWithMockCode() {
    const code = `dev_${Date.now()}`;
    const { data } = await loginByCode(code);
    setToken(data.token);
    setUserInfo(data.userInfo);
    return data;
  }

  async function bindWxPhone(payload: { code?: string; phone?: string }) {
    const { data } = await bindPhone(payload);
    setUserInfo(data);
    return data;
  }

  async function refreshProfile() {
    if (!token.value) return null;
    const { data } = await fetchProfile();
    setUserInfo(data);
    return data;
  }

  async function logout() {
    try {
      if (token.value) {
        await logoutApi();
      }
    } catch {
      // ignore network error on logout
    } finally {
      clearSession();
    }
  }

  return {
    token,
    userInfo,
    isLogin,
    setToken,
    clearSession,
    loginWithWxCode,
    loginWithMockCode,
    bindWxPhone,
    refreshProfile,
    logout,
  };
});