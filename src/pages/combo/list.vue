<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!list.length" class="empty">暂无组合套装</view>
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
            <text class="price">¥{{ displayPrice(item) }}</text>
            <text v-if="item.itemCount" class="meta">{{ item.itemCount }}件装</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchComboList, type ComboVO } from "@/api/combo";
import { prefetchCoverUrls } from "@/utils/media";

const list = ref<ComboVO[]>([]);
const loading = ref(false);

function displayPrice(item: ComboVO) {
  return item.memberPrice ?? item.price;
}

async function load() {
  loading.value = true;
  try {
    const res = await fetchComboList(1, 50);
    list.value = res.data?.records || [];
    await prefetchCoverUrls(list.value);
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/combo/detail?id=${id}` });
}

onShow(load);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 24rpx;
  box-sizing: border-box;
}
.empty {
  padding: 120rpx 0;
  text-align: center;
  color: #999;
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
  width: 100%;
  height: 340rpx;
  overflow: hidden;
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
  font-size: 28rpx;
  color: #222;
  line-height: 1.4;
  height: 78rpx;
  overflow: hidden;
}
.price-row {
  margin-top: 8rpx;
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}
.price {
  color: #e54d42;
  font-size: 32rpx;
  font-weight: 700;
}
.meta {
  color: #999;
  font-size: 22rpx;
}
</style>
