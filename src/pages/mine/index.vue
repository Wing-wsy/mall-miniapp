<template>
  <view class="page">
    <view class="header">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
      <view class="profile" @click="onProfileClick">
        <view class="avatar">{{ avatarText }}</view>
        <view class="meta">
          <text class="name">{{ displayName }}</text>
          <text class="tip">{{ displayTip }}</text>
        </view>
      </view>
    </view>

    <view class="stats">
      <view class="stat" @click="requireLoginThenToast('订单')">
        <text class="num">0</text>
        <text class="label">待付款</text>
      </view>
      <view class="stat" @click="requireLoginThenToast('订单')">
        <text class="num">0</text>
        <text class="label">待收货</text>
      </view>
      <view class="stat" @click="requireLoginThenToast('订单')">
        <text class="num">0</text>
        <text class="label">已完成</text>
      </view>
    </view>

    <view class="menu">
      <view
        v-for="item in menus"
        :key="item.name"
        class="menu-item"
        @click="onMenu(item)"
      >
        <text class="menu-name">{{ item.name }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <button v-if="userStore.isLogin" class="logout-btn" @click="onLogout">退出登录</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const statusBarHeight = ref(20);
try {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20;
} catch (e) {
  // ignore
}

const menus = [
  { name: "收货地址", action: "address" },
  { name: "我的订单", action: "needLogin" },
  { name: "优惠套餐", action: "needLogin" },
  { name: "联系客服", action: "toast" },
  { name: "联调探测", action: "ping" },
];

const displayName = computed(() =>
  userStore.isLogin ? userStore.userInfo?.nickname || "微信用户" : "点击登录"
);
const displayTip = computed(() =>
  userStore.isLogin ? "欢迎回来，开启今日选购" : "登录后同步订单与专属价格"
);
const avatarText = computed(() => (userStore.isLogin ? "微" : "登"));

onShow(() => {
  if (userStore.isLogin) {
    userStore.refreshProfile().catch(() => {
      userStore.clearSession();
    });
  }
});

function goLogin() {
  uni.navigateTo({ url: "/pages/login/index" });
}

function onProfileClick() {
  if (!userStore.isLogin) {
    goLogin();
  }
}

function toast(msg: string) {
  uni.showToast({ title: `${msg}稍后开放`, icon: "none" });
}

function requireLoginThenToast(msg: string) {
  if (!userStore.isLogin) {
    goLogin();
    return;
  }
  toast(msg);
}

function onMenu(item: { name: string; action: string }) {
  if (item.action === "ping") {
    uni.navigateTo({ url: "/pages/ping/index" });
    return;
  }
  if (item.action === "address") {
    if (!userStore.isLogin) {
      goLogin();
      return;
    }
    uni.navigateTo({ url: "/pages/address/list" });
    return;
  }
  if (item.action === "needLogin") {
    requireLoginThenToast(item.name);
    return;
  }
  toast(item.name);
}

async function onLogout() {
  await userStore.logout();
  uni.showToast({ title: "已退出", icon: "none" });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 48rpx;
}
.header {
  background: #ff5a3d;
  padding-bottom: 48rpx;
}
.profile {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx 36rpx 0;
}
.avatar {
  width: 110rpx;
  height: 110rpx;
  border-radius: 55rpx;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 700;
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.name {
  color: #fff;
  font-size: 34rpx;
  font-weight: 700;
}
.tip {
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
}
.stats {
  margin: -28rpx 28rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  padding: 28rpx 0;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.num {
  font-size: 34rpx;
  font-weight: 700;
  color: #111827;
}
.label {
  font-size: 24rpx;
  color: #9ca3af;
}
.menu {
  margin: 0 28rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}
.menu-item {
  height: 100rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #f3f4f6;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-name {
  font-size: 28rpx;
  color: #1f2937;
}
.arrow {
  color: #d1d5db;
  font-size: 36rpx;
}
.logout-btn {
  margin: 40rpx 28rpx 0;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  background: #fff;
  color: #ff5a3d;
  font-size: 28rpx;
}
</style>