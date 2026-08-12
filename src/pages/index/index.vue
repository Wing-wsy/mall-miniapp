<template>
  <view class="page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav">
      <text class="brand">Mall</text>
      <view class="search" @click="toast('搜索稍后开放')">
        <text class="search-icon">⌕</text>
        <text class="search-placeholder">搜索商品、品牌</text>
      </view>
    </view>

    <scroll-view scroll-y class="scroll" :style="{ height: scrollHeight }">
      <swiper
        class="banner-swiper"
        circular
        autoplay
        indicator-dots
        indicator-color="rgba(255,255,255,0.45)"
        indicator-active-color="#ffffff"
      >
        <swiper-item v-for="item in banners" :key="item.id" @click="goDetail(item.productId)">
          <view v-if="item.imageUrl" class="banner-img-wrap">
            <image class="banner-img" :src="item.imageUrl" mode="aspectFill" />
          </view>
          <view v-else class="banner-fallback">
            <text class="banner-tag">今日精选</text>
            <text class="banner-title">{{ item.title || "品质好物 用心挑选" }}</text>
            <text class="banner-sub">点击查看商品详情</text>
          </view>
        </swiper-item>
      </swiper>

      <view class="entry-grid">
        <view
          v-for="item in entries"
          :key="item.name"
          class="entry"
          @click="onEntry(item)"
        >
          <view class="entry-icon" :style="{ background: item.bg }">
            <text>{{ item.emoji }}</text>
          </view>
          <text class="entry-name">{{ item.name }}</text>
        </view>
      </view>

      <view class="section-head">
        <text class="section-title">热卖推荐</text>
        <text class="section-more" @click="goCategory">全部</text>
      </view>

      <view class="goods-grid">
        <view
          v-for="item in goods"
          :key="item.id"
          class="goods-card"
          @click="goDetail(item.id)"
        >
          <view class="goods-cover" :style="{ background: item.color }">
            <text class="cover-text">{{ item.short }}</text>
          </view>
          <view class="goods-body">
            <text class="goods-name">{{ item.name }}</text>
            <view class="price-row">
              <text class="price">¥{{ item.price }}</text>
              <text class="origin">¥{{ item.origin }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="safe-bottom" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchBannerList, type BannerVO } from "@/api/banner";

const statusBarHeight = ref(20);
const scrollHeight = ref("100vh");
const banners = ref<BannerVO[]>([]);

const entries = [
  { name: "分类", emoji: "▦", bg: "#FFE8E2", action: "category" },
  { name: "新品", emoji: "✦", bg: "#FFF1D6", action: "toast" },
  { name: "套餐", emoji: "▣", bg: "#E8F5E9", action: "toast" },
  { name: "优惠", emoji: "%", bg: "#E3F2FD", action: "toast" },
];

const goods = [
  { id: 1, name: "有机燕麦片 1kg", short: "燕麦", price: "39.9", origin: "59.0", color: "#F3D6C8" },
  { id: 2, name: "冷榨橄榄油 500ml", short: "橄榄油", price: "68.0", origin: "88.0", color: "#D9E8C8" },
  { id: 3, name: "精选坚果礼盒", short: "坚果", price: "128.0", origin: "168.0", color: "#E8D5B7" },
  { id: 4, name: "高山红茶 150g", short: "红茶", price: "56.0", origin: "79.0", color: "#E2C4B0" },
];

try {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 20;
  scrollHeight.value = `calc(100vh - ${statusBarHeight.value + 56}px)`;
} catch (e) {
  // ignore
}

function toast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}

function goCategory() {
  uni.switchTab({ url: "/pages/category/index" });
}

function goDetail(id: number) {
  if (!id) {
    toast("商品不存在");
    return;
  }
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` });
}

function onEntry(item: { action: string; name: string }) {
  if (item.action === "category") {
    goCategory();
    return;
  }
  toast(`${item.name}即将上线`);
}

async function loadBanners() {
  try {
    const res = await fetchBannerList();
    banners.value = res.data?.length
      ? res.data
      : [{ id: 0, title: "品质好物 用心挑选", imageUrl: "", productId: 1 }];
  } catch (e) {
    banners.value = [{ id: 0, title: "品质好物 用心挑选", imageUrl: "", productId: 1 }];
  }
}

onShow(() => {
  loadBanners();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
}

.nav {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 12rpx 28rpx 20rpx;
  background: #fff;
}

.brand {
  font-size: 40rpx;
  font-weight: 800;
  color: #ff5a3d;
  letter-spacing: 1rpx;
}

.search {
  flex: 1;
  height: 68rpx;
  border-radius: 34rpx;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  gap: 10rpx;
}

.search-icon {
  color: #9ca3af;
  font-size: 28rpx;
}

.search-placeholder {
  color: #9ca3af;
  font-size: 26rpx;
}

.scroll {
  box-sizing: border-box;
}

.banner-swiper {
  margin: 24rpx 28rpx 0;
  height: 280rpx;
  border-radius: 24rpx;
  overflow: hidden;
}

.banner-img-wrap,
.banner-fallback {
  width: 100%;
  height: 280rpx;
}

.banner-img {
  width: 100%;
  height: 280rpx;
}

.banner-fallback {
  padding: 48rpx 40rpx;
  box-sizing: border-box;
  background: #ff5a3d;
  color: #fff;
}

.banner-tag {
  display: inline-block;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.22);
  margin-bottom: 16rpx;
}

.banner-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}

.banner-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.entry-grid {
  margin: 28rpx;
  padding: 28rpx 12rpx;
  background: #fff;
  border-radius: 24rpx;
  display: flex;
}

.entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.entry-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #ff5a3d;
}

.entry-name {
  font-size: 24rpx;
  color: #4b5563;
}

.section-head {
  margin: 8rpx 28rpx 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.section-more {
  font-size: 24rpx;
  color: #9ca3af;
}

.goods-grid {
  margin: 0 20rpx;
  display: flex;
  flex-wrap: wrap;
}

.goods-card {
  width: calc(50% - 16rpx);
  margin: 8rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.goods-cover {
  height: 260rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-text {
  font-size: 36rpx;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.28);
}

.goods-body {
  padding: 20rpx;
}

.goods-name {
  font-size: 26rpx;
  color: #1f2937;
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
  font-size: 32rpx;
  font-weight: 700;
}

.origin {
  color: #c0c4cc;
  font-size: 22rpx;
  text-decoration: line-through;
}

.safe-bottom {
  height: 40rpx;
}
</style>
