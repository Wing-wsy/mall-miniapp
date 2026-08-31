<template>
  <view class="page">
    <view class="hero">
      <text class="title">礼品兑换</text>
      <text class="sub">刮开实体兑换券涂层，输入验证码即可兑换固定礼盒</text>
    </view>
    <view class="card">
      <text class="label">验证码</text>
      <input
        v-model="code"
        class="input"
        maxlength="16"
        placeholder="请输入12位验证码"
        confirm-type="done"
        @confirm="onPreview"
      />
      <button class="btn" :disabled="submitting || !code.trim()" @click="onPreview">下一步</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import { previewVoucher } from "@/api/voucher";
import { fetchShopContact } from "@/api/shop";

const userStore = useUserStore();
const code = ref("");
const submitting = ref(false);

onShow(() => {
  assertVoucherOpen();
});

async function assertVoucherOpen() {
  try {
    const res = await fetchShopContact();
    if (res.data?.voucherEnabled) {
      return;
    }
  } catch {
    // treat as closed when config unavailable
  }
  uni.showToast({ title: "兑换功能暂未开放", icon: "none" });
  setTimeout(() => {
    uni.navigateBack({ fail: () => uni.switchTab({ url: "/pages/mine/index" }) });
  }, 400);
}

async function onPreview() {
  const raw = code.value.trim();
  if (!raw) {
    uni.showToast({ title: "请输入验证码", icon: "none" });
    return;
  }
  if (!userStore.isLogin) {
    uni.navigateTo({ url: "/pages/login/index" });
    return;
  }
  submitting.value = true;
  try {
    await previewVoucher({ code: raw });
    uni.setStorageSync("mall_voucher_code", raw);
    uni.navigateTo({ url: "/pages/order/confirm?mode=voucher" });
  } catch (e: any) {
    uni.showToast({ title: e?.message || "验证失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 32rpx 24rpx;
}
.hero {
  padding: 24rpx 8rpx 32rpx;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}
.sub {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx 28rpx;
}
.label {
  font-size: 26rpx;
  color: #374151;
}
.input {
  margin-top: 16rpx;
  height: 88rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  background: #f9fafb;
  font-size: 32rpx;
  letter-spacing: 4rpx;
}
.btn {
  margin: 32rpx 0 0;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 30rpx;
}
.btn[disabled] {
  opacity: 0.5;
}
</style>
