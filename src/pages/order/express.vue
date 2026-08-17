<template>
  <view class="page" v-if="express">
    <view class="card head">
      <image v-if="express.coverUrl" class="cover" :src="express.coverUrl" mode="aspectFill" />
      <view v-else class="cover fallback">{{ (express.productName || "物").slice(0, 1) }}</view>
      <view class="info">
        <text class="ex-state">{{ express.expressStateText || "运输中" }}</text>
        <text class="name">{{ express.productName || "包裹" }}</text>
      </view>
    </view>
    <view class="card">
      <view class="row">
        <text class="label">承运商</text>
        <text>{{ express.expressCompanyName || "-" }}</text>
      </view>
      <view class="row">
        <text class="label">运单号</text>
        <view class="no-wrap">
          <text>{{ express.expressNo || "-" }}</text>
          <text v-if="express.expressNo" class="copy" @click="copyNo">复制</text>
        </view>
      </view>
    </view>
    <view class="card timeline" v-if="traces.length">
      <view v-for="(item, idx) in traces" :key="idx" class="node" :class="{ first: idx === 0 }">
        <view class="dot-col">
          <view class="dot" />
          <view v-if="idx !== traces.length - 1" class="line" />
        </view>
        <view class="body">
          <text class="ctx">{{ item.context }}</text>
          <text v-if="item.location" class="loc">{{ item.location }}</text>
          <text class="time">{{ formatTime(item.time) }}</text>
        </view>
      </view>
    </view>
    <view v-else class="state">暂无物流轨迹</view>
  </view>
  <view v-else class="state">{{ error || "加载中..." }}</view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { fetchOrderExpress, type ExpressVO } from "@/api/order";

const orderId = ref(0);
const express = ref<ExpressVO | null>(null);
const error = ref("");

const traces = computed(() => express.value?.traces || []);

onLoad((query) => {
  orderId.value = Number((query && query.id) || 0);
});

onShow(() => {
  load();
});

async function load() {
  if (!orderId.value) {
    error.value = "订单不存在";
    return;
  }
  try {
    const res = await fetchOrderExpress(orderId.value);
    express.value = res.data;
    error.value = "";
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "加载失败";
  }
}

function formatTime(t?: string) {
  if (!t) {
    return "";
  }
  return String(t).replace("T", " ").slice(0, 19);
}

function copyNo() {
  const no = express.value?.expressNo;
  if (!no) {
    return;
  }
  uni.setClipboardData({ data: no });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 40rpx;
}
.state {
  padding-top: 200rpx;
  text-align: center;
  color: #9ca3af;
}
.card {
  margin: 16rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}
.head {
  display: flex;
  gap: 16rpx;
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
.ex-state {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}
.name {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
  font-size: 26rpx;
  color: #111827;
}
.label {
  color: #6b7280;
}
.no-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.copy {
  color: #ff5a3d;
  font-size: 24rpx;
}
.timeline {
  padding-top: 8rpx;
}
.node {
  display: flex;
  gap: 16rpx;
}
.dot-col {
  width: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d1d5db;
  margin-top: 10rpx;
  flex-shrink: 0;
}
.node.first .dot {
  background: #ff5a3d;
}
.line {
  width: 2rpx;
  flex: 1;
  background: #e5e7eb;
  margin: 6rpx 0;
}
.body {
  flex: 1;
  padding-bottom: 28rpx;
}
.ctx {
  display: block;
  font-size: 26rpx;
  color: #4b5563;
  line-height: 1.5;
}
.node.first .ctx {
  color: #111827;
  font-weight: 600;
}
.loc,
.time {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
</style>
