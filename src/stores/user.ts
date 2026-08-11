import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const token = ref(uni.getStorageSync("mall_app_token") || "");

  function setToken(value: string) {
    token.value = value;
    uni.setStorageSync("mall_app_token", value);
  }

  function clearToken() {
    token.value = "";
    uni.removeStorageSync("mall_app_token");
  }

  return { token, setToken, clearToken };
});
