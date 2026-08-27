<template>
  <view class="page">
    <view class="header">
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
      <view class="profile" @click="onProfileClick">
        <view class="avatar">{{ avatarText }}</view>
        <view class="meta">
          <view class="name-row">
            <text class="name">{{ displayName }}</text>
            <text v-if="levelName" class="level-badge">{{ levelName }}</text>
          </view>
          <text v-if="!userStore.isLogin" class="tip">登录后同步订单与专属价格</text>
          <text v-if="userStore.isLogin" class="points">当前积分 {{ userStore.userInfo?.points ?? 0 }}</text>
          <text v-if="showBalance" class="points" @click.stop="goBalance">我的余额 ¥{{ balanceText }}</text>
          <text v-if="needPhone" class="bind" @click.stop="goLogin">授权手机号，解锁会员价</text>
        </view>
      </view>
    </view>

    <view class="stats">
      <view class="stat" @click="goOrders(10)">
        <text class="num">{{ counts.unpaid }}</text>
        <text class="label">待付款</text>
      </view>
      <view class="stat" @click="goOrders(20)">
        <text class="num">{{ counts.waitShip }}</text>
        <text class="label">待发货</text>
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

    <view v-if="contactVisible" class="cs-mask" @click="contactVisible = false" @touchmove.stop.prevent>
      <view class="cs-dialog" @click.stop>
        <text class="cs-title">联系客服</text>
        <view v-if="contact.phone" class="cs-row">
          <view class="cs-meta">
            <text class="cs-label">客服电话</text>
            <text class="cs-value">{{ contact.phone }}</text>
          </view>
          <text class="cs-action" @click="callPhone">拨打</text>
        </view>
        <view v-if="contact.email" class="cs-row">
          <view class="cs-meta">
            <text class="cs-label">客服邮箱</text>
            <text class="cs-value">{{ contact.email }}</text>
          </view>
          <text class="cs-action" @click="copyEmail">复制</text>
        </view>
        <button class="cs-close" @click="contactVisible = false">关闭</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import { fetchOrderCounts } from "@/api/order";
import { fetchShopContact } from "@/api/shop";
import { fetchSupplierEntry } from "@/api/supplier";

const userStore = useUserStore();
const statusBarHeight = ref(20);
try {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 20;
} catch (e) {
  // ignore
}

const showBalance = computed(() => userStore.isLogin && !!userStore.userInfo?.level);
const balanceText = computed(() => Number(userStore.userInfo?.balance ?? 0).toFixed(2));

const menus = computed(() => {
  const list = [
    { name: "收货地址", action: "address" },
    { name: "我的订单", action: "orders" },
    { name: "退款/售后", action: "aftersale" },
    { name: "我的优惠券", action: "coupons" },
    { name: "领券中心", action: "couponActivity" },
    { name: "积分商城", action: "pointsMall" },
    { name: "积分明细", action: "pointLogs" },
  ];
  if (showBalance.value) {
    list.push({ name: "我的余额", action: "balance" });
  }
  list.push({ name: "礼品兑换", action: "voucher" });
  if (showSupplier.value) {
    list.push({ name: "我的供应商", action: "supplier" });
  }
  list.push({ name: "联系客服", action: "contact" });
  return list;
});

const emptyCounts = { unpaid: 0, waitShip: 0, waitRecv: 0, done: 0 };
const counts = ref({ ...emptyCounts });
const contact = ref({ phone: "", email: "" });
const contactVisible = ref(false);
const showSupplier = ref(false);
let contactLoading = false;
const displayName = computed(() =>
  userStore.isLogin ? userStore.userInfo?.nickname || "微信用户" : "点击登录"
);
const levelName = computed(() => userStore.userInfo?.level?.name || "");
const needPhone = computed(() => userStore.isLogin && !userStore.userInfo?.phone);

const avatarText = computed(() => (userStore.isLogin ? "微" : "登"));

onShow(() => {
  loadContact();
  loadSupplierEntry();
  if (userStore.isLogin) {
    userStore.refreshProfile().catch(() => {
      userStore.clearSession();
    });
    fetchOrderCounts()
      .then((res) => {
        counts.value = {
          unpaid: res.data?.unpaid || 0,
          waitShip: res.data?.waitShip || 0,
          waitRecv: res.data?.waitRecv || 0,
          done: res.data?.done || 0,
        };
      })
      .catch(() => {
        counts.value = { ...emptyCounts };
      });
  } else {
    counts.value = { ...emptyCounts };
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

function goBalance() {
  if (!userStore.isLogin) {
    goLogin();
    return;
  }
  if (!showBalance.value) {
    return;
  }
  uni.navigateTo({ url: "/pages/balance/logs" });
}

function onMenu(item: { name: string; action: string }) {
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
  if (item.action === "aftersale") {
    if (!userStore.isLogin) {
      goLogin();
      return;
    }
    uni.navigateTo({ url: "/pages/aftersale/list" });
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
  if (item.action === "pointsMall") {
    if (!userStore.isLogin) {
      goLogin();
      return;
    }
    uni.navigateTo({ url: "/pages/points/list" });
    return;
  }
  if (item.action === "pointLogs") {
    if (!userStore.isLogin) {
      goLogin();
      return;
    }
    uni.navigateTo({ url: "/pages/points/logs" });
    return;
  }
  if (item.action === "balance") {
    goBalance();
    return;
  }
  if (item.action === "voucher") {
    if (!userStore.isLogin) {
      goLogin();
      return;
    }
    uni.navigateTo({ url: "/pages/voucher/redeem" });
    return;
  }
  if (item.action === "supplier") {
    if (!userStore.isLogin) {
      goLogin();
      return;
    }
    uni.navigateTo({ url: "/pages/supplier/list" });
    return;
  }
  if (item.action === "contact") {
    onContact();
    return;
  }
  toast(item.name);
}

async function loadSupplierEntry() {
  if (!userStore.isLogin) {
    showSupplier.value = false;
    return;
  }
  try {
    const res = await fetchSupplierEntry();
    showSupplier.value = !!res.data;
  } catch {
    showSupplier.value = false;
  }
}

async function loadContact() {
  try {
    const res = await fetchShopContact();
    contact.value = {
      phone: res.data?.phone || "",
      email: res.data?.email || "",
    };
  } catch {
    // keep last known values
  }
}

async function onContact() {
  if (contactLoading) {
    return;
  }
  let phone = contact.value.phone;
  let email = contact.value.email;
  if (!phone && !email) {
    contactLoading = true;
    try {
      const res = await fetchShopContact();
      phone = res.data?.phone || "";
      email = res.data?.email || "";
      contact.value = { phone, email };
    } catch {
      uni.showToast({ title: "客服信息加载失败", icon: "none" });
      return;
    } finally {
      contactLoading = false;
    }
  }
  if (!phone && !email) {
    uni.showToast({ title: "暂未配置客服", icon: "none" });
    return;
  }
  contactVisible.value = true;
}

function callPhone() {
  const phone = (contact.value.phone || "").trim();
  if (!phone) {
    return;
  }
  uni.makePhoneCall({ phoneNumber: phone });
}

function copyEmail() {
  const email = (contact.value.email || "").trim();
  if (!email) {
    return;
  }
  uni.setClipboardData({ data: email });
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
  flex-shrink: 0;
}
.level-badge {
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 20rpx;
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
.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.bind {
  color: #ffe7c2;
  font-size: 22rpx;
  text-decoration: underline;
}
.tip {
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
}
.points {
  color: #fff;
  font-size: 24rpx;
  margin-top: 4rpx;
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
.cs-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.cs-dialog {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 36rpx 28rpx;
}
.cs-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 28rpx;
}
.cs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}
.cs-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.cs-label {
  font-size: 22rpx;
  color: #9ca3af;
}
.cs-value {
  font-size: 28rpx;
  color: #1f2937;
  word-break: break-all;
}
.cs-action {
  flex-shrink: 0;
  color: #ff5a3d;
  font-size: 26rpx;
}
.cs-close {
  margin-top: 28rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 38rpx;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 28rpx;
}
</style>