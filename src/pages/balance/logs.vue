<template>
  <view class="page">
    <view class="head">
      <text class="label">可用余额</text>
      <text class="amount">¥{{ balanceText }}</text>
    </view>
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="!list.length" class="state">暂无余额明细</view>
    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="card">
        <view class="left">
          <text class="name">{{ item.bizTypeText }}</text>
          <text class="time">{{ formatTime(item.createTime) }}</text>
          <text v-if="item.remark" class="remark">{{ item.remark }}</text>
        </view>
        <view class="right">
          <text class="qty" :class="{ add: Number(item.changeAmount) > 0 }">
            {{ Number(item.changeAmount) > 0 ? "+" : "" }}{{ money(item.changeAmount) }}
          </text>
          <text class="bal">余额 ¥{{ money(item.afterAmount) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchBalance, fetchBalanceLogs, type BalanceLogVO } from "@/api/balance";

const list = ref<BalanceLogVO[]>([]);
const balance = ref("0.00");
const loading = ref(false);
const balanceText = computed(() => money(balance.value));

onShow(() => {
  load();
});

async function load() {
  loading.value = true;
  try {
    const [bal, logs] = await Promise.all([fetchBalance(), fetchBalanceLogs()]);
    balance.value = money(bal.data?.balance);
    list.value = logs.data || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function money(v: unknown) {
  return Number(v || 0).toFixed(2);
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
.head {
  margin: 20rpx 24rpx 0;
  background: #fff;
  border-radius: 16rpx;
  padding: 36rpx 28rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.label {
  font-size: 24rpx;
  color: #9ca3af;
}
.amount {
  font-size: 48rpx;
  font-weight: 700;
  color: #111827;
}
.state {
  padding-top: 160rpx;
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
  gap: 16rpx;
}
.left,
.right {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.left {
  flex: 1;
  min-width: 0;
}
.right {
  align-items: flex-end;
  flex-shrink: 0;
}
.name {
  font-size: 28rpx;
  color: #111827;
  font-weight: 600;
}
.time,
.bal,
.remark {
  font-size: 22rpx;
  color: #9ca3af;
}
.remark {
  word-break: break-all;
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
