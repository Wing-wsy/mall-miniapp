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
        <text class="price">¥{{ displayPrice }}</text>
        <text v-if="displayLinePrice" class="origin">¥{{ displayLinePrice }}</text>
      </view>
      <text class="name">{{ combo.name }}</text>
      <text v-if="combo.subtitle" class="subtitle">{{ combo.subtitle }}</text>
      <text class="meta">礼盒套装 · 仅现金购买</text>
      <text class="meta">库存可购 {{ combo.sellableQty || 0 }} 盒</text>
    </view>

    <view class="panel">
      <text class="section">盒内商品</text>
      <view
        v-for="(item, idx) in combo.items || []"
        :key="idx"
        class="comp-row"
        @click="goGoods(item)"
      >
        <image v-if="item.coverUrl" class="comp-cover" :src="item.coverUrl" mode="aspectFill" />
        <view v-else class="comp-cover fallback">{{ (item.productName || "").slice(0, 1) }}</view>
        <view class="comp-info">
          <text class="comp-name">{{ item.productName }}</text>
          <text class="comp-spec">{{ item.attrText || item.specName || "默认" }} ×{{ item.quantity }}</text>
        </view>
        <text class="comp-arrow">›</text>
      </view>
    </view>

    <view class="panel">
      <text class="section">数量</text>
      <view class="qty-row">
        <text class="qty-label">礼盒数</text>
        <view class="qty">
          <text class="btn" @click="changeQty(-1)">−</text>
          <text class="num">{{ qty }}</text>
          <text class="btn" @click="changeQty(1)">+</text>
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

    <view class="bottom-bar">
      <button class="ghost" :loading="adding" @click="onAddCart">加入购物车</button>
      <button class="primary" :loading="buying" @click="onBuy">立即购买</button>
    </view>
  </view>
  <view v-else class="empty">{{ loading ? "加载中..." : "套装不存在" }}</view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { fetchComboDetail, type ComboItemVO, type ComboVO } from "@/api/combo";
import { addCart } from "@/api/cart";
import { prefetchCoverUrls, prefetchImageField } from "@/utils/media";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const combo = ref<ComboVO | null>(null);
const loading = ref(true);
const qty = ref(1);
const adding = ref(false);
const buying = ref(false);

const displayPrice = computed(() => combo.value?.memberPrice ?? combo.value?.price ?? 0);
const displayLinePrice = computed(() => {
  const c = combo.value;
  if (!c?.originPrice) return "";
  if (Number(c.originPrice) > Number(displayPrice.value)) return c.originPrice;
  return "";
});
const gallery = computed(() => {
  const urls = (combo.value?.galleryUrls || []).filter(Boolean);
  if (urls.length) return urls;
  return combo.value?.coverUrl ? [combo.value.coverUrl] : [];
});
const detailImages = computed(() => (combo.value?.detailImageUrls || []).filter(Boolean));

function changeQty(delta: number) {
  const max = combo.value?.sellableQty || 0;
  qty.value = Math.max(1, Math.min(max || 1, qty.value + delta));
}

function goGoods(item: ComboItemVO) {
  if (!item?.productId) return;
  const skuQuery = item.skuId ? `&skuId=${item.skuId}` : "";
  uni.navigateTo({ url: `/pages/goods/detail?id=${item.productId}${skuQuery}` });
}

function preview(index: number) {
  uni.previewImage({ current: gallery.value[index], urls: gallery.value });
}

function previewDetail(index: number) {
  uni.previewImage({ current: detailImages.value[index], urls: detailImages.value });
}

function goLogin() {
  uni.navigateTo({ url: "/pages/login/index" });
}

function ensureLogin() {
  if (!userStore.isLogin) {
    goLogin();
    return false;
  }
  return true;
}

async function load(id: number) {
  loading.value = true;
  try {
    const res = await fetchComboDetail(id);
    combo.value = res.data;
    if (combo.value) {
      await prefetchImageField(combo.value, "galleryUrls");
      await prefetchImageField(combo.value, "detailImageUrls");
      await prefetchImageField(combo.value, "coverUrl");
    }
    if (combo.value?.items?.length) {
      await prefetchCoverUrls(combo.value.items);
    }
    const sellable = combo.value?.sellableQty || 0;
    if (sellable > 0) qty.value = 1;
  } catch (e: any) {
    combo.value = null;
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onAddCart() {
  if (!ensureLogin()) return;
  if (!combo.value) return;
  if ((combo.value.sellableQty || 0) < 1) {
    uni.showToast({ title: "暂无可售", icon: "none" });
    return;
  }
  adding.value = true;
  try {
    await addCart(undefined, qty.value, combo.value.id);
    uni.showToast({ title: "已加入购物车", icon: "success" });
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加购失败", icon: "none" });
  } finally {
    adding.value = false;
  }
}

async function onBuy() {
  if (!ensureLogin()) return;
  if (!combo.value) return;
  if ((combo.value.sellableQty || 0) < 1) {
    uni.showToast({ title: "暂无可售", icon: "none" });
    return;
  }
  buying.value = true;
  try {
    const res = await addCart(undefined, qty.value, combo.value.id);
    const cartId = res.data?.id;
    uni.navigateTo({ url: `/pages/order/confirm?cartIds=${cartId}` });
  } catch (e: any) {
    uni.showToast({ title: e?.message || "下单失败", icon: "none" });
  } finally {
    buying.value = false;
  }
}

onLoad((query) => {
  const id = Number(query?.id || 0);
  if (id) load(id);
  else loading.value = false;
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 140rpx;
}
.empty {
  padding: 160rpx 0;
  text-align: center;
  color: #999;
}
.cover-box {
  width: 100%;
  height: 700rpx;
  background: #fff;
}
.cover-swiper,
.cover-wrap,
.cover,
.cover-fallback {
  width: 100%;
  height: 100%;
}
.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffe8e2;
  color: #ff5a3d;
  padding: 40rpx;
  box-sizing: border-box;
  text-align: center;
}
.panel {
  margin: 20rpx 24rpx 0;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}
.price-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
}
.price {
  color: #e54d42;
  font-size: 44rpx;
  font-weight: 700;
}
.origin {
  color: #999;
  text-decoration: line-through;
  font-size: 26rpx;
}
.name {
  margin-top: 12rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: #222;
}
.subtitle,
.meta {
  display: block;
  margin-top: 8rpx;
  color: #888;
  font-size: 24rpx;
}
.section {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}
.comp-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
  align-items: center;
}
.comp-cover {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  background: #f3f3f3;
  flex-shrink: 0;
}
.comp-cover.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5a3d;
}
.comp-info {
  flex: 1;
  min-width: 0;
}
.comp-name {
  font-size: 26rpx;
  color: #333;
}
.comp-spec {
  display: block;
  margin-top: 6rpx;
  color: #999;
  font-size: 22rpx;
}
.comp-arrow {
  color: #c0c0c0;
  font-size: 36rpx;
  line-height: 1;
  padding: 0 4rpx;
  flex-shrink: 0;
}
.qty-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.qty {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.btn {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: #f3f3f3;
  text-align: center;
  line-height: 52rpx;
}
.num {
  min-width: 40rpx;
  text-align: center;
}
.detail {
  color: #555;
  font-size: 26rpx;
  line-height: 1.6;
  white-space: pre-wrap;
}
.detail-img {
  display: block;
  width: 100%;
  margin-top: 12rpx;
}
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 20rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}
.bottom-bar button {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}
.ghost {
  background: #fff3f0;
  color: #e54d42;
}
.primary {
  background: #e54d42;
  color: #fff;
}
</style>
