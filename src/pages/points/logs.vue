<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="!list.length" class="state">暂无积分明细</view>
    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="card">
        <view class="left">
          <text class="name">{{ item.bizTypeText }}</text>
          <text class="time">{{ formatTime(item.createTime) }}</text>
        </view>
        <view class="right">
          <text class="qty" :class="{ add: item.changeQty > 0 }">
            {{ item.changeQty > 0 ? "+" : "" }}{{ item.changeQty }}
          </text>
          <text class="bal">余额 {{ item.afterQty }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchPointLogs, type PointLogVO } from "@/api/point";
import { assertPointsOpen } from "@/utils/featureGate";

const list = ref<PointLogVO[]>([]);
const loading = ref(false);

onShow(() => {
  load();
});

async function load() {
  if (!(await assertPointsOpen())) {
    return;
  }
  loading.value = true;
  try {
    const res = await fetchPointLogs();
    list.value = res.data || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function formatTime(t?: string) {
  if (!t) {
    return "";
  }
  return String(t).replace("T", " ").slice(0, 16);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
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
}
.left,
.right {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.right {
  align-items: flex-end;
}
.name {
  font-size: 28rpx;
  color: #111827;
  font-weight: 600;
}
.time,
.bal {
  font-size: 22rpx;
  color: #9ca3af;
}
.qty {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}
.qty.add {
  color: #ff5a3d;
}
</style>
