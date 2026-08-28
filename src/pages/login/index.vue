<template>
  <view class="page">
    <view class="card">
      <text class="brand">Mall</text>
      <text class="title">欢迎登录</text>
      <text class="desc">{{ descText }}</text>

      <button v-if="step === 'login'" class="login-btn" :loading="loading" @click="onLogin">微信一键登录</button>

      <button
        v-else
        class="login-btn"
        :loading="loading"
        open-type="getPhoneNumber"
        @getphonenumber="onGetPhoneNumber"
      >
        授权手机号
      </button>

      <view class="mock">
        <input v-model="mockPhone" class="mock-input" type="number" maxlength="11" placeholder="本地 mock 手机号，如 13900001111" />
        <button class="ghost-btn" :loading="loading" @click="onMockEnter">用测试手机号登录</button>
      </view>
      <text v-if="step === 'phone' && !forcePhone" class="skip" @click="goBack">暂不授权，稍后再说</text>
      <text class="tip">开发者工具里「微信一键登录」会进已有账号。模拟普通用户请填一个未在会员名单里的新手机号。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const loading = ref(false);
const step = ref<"login" | "phone">("login");
const mockPhone = ref("");
const redirect = ref("");
const forcePhone = ref(false);

const descText = computed(() =>
  step.value === "phone"
    ? "授权手机号后可匹配会员等级与折扣"
    : "使用微信授权登录，同步订单与专属价格"
);

onLoad((query) => {
  const raw = String((query && query.redirect) || "");
  try {
    redirect.value = raw ? decodeURIComponent(raw) : "";
  } catch {
    redirect.value = raw;
  }
  forcePhone.value = String((query && query.forcePhone) || "") === "1";
  if (userStore.isLogin && !userStore.userInfo?.phone) {
    step.value = "phone";
  } else if (userStore.isLogin && userStore.userInfo?.phone && redirect.value) {
    goBack();
  }
});

if (userStore.isLogin && !userStore.userInfo?.phone) {
  step.value = "phone";
}

async function onLogin() {
  if (loading.value) return;
  loading.value = true;
  try {
    try {
      await userStore.loginWithWxCode();
    } catch (e) {
      await userStore.loginWithMockCode();
    }
    if (userStore.userInfo?.phone) {
      uni.showToast({ title: "登录成功", icon: "success" });
      goBack();
      return;
    }
    step.value = "phone";
  } catch (err: any) {
    uni.showToast({ title: err?.message || "登录失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onGetPhoneNumber(e: any) {
  const detail = e?.detail || {};
  if (!detail.code) {
    uni.showToast({ title: detail.errMsg || "未授权手机号", icon: "none" });
    return;
  }
  await doBind({ code: detail.code });
}

async function onMockEnter() {
  const phone = mockPhone.value.trim();
  if (!/^1\d{10}$/.test(phone)) {
    uni.showToast({ title: "请填写11位测试手机号", icon: "none" });
    return;
  }
  if (loading.value) return;
  loading.value = true;
  try {
    if (step.value === "phone" && userStore.isLogin) {
      await userStore.bindWxPhone({ phone });
    } else {
      await userStore.logout();
      await userStore.loginWithMockCode();
      await userStore.bindWxPhone({ phone });
    }
    uni.showToast({ title: userStore.userInfo?.level ? "已匹配会员等级" : "登录成功", icon: "success" });
    goBack();
  } catch (err: any) {
    uni.showToast({ title: err?.message || "登录失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function doBind(payload: { code?: string; phone?: string }) {
  if (loading.value) return;
  loading.value = true;
  try {
    await userStore.bindWxPhone(payload);
    uni.showToast({ title: userStore.userInfo?.level ? "已匹配会员等级" : "登录成功", icon: "success" });
    goBack();
  } catch (err: any) {
    uni.showToast({ title: err?.message || "绑定失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goBack() {
  setTimeout(() => {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      uni.navigateBack({
        fail: goRedirectOrHome,
      });
      return;
    }
    goRedirectOrHome();
  }, 400);
}

function goRedirectOrHome() {
  const target = redirect.value;
  if (target && target.startsWith("/pages/") && !target.startsWith("/pages/login/")) {
    uni.redirectTo({
      url: target,
      fail: () => uni.switchTab({ url: "/pages/index/index" }),
    });
    return;
  }
  uni.switchTab({ url: "/pages/mine/index" });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}
.card {
  width: 100%;
  background: #fff;
  border-radius: 28rpx;
  padding: 64rpx 48rpx;
  box-sizing: border-box;
}
.brand {
  display: block;
  color: #ff5a3d;
  font-size: 44rpx;
  font-weight: 800;
}
.title {
  display: block;
  margin-top: 24rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}
.desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}
.login-btn {
  margin-top: 48rpx;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 48rpx;
  font-size: 30rpx;
}
.mock {
  margin-top: 24rpx;
}
.mock-input {
  height: 80rpx;
  padding: 0 24rpx;
  background: #f3f4f6;
  border-radius: 16rpx;
  font-size: 28rpx;
}
.ghost-btn {
  margin-top: 16rpx;
  background: #fff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 48rpx;
  font-size: 28rpx;
}
.skip {
  display: block;
  margin-top: 28rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 24rpx;
}
.tip {
  display: block;
  margin-top: 28rpx;
  font-size: 22rpx;
  color: #9ca3af;
  line-height: 1.5;
}
</style>
