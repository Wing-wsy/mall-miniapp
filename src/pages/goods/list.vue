<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!list.length" class="empty">暂无商品</view>
    <view v-else class="goods-grid">
      <view v-for="item in list" :key="item.id" class="goods-card" @click="goDetail(item.id)">
        <view class="cover-wrap">
          <image v-if="item.coverUrl" class="cover-img" :src="item.coverUrl" mode="aspectFill" />
          <view v-else class="cover-fallback">
            <text>{{ (item.name || "").slice(0, 1) }}</text>
          </view>
        </view>
        <view class="body">
          <text class="name">{{ item.name }}</text>
          <view class="price-row">
            <text class="price">¥{{ item.price }}</text>
            <text v-if="item.multiSpec" class="from">起</text>
            <text v-if="item.originPrice" class="origin">¥{{ item.originPrice }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  fetchProductListByCategory,
  fetchProductListByFestival,
  type ProductCardVO,
} from "@/api/product";

const list = ref<ProductCardVO[]>([]);
const loading = ref(false);

async function load(options: Record<string, string | undefined>) {
  const title = options.title ? decodeURIComponent(options.title) : "商品列表";
  uni.setNavigationBarTitle({ title });
  loading.value = true;
  try {
    if (options.categoryId) {
      const res = await fetchProductListByCategory(Number(options.categoryId));
      list.value = res.data || [];
    } else if (options.festivalId) {
      const res = await fetchProductListByFestival(Number(options.festivalId));
      list.value = res.data || [];
    } else {
      list.value = [];
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` });
}

onLoad((query) => load((query || {}) as Record<string, string | undefined>));
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
  height: 0;
  padding-bottom: 100%;
  overflow: hidden;
}

.cover-img,
.cover-fallback {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
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
