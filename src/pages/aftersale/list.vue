<template>
  <view class="page">
    <view class="tabs">
      <text
        v-for="tab in tabs"
        :key="tab.key"
        class="tab"
        :class="{ on: current === tab.key }"
        @click="current = tab.key"
      >
        {{ tab.label }}
      </text>
    </view>
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="!filtered.length" class="state">暂无售后单</view>
    <view v-else class="list">
      <view v-for="row in filtered" :key="row.id" class="card" @click="goDetail(row.id)">
        <view class="head">
          <text class="no">{{ row.afterSaleNo }}</text>
          <text class="st">{{ row.statusText }}</text>
        </view>
        <text class="meta">{{ row.typeText }} · {{ row.orderNo }}</text>
        <text class="amt">{{ amountText(row) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchAfterSaleList, type AfterSaleVO } from "@/api/aftersale";

const tabs = [
  { key: "all", label: "全部" },
  { key: "open", label: "处理中" },
  { key: "done", label: "已结束" },
];

const current = ref("all");
const list = ref<AfterSaleVO[]>([]);
const loading = ref(false);

const filtered = computed(() => {
  if (current.value === "open") {
    return list.value.filter((row) => [10, 20, 21, 30].includes(row.status));
  }
  if (current.value === "done") {
    return list.value.filter((row) => [40, 50, 60].includes(row.status));
  }
  return list.value;
});

onShow(() => {
  load();
});

async function load() {
  loading.value = true;
  try {
    const res = await fetchAfterSaleList();
    list.value = res.data || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function amountText(row: AfterSaleVO) {
  if (row.orderType === 1) {
    return `${row.refundPoints || 0} 积分`;
  }
  if (row.orderType === 2) {
    return "兑换券";
  }
  return `¥${Number(row.refundAmount || 0).toFixed(2)}`;
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/aftersale/detail?id=${id}` });
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
.head {
  display: flex;
  justify-content: space-between;
}
.no {
  font-size: 24rpx;
  color: #6b7280;
}
.st {
  color: #ff5a3d;
  font-size: 24rpx;
}
.meta {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #111827;
}
.amt {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  font-weight: 700;
}
</style>
