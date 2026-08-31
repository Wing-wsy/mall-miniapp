<template>
  <view class="page" v-if="product">
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
    <view class="panel">
      <view class="price-row">
        <text class="price">{{ unitPoints }} 积分</text>
      </view>
      <text class="name">{{ product.name }}</text>
      <text v-if="product.subtitle" class="subtitle">{{ product.subtitle }}</text>
    </view>
    <view v-if="skus.length" class="panel">
      <text class="section">规格</text>
      <view class="spec-list">
        <view
          v-for="sku in skus"
          :key="sku.id"
          class="spec-chip"
          :class="{ active: selectedSkuId === sku.id, sold: (sku.sellableQty || 0) <= 0 }"
          @click="selectedSkuId = sku.id"
        >
          <text>{{ sku.specName }}</text>
        </view>
      </view>
      <text class="meta">{{ stockHint }}</text>
      <view class="qty-row">
        <text class="qty-label">数量</text>
        <view class="qty">
          <text class="btn" @click="changeQty(-1)">−</text>
          <text class="num">{{ qty }}</text>
          <text class="btn" @click="changeQty(1)">+</text>
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
      <button class="buy-btn" :disabled="!canRedeem" @click="onRedeem">
        {{ canRedeem ? `立即兑换 · ${totalPoints} 积分` : "已售罄" }}
      </button>
    </view>
  </view>
  <view v-else class="loading">
    <text>{{ error || "加载中..." }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { fetchPointProductDetail } from "@/api/point";
import type { ProductDetailVO, ProductSkuVO } from "@/api/product";
import { useUserStore } from "@/stores/user";
import { prefetchImageField } from "@/utils/media";
import { assertPointsOpen } from "@/utils/featureGate";

const userStore = useUserStore();
const product = ref<ProductDetailVO | null>(null);
const unitPoints = ref(0);
const selectedSkuId = ref<number | null>(null);
const qty = ref(1);
const error = ref("");

const gallery = computed(() => {
  const urls = (product.value?.galleryUrls || []).filter(Boolean);
  if (urls.length) {
    return urls;
  }
  return product.value?.coverUrl ? [product.value.coverUrl] : [];
});
const detailImages = computed(() => (product.value?.detailImageUrls || []).filter(Boolean));
const skus = computed<ProductSkuVO[]>(() =>
  (product.value?.skus || []).filter((sku) => sku.isBase === 1)
);
const selectedSku = computed(() => skus.value.find((sku) => sku.id === selectedSkuId.value) || skus.value[0]);
const maxQty = computed(() => selectedSku.value?.sellableQty || 0);
const canRedeem = computed(() => !!selectedSku.value && maxQty.value > 0);
const totalPoints = computed(() => unitPoints.value * qty.value);
const stockHint = computed(() => {
  const sku = selectedSku.value;
  if (!sku) {
    return "";
  }
  return `本规格可兑 ${maxQty.value}${sku.specName || ""}`;
});

watch(selectedSkuId, (_next, prev) => {
  if (prev == null) {
    return;
  }
  qty.value = 1;
});

function changeQty(delta: number) {
  const next = qty.value + delta;
  if (next < 1) {
    return;
  }
  if (next > maxQty.value) {
    uni.showToast({ title: maxQty.value <= 0 ? "已售罄" : `最多可兑 ${maxQty.value}`, icon: "none" });
    return;
  }
  qty.value = next;
}

function preview(index: number) {
  uni.previewImage({ current: gallery.value[index], urls: gallery.value });
}

function previewDetail(index: number) {
  uni.previewImage({ current: detailImages.value[index], urls: detailImages.value });
}

function onRedeem() {
  if (!product.value || !selectedSku.value) {
    return;
  }
  if (!userStore.isLogin) {
    uni.navigateTo({ url: "/pages/login/index" });
    return;
  }
  uni.navigateTo({
    url: `/pages/order/confirm?mode=points&productId=${product.value.id}&skuId=${selectedSku.value.id}&qty=${qty.value}`,
  });
}

onLoad(async (query) => {
  if (!(await assertPointsOpen())) {
    return;
  }
  const id = Number((query && query.id) || 0);
  if (!id) {
    error.value = "商品不存在";
    return;
  }
  fetchPointProductDetail(id)
    .then(async (res) => {
      product.value = res.data?.product || null;
      if (product.value) {
        await prefetchImageField(product.value, "coverUrl");
        await prefetchImageField(product.value, "galleryUrls");
        await prefetchImageField(product.value, "detailImageUrls");
      }
      unitPoints.value = res.data?.points || 0;
      selectedSkuId.value = product.value?.skus?.[0]?.id || null;
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

.cover-wrap {
  width: 100%;
  height: 750rpx;
}

.cover {
  width: 100%;
  height: 750rpx;
  display: block;
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
}
.price {
  color: #ff5a3d;
  font-size: 44rpx;
  font-weight: 700;
}
.name {
  display: block;
  margin-top: 16rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #111827;
}
.subtitle,
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
.spec-chip.sold {
  opacity: 0.45;
}
.qty-row {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.qty-label {
  font-size: 26rpx;
  color: #374151;
}
.qty {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #f3f4f6;
  text-align: center;
  line-height: 48rpx;
  color: #374151;
}
.num {
  min-width: 32rpx;
  text-align: center;
  font-size: 28rpx;
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
.buy-btn[disabled] {
  background: #d1d5db;
  color: #fff;
}
.loading {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}
</style>
