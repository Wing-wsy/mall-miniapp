<template>
  <view class="page">
    <view class="tabs">
      <text
        v-for="tab in tabs"
        :key="tab.status ?? 'all'"
        class="tab"
        :class="{ on: current === tab.status }"
        @click="switchTab(tab.status)"
      >
        {{ tab.label }}
      </text>
    </view>
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="!list.length" class="state">暂无订单</view>
    <view v-else class="list">
      <view v-for="order in list" :key="order.id" class="card" @click="goDetail(order.id)">
        <view class="head">
          <text class="no">{{ order.orderNo }}</text>
          <text class="st">{{ order.statusText }}</text>
        </view>
        <view v-for="item in order.items" :key="item.id" class="goods">
          <image v-if="item.coverUrl" class="cover" :src="item.coverUrl" mode="aspectFill" />
          <view v-else class="cover fallback">{{ (item.productName || "").slice(0, 1) }}</view>
          <view class="info">
            <text class="name">{{ item.productName }}</text>
            <text class="spec">{{ item.specName }} x{{ item.quantity }}</text>
          </view>
          <text class="price">{{ priceText(order, item) }}</text>
        </view>
        <view class="foot">
          <text>{{ totalText(order) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { fetchOrderList, type OrderVO } from "@/api/order";

const tabs = [
  { label: "全部", status: undefined as number | undefined },
  { label: "待付款", status: 10 },
  { label: "待发货", status: 20 },
  { label: "待收货", status: 30 },
  { label: "已完成", status: 40 },
];

const current = ref<number | undefined>(undefined);
const list = ref<OrderVO[]>([]);
const loading = ref(false);

onLoad((query) => {
  if (query && query.status) {
    current.value = Number(query.status);
  }
});

onShow(() => {
  load();
});

function switchTab(status?: number) {
  current.value = status;
  load();
}

async function load() {
  loading.value = true;
  try {
    const res = await fetchOrderList(current.value);
    list.value = res.data || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/order/detail?id=${id}` });
}

function isPointsOrder(order: OrderVO) {
  return order.orderType === 1;
}

function isVoucherOrder(order: OrderVO) {
  return order.orderType === 2;
}

function priceText(order: OrderVO, item: OrderVO["items"][number]) {
  if (isPointsOrder(order)) {
    return `${item.points || 0} 积分`;
  }
  if (isVoucherOrder(order)) {
    return "兑换券";
  }
  return `¥${money(item.amount)}`;
}

function totalText(order: OrderVO) {
  if (isPointsOrder(order)) {
    return `合计 ${order.pointsAmount || 0} 积分`;
  }
  if (isVoucherOrder(order)) {
    return "合计 兑换券";
  }
  return `合计 ¥${money(order.payAmount)}`;
}

function money(v: unknown) {
  return Number(v || 0).toFixed(2);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
}
.tabs {
  display: flex;
  background: #fff;
  padding: 0 8rpx;
}
.tab {
  flex: 1;
  text-align: center;
  height: 80rpx;
  line-height: 80rpx;
  font-size: 26rpx;
  color: #6b7280;
}
.tab.on {
  color: #ff5a3d;
  font-weight: 700;
}
.state {
  padding-top: 200rpx;
  text-align: center;
  color: #9ca3af;
}
.list {
  padding: 20rpx 24rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.head,
.foot {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #6b7280;
}
.st {
  color: #ff5a3d;
}
.goods {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 0;
  align-items: center;
}
.cover {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}
.fallback {
  background: #ffe8e2;
  color: #ff5a3d;
  display: flex;
  align-items: center;
  justify-content: center;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 26rpx;
  color: #111827;
}
.spec {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
.price {
  font-size: 26rpx;
  color: #111827;
}
.foot {
  border-top: 1rpx solid #f3f4f6;
  padding-top: 16rpx;
  justify-content: flex-end;
  font-weight: 700;
  color: #111827;
}
</style>
