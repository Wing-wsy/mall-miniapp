<template>
  <view class="page">
    <view class="card">
      <text class="brand">Mall</text>
      <text class="title">欢迎登录</text>
      <text class="desc">使用微信授权登录，同步订单与专属价格</text>
      <button class="login-btn" :loading="loading" @click="onLogin">微信一键登录</button>
      <text class="tip">首版仅微信 code 登录，手机号授权后续开放</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const loading = ref(false);

async function onLogin() {
  if (loading.value) return;
  loading.value = true;
  try {
    try {
      await userStore.loginWithWxCode();
    } catch (e) {
      // 开发者工具游客号/无 appId 时回退 mock
      await userStore.loginWithMockCode();
    }
    uni.showToast({ title: "登录成功", icon: "success" });
    setTimeout(() => {
      uni.navigateBack({
        fail: () => uni.switchTab({ url: "/pages/mine/index" }),
      });
    }, 400);
  } catch (err: any) {
    uni.showToast({ title: err?.message || "登录失败", icon: "none" });
  } finally {
    loading.value = false;
  }
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
  margin-top: 56rpx;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 30rpx;
}
.tip {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  font-size: 22rpx;
  color: #9ca3af;
}
</style>