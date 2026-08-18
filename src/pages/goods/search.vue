<template>
  <view class="page">
    <view class="search-bar">
      <view class="search">
        <text class="search-icon">⌕</text>
        <input
          class="search-input"
          v-model="keyword"
          :placeholder="placeholder"
          confirm-type="search"
          :focus="true"
          maxlength="32"
          @confirm="onConfirm"
        />
      </view>
      <text class="search-btn" @click="onSearch">搜索</text>
    </view>

    <scroll-view
      scroll-y
      class="scroll"
      :style="{ height: scrollHeight }"
      lower-threshold="120"
      @scrolltolower="onScrollToLower"
    >
      <view v-if="!searched" class="empty">输入礼品名称、品牌或型号搜索</view>
      <view v-else-if="loading && !list.length" class="empty">搜索中...</view>
      <view v-else-if="!list.length" class="empty">没有找到相关商品</view>
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
      <view v-if="list.length" class="feed-status">
        <text v-if="loadingMore">加载中...</text>
        <text v-else-if="hasMore">上拉加载更多</text>
        <text v-else>没有更多了</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { searchProducts, type ProductCardVO } from "@/api/product";
import { useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();
const keyword = ref("");
const queried = ref("");
const searched = ref(false);
const list = ref<ProductCardVO[]>([]);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(false);
const page = ref(0);
const PAGE_SIZE = 10;
let seq = 0;
const scrollHeight = ref("70vh");

const placeholder = computed(
  () => themeStore.searchPlaceholder || "请搜索你想要的礼品名称、品牌或型号"
);

try {
  const info = uni.getSystemInfoSync();
  scrollHeight.value = `${Math.max((info.windowHeight || 600) - 56, 320)}px`;
} catch {
  // ignore
}

function onConfirm(e: { detail?: { value?: string } }) {
  if (e.detail?.value != null) {
    keyword.value = e.detail.value;
  }
  onSearch();
}

function onSearch() {
  const kw = keyword.value.trim();
  if (!kw) {
    uni.showToast({ title: "请输入关键词", icon: "none" });
    return;
  }
  queried.value = kw;
  searched.value = true;
  load(true);
}

function onScrollToLower() {
  load(false);
}

async function load(reset: boolean) {
  const kw = queried.value;
  if (!kw) {
    return;
  }
  if (reset) {
    seq += 1;
    page.value = 0;
    hasMore.value = true;
    loading.value = true;
    loadingMore.value = false;
  } else if (loading.value || loadingMore.value || !hasMore.value) {
    return;
  } else {
    loadingMore.value = true;
  }
  const current = seq;
  const nextPage = page.value + 1;
  try {
    const res = await searchProducts(kw, nextPage, PAGE_SIZE);
    if (current !== seq) {
      return;
    }
    const chunk = res.data?.list || [];
    list.value = reset ? chunk : list.value.concat(chunk);
    page.value = nextPage;
    hasMore.value = !!res.data?.hasMore;
  } catch (e: any) {
    if (current !== seq) {
      return;
    }
    if (reset) {
      list.value = [];
      hasMore.value = false;
    }
    uni.showToast({ title: e?.message || "搜索失败", icon: "none" });
  } finally {
    if (current === seq) {
      loading.value = false;
      loadingMore.value = false;
    }
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` });
}

onLoad((query) => {
  const kw = query?.keyword ? decodeURIComponent(String(query.keyword)) : "";
  if (kw) {
    keyword.value = kw;
    queried.value = kw;
    searched.value = true;
    load(true);
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx;
  background: #fff;
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

.search-input {
  flex: 1;
  height: 68rpx;
  font-size: 26rpx;
}

.search-btn {
  flex-shrink: 0;
  color: #ff5a3d;
  font-size: 28rpx;
  font-weight: 600;
}

.scroll {
  box-sizing: border-box;
}

.empty {
  padding: 160rpx 40rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 26rpx;
}

.goods-grid {
  padding: 24rpx 20rpx 0;
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

.feed-status {
  padding: 8rpx 0 40rpx;
  text-align: center;
  font-size: 24rpx;
  color: #9ca3af;
}
</style>
