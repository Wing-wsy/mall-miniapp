<template>
  <view class="page">
    <view v-if="cartItems.length" class="list">
      <view v-for="item in cartItems" :key="item.id" class="card">
        <view class="cover" :style="{ background: item.color }">
          <text>{{ item.short }}</text>
        </view>
        <view class="info">
          <text class="name">{{ item.name }}</text>
          <view class="bottom">
            <text class="price">¥{{ item.price }}</text>
            <view class="qty">
              <text class="btn" @click="changeQty(item, -1)">−</text>
              <text class="num">{{ item.qty }}</text>
              <text class="btn" @click="changeQty(item, 1)">+</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <view class="empty-icon">🛒</view>
      <text class="empty-title">购物车还是空的</text>
      <text class="empty-desc">去首页挑几件心仪的商品吧</text>
      <button class="go-btn" @click="goHome">去逛逛</button>
    </view>

    <view v-if="cartItems.length" class="footer">
      <view class="total">
        <text class="label">合计</text>
        <text class="amount">¥{{ total }}</text>
      </view>
      <button class="checkout" @click="toast('下单功能稍后开放')">去结算</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type CartItem = {
  id: number;
  name: string;
  short: string;
  price: number;
  qty: number;
  color: string;
};

const cartItems = ref<CartItem[]>([
  { id: 1, name: "有机燕麦片 1kg", short: "燕麦", price: 39.9, qty: 1, color: "#F3D6C8" },
  { id: 2, name: "高山红茶 150g", short: "红茶", price: 56, qty: 2, color: "#E2C4B0" },
]);

const total = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2)
);

function changeQty(item: CartItem, delta: number) {
  const next = item.qty + delta;
  if (next <= 0) {
    cartItems.value = cartItems.value.filter((x) => x.id !== item.id);
    return;
  }
  item.qty = next;
}

function goHome() {
  uni.switchTab({ url: "/pages/index/index" });
}

function toast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 140rpx;
}

.list {
  padding: 24rpx;
}

.card {
  display: flex;
  gap: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.cover {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.28);
  font-weight: 700;
  flex-shrink: 0;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.name {
  font-size: 28rpx;
  color: #1f2937;
  line-height: 1.4;
}

.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  color: #ff5a3d;
  font-size: 32rpx;
  font-weight: 700;
}

.qty {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #f3f4f6;
  text-align: center;
  line-height: 48rpx;
  color: #374151;
}

.num {
  min-width: 32rpx;
  text-align: center;
  font-size: 28rpx;
}

.empty {
  padding-top: 220rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  font-size: 72rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.empty-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #9ca3af;
}

.go-btn {
  margin-top: 40rpx;
  width: 280rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 28rpx;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 110rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.total {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.label {
  color: #6b7280;
  font-size: 26rpx;
}

.amount {
  color: #ff5a3d;
  font-size: 36rpx;
  font-weight: 700;
}

.checkout {
  margin: 0;
  width: 220rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 38rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 28rpx;
}
</style>
