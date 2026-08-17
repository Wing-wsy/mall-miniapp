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
      <view class="stat" @click="goOrders(10)">
        <text class="num">{{ counts.unpaid }}</text>
        <text class="label">待付款</text>
      </view>
      <view class="stat" @click="goOrders(30)">
        <text class="num">{{ counts.waitRecv }}</text>
        <text class="label">待收货</text>
      </view>
      <view class="stat" @click="goOrders(40)">
        <text class="num">{{ counts.done }}</text>
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
import { fetchOrderCounts } from "@/api/order";

const userStore = useUserStore();
const statusBarHeight = ref(20);
try {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20;
} catch (e) {
  // ignore
}

const menus = [
  { name: "收货地址", action: "address" },
  { name: "我的订单", action: "orders" },
  { name: "我的优惠券", action: "coupons" },
  { name: "领券中心", action: "couponActivity" },
  { name: "联系客服", action: "toast" },
  { name: "联调探测", action: "ping" },
];

const counts = ref({ unpaid: 0, waitRecv: 0, done: 0 });
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
    fetchOrderCounts()
      .then((res) => {
        counts.value = {
          unpaid: res.data?.unpaid || 0,
          waitRecv: res.data?.waitRecv || 0,
          done: res.data?.done || 0,
        };
      })
      .catch(() => {
        counts.value = { unpaid: 0, waitRecv: 0, done: 0 };
      });
  } else {
    counts.value = { unpaid: 0, waitRecv: 0, done: 0 };
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

function goOrders(status?: number) {
  if (!userStore.isLogin) {
    goLogin();
    return;
  }
  const q = status != null ? `?status=${status}` : "";
  uni.navigateTo({ url: `/pages/order/list${q}` });
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
  if (item.action === "orders") {
    goOrders();
    return;
  }
  if (item.action === "coupons") {
    if (!userStore.isLogin) {
      goLogin();
      return;
    }
    uni.navigateTo({ url: "/pages/coupon/list" });
    return;
  }
  if (item.action === "couponActivity") {
    if (!userStore.isLogin) {
      goLogin();
      return;
    }
    uni.navigateTo({ url: "/pages/coupon/activity" });
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