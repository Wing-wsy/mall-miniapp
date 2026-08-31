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
    <view v-else-if="!list.length" class="state">暂无优惠券</view>
    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="card" :class="{ dim: item.status !== 0 && item.status !== 1 }">
        <view class="left">
          <text class="benefit">{{ item.benefitText }}</text>
          <text class="name">{{ item.name }}</text>
        </view>
        <view class="right">
          <text class="st">{{ item.statusText }}</text>
          <text class="exp">{{ expireText(item.expireTime) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchMyCoupons, type CouponVO } from "@/api/coupon";
import { assertCouponOpen } from "@/utils/featureGate";

const tabs = [
  { label: "未使用", status: 0 as number | undefined },
  { label: "已使用", status: 2 },
  { label: "已过期", status: 3 },
];

const current = ref<number | undefined>(0);
const list = ref<CouponVO[]>([]);
const loading = ref(false);

onShow(() => {
  load();
});

function switchTab(status?: number) {
  current.value = status;
  load();
}

async function load() {
  if (!(await assertCouponOpen())) {
    return;
  }
  loading.value = true;
  try {
    const res = await fetchMyCoupons(current.value);
    list.value = res.data || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function expireText(t?: string) {
  if (!t) {
    return "";
  }
  return `${String(t).replace("T", " ").slice(0, 16)} 到期`;
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
  padding: 0 12rpx;
}
.tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
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
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
  border-left: 8rpx solid #ff5a3d;
}
.card.dim {
  opacity: 0.55;
  border-left-color: #d1d5db;
}
.benefit {
  font-size: 36rpx;
  font-weight: 700;
  color: #ff5a3d;
}
.name {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #374151;
}
.right {
  text-align: right;
}
.st {
  font-size: 24rpx;
  color: #6b7280;
}
.exp {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
</style>
