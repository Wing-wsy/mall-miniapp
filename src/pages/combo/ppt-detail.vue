<template>
  <view class="page" v-if="combo">
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
        <text>{{ combo.name }}</text>
      </view>
    </view>

    <view class="panel">
      <view class="price-row">
        <text class="price">¥{{ channelPrice }}</text>
        <text v-if="retailPrice" class="origin">¥{{ retailPrice }}</text>
      </view>
      <text class="name">{{ combo.name }}</text>
      <text class="spec">规格：礼盒</text>
      <text v-if="combo.subtitle" class="subtitle">{{ combo.subtitle }}</text>
    </view>

    <view class="panel">
      <text class="section">盒内商品</text>
      <view v-for="(item, idx) in combo.items || []" :key="idx" class="comp-row">
        <image v-if="item.coverUrl" class="comp-cover" :src="item.coverUrl" mode="aspectFill" />
        <view v-else class="comp-cover fallback">{{ (item.productName || "").slice(0, 1) }}</view>
        <view class="comp-info">
          <text class="comp-name">{{ item.productName }}</text>
          <text class="comp-spec">{{ item.attrText || item.specName || "默认" }} ×{{ item.quantity }}</text>
        </view>
      </view>
    </view>

    <view class="panel">
      <text class="section">套装详情</text>
      <text v-if="combo.detailHtml" class="detail">{{ combo.detailHtml }}</text>
      <image
        v-for="(url, index) in detailImages"
        :key="index"
        class="detail-img"
        :src="url"
        mode="widthFix"
        @click="previewDetail(index)"
      />
      <text v-if="!combo.detailHtml && !detailImages.length" class="detail">暂无详情</text>
    </view>

    <view class="tip">本页仅供查看该套装信息</view>
  </view>
  <view v-else class="loading">
    <text>{{ loading ? "加载中..." : error || "套装不存在" }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { fetchComboDetail, type ComboVO } from "@/api/combo";
import { prefetchCoverUrls, prefetchImageField } from "@/utils/media";

const combo = ref<ComboVO | null>(null);
const loading = ref(true);
const error = ref("");

const gallery = computed(() => {
  const urls = (combo.value?.galleryUrls || []).filter(Boolean);
  if (urls.length) return urls;
  return combo.value?.coverUrl ? [combo.value.coverUrl] : [];
});
const detailImages = computed(() => (combo.value?.detailImageUrls || []).filter(Boolean));
const channelPrice = computed(() => combo.value?.price ?? 0);
const retailPrice = computed(() => {
  const origin = combo.value?.originPrice;
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
  if (!id) {
    loading.value = false;
    error.value = "套装不存在";
    return;
  }
  try {
    const res = await fetchComboDetail(id);
    combo.value = res.data;
    await prefetchImageField(combo.value, "coverUrl");
    await prefetchImageField(combo.value, "galleryUrls");
    await prefetchImageField(combo.value, "detailImageUrls");
    if (combo.value?.items?.length) {
      await prefetchCoverUrls(combo.value.items);
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "加载失败";
  } finally {
    loading.value = false;
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

.comp-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 20rpx;
}

.comp-cover {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.comp-cover.fallback {
  background: #ffe8e2;
  color: #ff5a3d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.comp-info {
  flex: 1;
  min-width: 0;
}

.comp-name {
  font-size: 26rpx;
  color: #111827;
}

.comp-spec {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #9ca3af;
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
  margin-top: 16rpx;
  border-radius: 12rpx;
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
