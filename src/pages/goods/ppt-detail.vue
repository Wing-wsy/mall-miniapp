<template>
  <view class="page" v-if="product">
    <view class="cover-box">
      <swiper
        v-if="gallery.length"
        class="cover-swiper"
        :indicator-dots="gallery.length > 1"
        indicator-color="rgba(255,255,255,0.45)"
        indicator-active-color="#ffffff"
      >
        <swiper-item v-for="(url, index) in gallery" :key="index">
          <view class="cover-wrap" @click="preview(index)">
            <image class="cover" :src="url" mode="aspectFill" />
          </view>
        </swiper-item>
      </swiper>
      <view v-else class="cover-fallback">
        <text>{{ product.name }}</text>
      </view>
    </view>

    <view class="panel">
      <view class="price-row">
        <text class="price">¥{{ channelPrice }}</text>
        <text v-if="retailPrice" class="origin">¥{{ retailPrice }}</text>
      </view>
      <text class="name">{{ product.name }}</text>
      <text v-if="product.brandName" class="brand">品牌：{{ product.brandName }}</text>
      <text class="spec">规格：{{ specText }}</text>
      <text v-if="product.subtitle" class="subtitle">{{ product.subtitle }}</text>
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

    <view class="tip">本页仅供查看该商品信息</view>
  </view>
  <view v-else class="loading">
    <text>{{ error || "加载中..." }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  fetchProductDetail,
  type ProductDetailVO,
  type ProductSellUnitVO,
  type ProductSkuVO,
} from "@/api/product";
import { prefetchImageField } from "@/utils/media";

const product = ref<ProductDetailVO | null>(null);
const error = ref("");
const lockedSkuId = ref(0);
const lockedSellUnitId = ref(0);

const detailImages = computed(() => (product.value?.detailImageUrls || []).filter(Boolean));

const lockedSku = computed<ProductSkuVO | undefined>(() => {
  const skus = (product.value?.skus || []).filter((s) => s.status == null || s.status === 1);
  if (!skus.length) return undefined;
  if (lockedSkuId.value) {
    return skus.find((s) => s.id === lockedSkuId.value) || skus[0];
  }
  return skus[0];
});

const lockedUnit = computed<ProductSellUnitVO | undefined>(() => {
  const units = (product.value?.sellUnits || []).filter((u) => u.status == null || u.status === 1);
  if (!units.length) return undefined;
  if (lockedSellUnitId.value) {
    return units.find((u) => u.id === lockedSellUnitId.value) || units[0];
  }
  return units[0];
});

const gallery = computed(() => {
  const skuCover = lockedSku.value?.coverUrl;
  const urls = (product.value?.galleryUrls || []).filter(Boolean) as string[];
  const base = urls.length ? urls : product.value?.coverUrl ? [product.value.coverUrl] : [];
  if (!skuCover) return base;
  return [skuCover, ...base.filter((u) => u !== skuCover)];
});

const specText = computed(() => {
  const attr = lockedSku.value?.attrText || lockedSku.value?.specName || "";
  const unit = lockedUnit.value?.name || "";
  if (attr && unit) return `${attr} · ${unit}`;
  return attr || unit || "默认";
});

const channelPrice = computed(() => {
  const unit = lockedUnit.value;
  if (unit?.price != null && unit.price !== "") return unit.price;
  if (lockedSku.value?.price != null) return lockedSku.value.price;
  return product.value?.price ?? 0;
});

const retailPrice = computed(() => {
  const unit = lockedUnit.value;
  const origin =
    unit?.originPrice != null && unit.originPrice !== ""
      ? unit.originPrice
      : lockedSku.value?.originPrice != null
        ? lockedSku.value.originPrice
        : product.value?.originPrice;
  if (origin == null || origin === "") return "";
  if (Number(origin) > Number(channelPrice.value)) return origin;
  return "";
});

function preview(index: number) {
  if (!gallery.value.length) return;
  uni.previewImage({ urls: gallery.value, current: gallery.value[index] });
}

function previewDetail(index: number) {
  if (!detailImages.value.length) return;
  uni.previewImage({ urls: detailImages.value, current: detailImages.value[index] });
}

onLoad(async (query) => {
  const id = Number((query && query.id) || 0);
  lockedSkuId.value = Number((query && query.skuId) || 0);
  lockedSellUnitId.value = Number((query && query.sellUnitId) || 0);
  if (!id) {
    error.value = "商品不存在";
    return;
  }
  try {
    const res = await fetchProductDetail(id);
    product.value = res.data;
    await prefetchImageField(product.value, "coverUrl");
    await prefetchImageField(product.value, "galleryUrls");
    await prefetchImageField(product.value, "detailImageUrls");
    if (lockedSku.value?.coverUrl) {
      await prefetchImageField(lockedSku.value, "coverUrl");
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "加载失败";
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 48rpx;
}

.cover-box {
  background: #fff;
}

.cover-swiper,
.cover-fallback {
  width: 100%;
  height: 750rpx;
}

.cover-wrap,
.cover {
  width: 100%;
  height: 750rpx;
}

.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffe8e2;
  color: #ff5a3d;
  font-size: 32rpx;
  padding: 40rpx;
  box-sizing: border-box;
  text-align: center;
}

.panel {
  margin: 20rpx 24rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}

.price {
  color: #ff5a3d;
  font-size: 40rpx;
  font-weight: 700;
}

.origin {
  color: #9ca3af;
  font-size: 26rpx;
  text-decoration: line-through;
}

.name {
  margin-top: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.brand,
.spec,
.subtitle {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}

.section {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

.detail {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-wrap;
}

.detail-img {
  width: 100%;
  margin: 0;
  padding: 0;
  display: block;
  vertical-align: top;
}

.tip {
  margin: 32rpx 24rpx;
  text-align: center;
  font-size: 24rpx;
  color: #9ca3af;
}

.loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 28rpx;
}
</style>
