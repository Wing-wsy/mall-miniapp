<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="!list.length" class="state">暂无可领优惠券</view>
    <view v-else class="list">
      <view v-for="item in list" :key="item.templateId" class="card">
        <view class="info">
          <text class="benefit">{{ item.benefitText }}</text>
          <text class="name">{{ item.name }}</text>
          <text v-if="item.claimEnd" class="meta">领取截止 {{ formatTime(item.claimEnd) }}</text>
          <text class="meta">领取后 {{ item.validDays }} 天内有效</text>
        </view>
        <button
          class="btn"
          :disabled="!item.canClaim"
          @click="onClaim(item)"
        >
          {{ item.claimed ? "已领取" : item.soldOut ? "已抢光" : "立即领取" }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import { claimCoupon, fetchCouponActivities, type CouponActivityVO } from "@/api/coupon";

const userStore = useUserStore();
const list = ref<CouponActivityVO[]>([]);
const loading = ref(false);

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
    const res = await fetchCouponActivities();
    list.value = res.data || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onClaim(item: CouponActivityVO) {
  if (!item.canClaim) {
    return;
  }
  try {
    await claimCoupon(item.templateId);
    uni.showToast({ title: "领取成功", icon: "none" });
    await load();
  } catch (e: any) {
    uni.showToast({ title: e?.message || "领取失败", icon: "none" });
  }
}

function formatTime(v?: string) {
  if (!v) {
    return "";
  }
  return String(v).replace("T", " ").slice(0, 16);
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
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 16rpx;
}
.info {
  flex: 1;
}
.benefit {
  font-size: 36rpx;
  font-weight: 700;
  color: #ff5a3d;
}
.name {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  color: #111827;
}
.meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
.btn {
  margin: 0;
  width: 160rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 32rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 24rpx;
}
.btn[disabled] {
  background: #e5e7eb;
  color: #9ca3af;
}
</style>
