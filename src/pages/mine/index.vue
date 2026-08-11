<template>
  <view class="page">
    <view class="header">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
      <view class="profile">
        <view class="avatar">M</view>
        <view class="meta">
          <text class="name">Mall 用户</text>
          <text class="tip">欢迎回来，开启今日选购</text>
        </view>
      </view>
    </view>

    <view class="stats">
      <view class="stat" @click="toast('订单')">
        <text class="num">0</text>
        <text class="label">待付款</text>
      </view>
      <view class="stat" @click="toast('订单')">
        <text class="num">0</text>
        <text class="label">待收货</text>
      </view>
      <view class="stat" @click="toast('订单')">
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
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";

const statusBarHeight = ref(20);
try {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20;
} catch (e) {
  // ignore
}

const menus = [
  { name: "收货地址", action: "toast" },
  { name: "我的订单", action: "toast" },
  { name: "优惠套餐", action: "toast" },
  { name: "联系客服", action: "toast" },
  { name: "联调探测", action: "ping" },
];

function toast(msg: string) {
  uni.showToast({ title: `${msg}稍后开放`, icon: "none" });
}

function onMenu(item: { name: string; action: string }) {
  if (item.action === "ping") {
    uni.navigateTo({ url: "/pages/ping/index" });
    return;
  }
  toast(item.name);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
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
  font-size: 44rpx;
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
</style>
