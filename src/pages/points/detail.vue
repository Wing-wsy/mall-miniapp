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
    <view v-if="attrs.length || skus.length" class="panel">
      <view v-for="attr in attrs" :key="attr.attrId" class="attr-block">
        <text class="section">{{ attr.attrName }}</text>
        <view class="spec-list">
          <view
            v-for="val in attr.values || []"
            :key="val.id"
            class="spec-chip"
            :class="{ active: selectedValueByAttr[attr.attrId] === val.id }"
            @click="selectedValueByAttr[attr.attrId] = val.id"
          >
            <text>{{ val.valueName }}</text>
          </view>
        </view>
      </view>
      <view v-if="!attrs.length && skus.length > 1" class="attr-block">
        <text class="section">规格</text>
        <view class="spec-list">
          <view
            v-for="sku in skus"
            :key="sku.id"
            class="spec-chip"
            :class="{ active: selectedSkuId === sku.id, sold: skuStock(sku) <= 0 }"
            @click="selectedSkuId = sku.id"
          >
            <text>{{ sku.attrText || sku.specName || "默认" }}</text>
          </view>
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
import { computed, reactive, ref, watch } from "vue";
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
const selectedValueByAttr = reactive<Record<number, number>>({});
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
const attrs = computed(() => product.value?.attrs || []);
const skus = computed<ProductSkuVO[]>(() =>
  (product.value?.skus || []).filter((sku) => sku.status == null || sku.status === 1),
);

function sameValueIds(a: number[] = [], b: number[] = []) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

function skuStock(sku?: ProductSkuVO) {
  if (!sku) return 0;
  return sku.stock ?? sku.sellableQty ?? 0;
}

const selectedSku = computed(() => {
  if (!skus.value.length) return undefined;
  if (attrs.value.length) {
    const ids = attrs.value
      .map((attr) => selectedValueByAttr[attr.attrId])
      .filter((id): id is number => id != null);
    if (ids.length !== attrs.value.length) return undefined;
    return skus.value.find((sku) => sameValueIds(sku.attrValueIds || [], ids));
  }
  return skus.value.find((sku) => sku.id === selectedSkuId.value) || skus.value[0];
});

const maxQty = computed(() => skuStock(selectedSku.value));
const canRedeem = computed(() => !!selectedSku.value && maxQty.value > 0);
const totalPoints = computed(() => unitPoints.value * qty.value);
const stockHint = computed(() => {
  const sku = selectedSku.value;
  if (!sku) {
    return attrs.value.length ? "请选择完整属性" : "";
  }
  const label = sku.attrText || sku.specName || "";
  return `本规格可兑 ${maxQty.value}${label}`;
});

watch(
  () => selectedSku.value?.id,
  (_next, prev) => {
    if (prev == null) return;
    qty.value = 1;
  },
);

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

function initSelection() {
  for (const attr of attrs.value) {
    if (attr.values?.[0]) {
      selectedValueByAttr[attr.attrId] = attr.values[0].id;
    }
  }
  selectedSkuId.value = skus.value[0]?.id || null;
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
      initSelection();
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
.attr-block {
  margin-bottom: 16rpx;
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
