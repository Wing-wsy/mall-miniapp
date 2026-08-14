<template>
  <view class="page" v-if="product">
    <swiper
      v-if="gallery.length"
      class="cover-swiper"
      :indicator-dots="gallery.length > 1"
      indicator-color="rgba(255,255,255,0.45)"
      indicator-active-color="#ffffff"
    >
      <swiper-item v-for="(url, index) in gallery" :key="index" @click="preview(index)">
        <image class="cover" :src="url" mode="aspectFit" />
      </swiper-item>
    </swiper>
    <view v-else class="cover-fallback">
      <text>{{ product.name }}</text>
    </view>
    <view class="panel">
      <view class="price-row">
        <text class="price">¥{{ displayPrice }}</text>
        <text v-if="displayOriginPrice" class="origin">¥{{ displayOriginPrice }}</text>
      </view>
      <text class="name">{{ product.name }}</text>
      <text v-if="product.subtitle" class="subtitle">{{ product.subtitle }}</text>
      <text v-if="product.categoryPath" class="meta">分类：{{ product.categoryPath }}</text>
      <text v-if="product.festivalPaths?.length" class="meta">
        节日：{{ product.festivalPaths.join("、") }}
      </text>
    </view>
    <view v-if="skus.length" class="panel">
      <text class="section">规格</text>
      <view class="spec-list">
        <view
          v-for="sku in skus"
          :key="sku.id"
          class="spec-chip"
          :class="{ active: selectedSkuId === sku.id }"
          @click="selectedSkuId = sku.id"
        >
          <text>{{ sku.specName }}</text>
        </view>
      </view>
    </view>
    <view class="panel">
      <text class="section">商品详情</text>
      <text v-if="product.detailHtml" class="detail">{{ product.detailHtml }}</text>
      <image
        v-for="(url, index) in detailImages"
        :key="index"
        class="detail-img"
        :src="url"
        mode="widthFix"
        @click="previewDetail(index)"
      />
      <text v-if="!product.detailHtml && !detailImages.length" class="detail">暂无详情</text>
    </view>
    <view class="bottom-bar">
      <button class="buy-btn" @click="toast('加购即将上线')">加入购物车</button>
    </view>
  </view>
  <view v-else class="loading">
    <text>{{ error || "加载中..." }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { fetchProductDetail, type ProductDetailVO, type ProductSkuVO } from "@/api/product";

const product = ref<ProductDetailVO | null>(null);
const selectedSkuId = ref<number | null>(null);
const error = ref("");

const gallery = computed(() => {
  const urls = (product.value?.galleryUrls || []).filter(Boolean);
  if (urls.length) {
    return urls;
  }
  return product.value?.coverUrl ? [product.value.coverUrl] : [];
});

const detailImages = computed(() => (product.value?.detailImageUrls || []).filter(Boolean));

const skus = computed<ProductSkuVO[]>(() => product.value?.skus || []);

const selectedSku = computed(() => skus.value.find((sku) => sku.id === selectedSkuId.value) || skus.value[0]);

const displayPrice = computed(() => selectedSku.value?.price ?? product.value?.price);

const displayOriginPrice = computed(() => selectedSku.value?.originPrice ?? product.value?.originPrice);

function toast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}

function preview(index: number) {
  uni.previewImage({ current: gallery.value[index], urls: gallery.value });
}

function previewDetail(index: number) {
  uni.previewImage({ current: detailImages.value[index], urls: detailImages.value });
}

onLoad((query) => {
  const id = Number((query && query.id) || 0);
  if (!id) {
    error.value = "商品不存在";
    return;
  }
  fetchProductDetail(id)
    .then((res) => {
      product.value = res.data;
      const first = res.data?.skus?.[0];
      selectedSkuId.value = first ? first.id : null;
    })
    .catch((e: unknown) => {
      error.value = e instanceof Error ? e.message : "加载失败";
    });
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 140rpx;
}

.cover-swiper,
.cover-fallback {
  width: 100%;
  height: 750rpx;
  background: #fff;
}

.cover {
  width: 100%;
  height: 750rpx;
}

.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ff5a3d;
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
  padding: 40rpx;
  box-sizing: border-box;
  text-align: center;
}

.panel {
  margin: 20rpx 24rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 20rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.price {
  color: #ff5a3d;
  font-size: 44rpx;
  font-weight: 700;
}

.origin {
  color: #c0c4cc;
  font-size: 24rpx;
  text-decoration: line-through;
}

.name {
  display: block;
  margin-top: 16rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #6b7280;
}

.meta {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #9ca3af;
}

.spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.spec-chip {
  padding: 12rpx 28rpx;
  border-radius: 12rpx;
  background: #f3f4f6;
  color: #374151;
  font-size: 26rpx;
}

.spec-chip.active {
  background: #fff1ee;
  color: #ff5a3d;
  font-weight: 700;
}

.section {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.detail {
  font-size: 28rpx;
  color: #4b5563;
  line-height: 1.7;
}

.detail-img {
  width: 100%;
  margin-top: 16rpx;
  display: block;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 28rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.buy-btn {
  background: #ff5a3d;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
}

.loading {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}
</style>
