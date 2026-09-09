<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!list.length" class="empty">暂无收藏商品</view>
    <view v-else class="goods-grid">
      <view v-for="item in list" :key="item.id" class="goods-card" @click="goDetail(item.id)">
        <view class="cover-wrap">
          <image v-if="item.coverUrl" class="cover-img" :src="item.coverUrl" mode="aspectFill" />
          <view v-else class="cover-fallback">
            <text>{{ (item.name || "").slice(0, 1) }}</text>
          </view>
          <text v-if="publicShipFrom(item)" class="ship-badge" :class="{ self: item.selfOperated }">
            {{ publicShipFrom(item) }}
          </text>
        </view>
        <view class="body">
          <text class="name">{{ item.name }}</text>
          <view class="price-row">
            <text class="price">¥{{ salePrice(item) }}</text>
            <text v-if="item.multiSpec" class="from">起</text>
            <text v-if="linePrice(item)" class="origin">¥{{ linePrice(item) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchFavoriteList } from "@/api/favorite";
import type { ProductCardVO } from "@/api/product";
import { linePrice, salePrice } from "@/utils/price";
import { publicShipFrom } from "@/utils/supplier";
import { prefetchImageField } from "@/utils/media";
import { useUserStore } from "@/stores/user";
import { guardMaintenanceNavigate, syncMaintenanceFromContact } from "@/utils/maintenance";
import { fetchShopContact } from "@/api/shop";

const userStore = useUserStore();
const list = ref<ProductCardVO[]>([]);
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
    const res = await fetchFavoriteList();
    list.value = res.data || [];
    await Promise.all(list.value.map((item) => prefetchImageField(item, "coverUrl")));
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function goDetail(id: number) {
  try {
    const res = await fetchShopContact();
    syncMaintenanceFromContact(res.data);
  } catch {
    // ignore
  }
  if (!guardMaintenanceNavigate()) {
    return;
  }
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 24rpx;
  box-sizing: border-box;
}

.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.goods-card {
  width: 48.5%;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.cover-wrap {
  position: relative;
  width: 100%;
  height: 340rpx;
  overflow: hidden;
}

.ship-badge {
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  padding: 4rpx 10rpx;
  font-size: 20rpx;
  color: #fff;
  background: rgba(17, 24, 39, 0.55);
  border-radius: 8rpx;
}

.ship-badge.self {
  background: #ff5a3d;
}

.cover-img,
.cover-fallback {
  width: 100%;
  height: 100%;
  display: block;
}

.cover-fallback {
  background: #ffe8e2;
  color: #ff5a3d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-weight: 700;
}

.body {
  padding: 16rpx 18rpx 20rpx;
}

.name {
  font-size: 26rpx;
  color: #111827;
  line-height: 1.4;
  height: 72rpx;
  overflow: hidden;
}

.price-row {
  margin-top: 8rpx;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10rpx;
}

.price {
  color: #ff5a3d;
  font-size: 30rpx;
  font-weight: 700;
}

.origin {
  color: #9ca3af;
  font-size: 22rpx;
  text-decoration: line-through;
}

.from {
  color: #ff5a3d;
  font-size: 22rpx;
}

.empty {
  padding: 120rpx 40rpx;
  text-align: center;
  color: #9ca3af;
}
</style>
