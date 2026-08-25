<template>
  <view class="page">
    <view v-if="detail" class="content">
      <view class="card head">
        <image v-if="detail.coverUrl" class="cover" :src="detail.coverUrl" mode="aspectFill" />
        <view v-else class="cover fallback">{{ (detail.productName || "物").slice(0, 1) }}</view>
        <view class="info">
          <view class="ex-state">{{ detail.expressStateText || "运输中" }}</view>
          <view class="pname">{{ detail.productName || "包裹" }}</view>
        </view>
      </view>
      <view class="card">
        <view class="row">
          <text class="label">承运商</text>
          <text class="value">{{ detail.expressCompanyName || "-" }}</text>
        </view>
        <view class="row">
          <text class="label">运单号</text>
          <view class="no-wrap">
            <text class="value">{{ detail.expressNo || "-" }}</text>
            <text v-if="detail.expressNo" class="copy" @click="copyNo">复制</text>
          </view>
        </view>
      </view>
      <view v-if="traces.length" class="card timeline">
        <view v-for="(item, idx) in traces" :key="idx" class="node" :class="{ first: idx === 0 }">
          <view class="dot-col">
            <view class="dot" />
            <view v-if="idx !== traces.length - 1" class="rail" />
          </view>
          <view class="body">
            <view class="ctx">{{ item.context }}</view>
            <view v-if="item.location" class="loc">{{ item.location }}</view>
            <view class="time">{{ formatTime(item.time) }}</view>
          </view>
        </view>
      </view>
      <view v-else class="empty">暂无物流轨迹</view>
    </view>
    <view v-else class="empty">{{ error || "加载中..." }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { request } from "@/utils/request";
import { prefetchImageField } from "@/utils/media";

interface ExpressTraceItem {
  time?: string;
  context?: string;
  location?: string;
}

interface ExpressDetail {
  expressCompanyName?: string;
  expressNo?: string;
  expressStateText?: string;
  coverUrl?: string;
  productName?: string;
  traces?: ExpressTraceItem[];
}

const orderId = ref(0);
const detail = ref<ExpressDetail | null>(null);
const error = ref("");

const traces = computed(() => detail.value?.traces || []);

onLoad((query) => {
  orderId.value = Number((query && query.id) || 0);
  load();
});

onShow(() => {
  if (orderId.value) {
    load();
  }
});

async function load() {
  if (!orderId.value) {
    error.value = "订单不存在";
    return;
  }
  try {
    const res = await request<ExpressDetail>({
      url: `/api/app/order/${orderId.value}/express`,
      method: "GET",
    });
    detail.value = res.data;
    if (detail.value) {
      await prefetchImageField(detail.value, "coverUrl");
    }
    error.value = "";
  } catch (e: unknown) {
    detail.value = null;
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
  const no = detail.value?.expressNo;
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
.empty {
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
  flex-direction: row;
  align-items: center;
}
.cover {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
  margin-right: 16rpx;
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
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}
.pname {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
  font-size: 26rpx;
  color: #111827;
}
.label {
  flex-shrink: 0;
  margin-right: 24rpx;
  color: #6b7280;
}
.value {
  flex: 1;
  min-width: 0;
  text-align: right;
  word-break: break-all;
}
.no-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}
.copy {
  margin-left: 12rpx;
  flex-shrink: 0;
  color: #ff5a3d;
  font-size: 24rpx;
}
.timeline {
  padding-top: 8rpx;
}
.node {
  display: flex;
  flex-direction: row;
  align-items: stretch;
}
.dot-col {
  width: 24rpx;
  margin-right: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
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
.rail {
  width: 4rpx;
  flex: 1;
  background: #e5e7eb;
  margin: 6rpx 0;
}
.body {
  flex: 1;
  min-width: 0;
  padding-bottom: 28rpx;
}
.ctx {
  font-size: 26rpx;
  color: #4b5563;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;
}
.node.first .ctx {
  color: #111827;
  font-weight: 600;
}
.loc,
.time {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9ca3af;
  word-break: break-all;
}
</style>
