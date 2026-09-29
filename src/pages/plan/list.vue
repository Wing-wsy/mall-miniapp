<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="!list.length" class="empty">
      <text class="empty-title">还没有方案</text>
      <text class="empty-desc">把常买的商品按规格和数量存成方案，下次可以整单再下</text>
      <button class="primary" @click="onCreate">制作方案</button>
    </view>
    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="card" @click="goDetail(item.id)">
        <view class="card-top">
          <text class="name">{{ item.name }}</text>
          <text class="arrow">›</text>
        </view>
        <text class="meta">{{ item.productCount }} 种商品 · 共 {{ item.totalQuantity }} 件</text>
        <text class="amount">约 ¥{{ money(item.amount) }}</text>
      </view>
      <button class="primary ghost" @click="onCreate">制作方案</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { createPlan, fetchPlanList, type PlanSummaryVO } from "@/api/plan";
import { useUserStore } from "@/stores/user";
import { setPickingPlan } from "@/utils/planPicking";

const userStore = useUserStore();
const list = ref<PlanSummaryVO[]>([]);
const loading = ref(false);
const creating = ref(false);

onShow(() => {
  if (!userStore.isLogin) {
    uni.navigateTo({ url: "/pages/login/index" });
    return;
  }
  load();
});

async function load() {
  loading.value = true;
  try {
    const res = await fetchPlanList();
    list.value = res.data || [];
  } catch (e: unknown) {
    uni.showToast({ title: messageOf(e, "加载失败"), icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/plan/detail?id=${id}` });
}

function onCreate() {
  if (creating.value) return;
  uni.showModal({
    title: "制作方案",
    editable: true,
    placeholderText: "请输入方案名称",
    success: async (res) => {
      if (!res.confirm) return;
      const name = String((res as { content?: string }).content || "").trim();
      if (!name) {
        uni.showToast({ title: "请填写方案名称", icon: "none" });
        return;
      }
      creating.value = true;
      try {
        const created = await createPlan(name);
        const id = created.data?.id;
        if (!id) {
          uni.showToast({ title: "创建失败", icon: "none" });
          return;
        }
        setPickingPlan(id);
        uni.switchTab({ url: "/pages/index/index" });
      } catch (e: unknown) {
        uni.showToast({ title: messageOf(e, "创建失败"), icon: "none" });
      } finally {
        creating.value = false;
      }
    },
  });
}

function money(value?: number | string) {
  return Number(value || 0).toFixed(2);
}

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 24rpx;
  box-sizing: border-box;
}
.state,
.empty {
  padding: 160rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #9ca3af;
  font-size: 28rpx;
}
.empty-title {
  color: #1f2937;
  font-size: 34rpx;
  font-weight: 700;
}
.empty-desc {
  margin-top: 16rpx;
  text-align: center;
  line-height: 1.6;
  font-size: 26rpx;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
}
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
}
.arrow {
  color: #c0c4cc;
  font-size: 36rpx;
}
.meta {
  display: block;
  margin-top: 12rpx;
  color: #6b7280;
  font-size: 24rpx;
}
.amount {
  display: block;
  margin-top: 8rpx;
  color: #ff5a3d;
  font-size: 28rpx;
  font-weight: 700;
}
.primary {
  margin-top: 40rpx;
  width: 100%;
  background: #ff5a3d;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
}
.primary.ghost {
  background: #fff;
  color: #ff5a3d;
  border: 1px solid #ff5a3d;
}
</style>
