<template>
  <view class="page" v-if="product">
    <view class="cover-box">
      <swiper
        v-if="gallery.length"
        :key="gallery[0]"
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
      <product-share-btn :product-id="product.id" :visible="canShare" />
    </view>
    <view class="panel">
      <view class="price-row">
        <text class="price">¥{{ displayPrice }}</text>
        <text v-if="displayLinePrice" class="origin">¥{{ displayLinePrice }}</text>
      </view>
      <text class="name">{{ product.name }}</text>
      <view v-if="canShare" class="share-row">
        <button class="share-chip" hover-class="none" open-type="share" :data-pid="String(product.id)">
          分享给好友
        </button>
        <text class="share-chip ghost" @click="onCopyShare">复制链接</text>
      </view>
      <text v-if="publicShipFrom(product)" class="ship-tag" :class="{ self: product.selfOperated }">
        {{ publicShipFrom(product) }}
      </text>
      <text v-if="product.subtitle" class="subtitle">{{ product.subtitle }}</text>
      <text v-if="product.categoryPath" class="meta">分类：{{ product.categoryPath }}</text>
      <text v-if="product.festivalPaths?.length" class="meta">
        节日：{{ product.festivalPaths.join("、") }}
      </text>
    </view>

    <view v-if="attrs.length || sellUnits.length || skus.length" class="panel">
      <view v-for="attr in attrs" :key="attr.attrId" class="attr-block">
        <text class="section">{{ attr.attrName }}</text>
        <view class="spec-list">
          <view
            v-for="val in attr.values || []"
            :key="val.id"
            class="spec-chip"
            :class="{ active: selectedValueByAttr[attr.attrId] === val.id }"
            @click="selectAttrValue(attr.attrId, val.id)"
          >
            <text>{{ val.valueName }}</text>
          </view>
        </view>
      </view>

      <view v-if="sellUnits.length" class="attr-block">
        <text class="section">售卖单位</text>
        <view class="spec-list">
          <view
            v-for="unit in sellUnits"
            :key="unit.id"
            class="spec-chip"
            :class="{ active: selectedSellUnitId === unit.id, sold: unitSellable(unit) <= 0 }"
            @click="selectedSellUnitId = unit.id"
          >
            <text>{{ unit.name }}</text>
          </view>
        </view>
        <text v-if="convertHint" class="meta">{{ convertHint }}</text>
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
      <button class="cart-btn" :disabled="adding || buying || !canAdd" @click="onAddCart">
        {{ canAdd ? "加入购物车" : "已售罄" }}
      </button>
      <button class="buy-btn" :disabled="adding || buying || !canAdd" @click="onBuyNow">
        立即购买
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
import {
  fetchProductDetail,
  type ProductDetailVO,
  type ProductSellUnitVO,
  type ProductSkuVO,
} from "@/api/product";
import { addCart, fetchCartCount, fetchCartList, updateCartQty, type CartItemVO } from "@/api/cart";
import { ApiError } from "@/utils/request";
import { useUserStore } from "@/stores/user";
import { linePrice, salePrice } from "@/utils/price";
import { publicShipFrom } from "@/utils/supplier";
import { prefetchImageField } from "@/utils/media";
import ProductShareBtn from "@/components/product-share-btn.vue";
import { useProductShare } from "@/composables/useProductShare";
import { createShareLink } from "@/api/share";

const userStore = useUserStore();
const { canShare } = useProductShare();
const product = ref<ProductDetailVO | null>(null);
const selectedValueByAttr = reactive<Record<number, number>>({});
const selectedSellUnitId = ref<number | null>(null);
const qty = ref(1);
const adding = ref(false);
const buying = ref(false);
const error = ref("");
const cartItems = ref<CartItemVO[]>([]);
const fromCartId = ref(0);
const fromCartSkuId = ref(0);
const fromCartSellUnitId = ref(0);

const detailImages = computed(() => (product.value?.detailImageUrls || []).filter(Boolean));

const attrs = computed(() => product.value?.attrs || []);

const skus = computed<ProductSkuVO[]>(() =>
  (product.value?.skus || []).filter((sku) => sku.status == null || sku.status === 1),
);

const sellUnits = computed<ProductSellUnitVO[]>(() =>
  (product.value?.sellUnits || []).filter((u) => u.status == null || u.status === 1),
);

function sameValueIds(a: number[] = [], b: number[] = []) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

const selectedSku = computed(() => {
  if (!skus.value.length) return undefined;
  if (!attrs.value.length) return skus.value[0];
  const ids = attrs.value
    .map((attr) => selectedValueByAttr[attr.attrId])
    .filter((id): id is number => id != null);
  if (ids.length !== attrs.value.length) return undefined;
  return skus.value.find((sku) => sameValueIds(sku.attrValueIds || [], ids));
});

/** 有 SKU 图时置顶，切换颜色同步换主图 */
const gallery = computed(() => {
  const skuCover = selectedSku.value?.coverUrl;
  const urls = (product.value?.galleryUrls || []).filter(Boolean) as string[];
  const base = urls.length ? urls : product.value?.coverUrl ? [product.value.coverUrl] : [];
  if (!skuCover) {
    return base;
  }
  return [skuCover, ...base.filter((u) => u !== skuCover)];
});

const selectedUnit = computed(
  () => sellUnits.value.find((u) => u.id === selectedSellUnitId.value) || sellUnits.value[0],
);

function convertOf(unit?: ProductSellUnitVO) {
  return unit?.convertQty && unit.convertQty > 0 ? unit.convertQty : 1;
}

const priceSource = computed(() => {
  const sku = selectedSku.value;
  const unit = selectedUnit.value;
  if (!sku) return product.value;
  if (unit && unit.price != null && unit.price !== "") {
    return {
      price: unit.price,
      originPrice: unit.originPrice ?? undefined,
      memberPrice: unit.memberPrice,
      sharePrice: unit.sharePrice,
    };
  }
  const convert = convertOf(unit);
  if (!unit || unit.isBase === 1 || convert === 1) {
    return sku;
  }
  const mul = (v?: number | string | null) =>
    v == null || v === "" ? v : Number((Number(v) * convert).toFixed(2));
  return {
    price: mul(sku.price) as number,
    originPrice: mul(sku.originPrice) as number | undefined,
    memberPrice: mul(sku.memberPrice),
    sharePrice: mul(sku.sharePrice),
  };
});

const displayPrice = computed(() => salePrice(priceSource.value));

const displayLinePrice = computed(() => linePrice(priceSource.value));

function unitSellable(unit: ProductSellUnitVO) {
  const sku = selectedSku.value;
  if (!sku) return 0;
  const convertQty = convertOf(unit);
  const skuStock = sku.stock ?? 0;
  const occupiedOther = cartItems.value.reduce((sum, item) => {
    if (item.skuId !== sku.id) return sum;
    if (item.sellUnitId === unit.id) return sum;
    const itemConvert = item.convertQty && item.convertQty > 0 ? item.convertQty : 1;
    return sum + (item.quantity || 0) * itemConvert;
  }, 0);
  return Math.floor(Math.max(0, skuStock - occupiedOther) / convertQty);
}

const existingQty = computed(() => {
  const skuId = selectedSku.value?.id;
  const unitId = selectedUnit.value?.id;
  if (!skuId) return 0;
  return (
    cartItems.value.find(
      (item) => item.skuId === skuId && (unitId == null || item.sellUnitId == null || item.sellUnitId === unitId),
    )?.quantity || 0
  );
});

const remainingSellable = computed(() => {
  const unit = selectedUnit.value;
  if (!unit) {
    const sku = selectedSku.value;
    return sku?.stock ?? sku?.sellableQty ?? 0;
  }
  return unitSellable(unit);
});

const editingCart = computed(() => {
  if (!(fromCartId.value > 0 && selectedSku.value?.id === fromCartSkuId.value)) {
    return false;
  }
  if (!fromCartSellUnitId.value) return true;
  return selectedUnit.value?.id === fromCartSellUnitId.value;
});

const maxQty = computed(() => {
  if (editingCart.value) {
    return remainingSellable.value;
  }
  return Math.max(0, remainingSellable.value - existingQty.value);
});

const canAdd = computed(() => {
  if (!selectedSku.value || remainingSellable.value <= 0) return false;
  if (sellUnits.value.length > 0 && !selectedUnit.value) return false;
  return true;
});

const convertHint = computed(() => {
  const unit = selectedUnit.value;
  const baseName = product.value?.baseSpecName || sellUnits.value.find((u) => u.isBase === 1)?.name;
  if (!unit || unit.isBase === 1 || !unit.convertQty || unit.convertQty <= 1 || !baseName) {
    return "";
  }
  return `1${unit.name} = ${unit.convertQty}${baseName}`;
});

const stockHint = computed(() => {
  const sku = selectedSku.value;
  const unit = selectedUnit.value;
  if (!sku || !unit) {
    return sku ? `库存 ${sku.stock ?? 0}` : "";
  }
  const unitName = unit.name || "";
  let text = `本规格库存 ${sku.stock ?? 0}，可购 ${remainingSellable.value}${unitName}`;
  if (!editingCart.value && existingQty.value > 0) {
    text += `，还可加购 ${maxQty.value}${unitName}`;
  }
  return text;
});

watch([() => selectedSku.value?.id, selectedSellUnitId], (_next, prev) => {
  if (prev == null || (Array.isArray(prev) && prev[0] == null && prev[1] == null)) {
    return;
  }
  qty.value = 1;
});

function selectAttrValue(attrId: number, valueId: number) {
  selectedValueByAttr[attrId] = valueId;
}

function changeQty(delta: number) {
  const next = qty.value + delta;
  if (next < 1) {
    return;
  }
  if (next > maxQty.value) {
    toast(maxQty.value <= 0 ? "已售罄" : `最多可购 ${maxQty.value}`);
    return;
  }
  qty.value = next;
}

async function loadCartOccupancy() {
  if (!userStore.isLogin || !product.value?.id) {
    cartItems.value = [];
    return;
  }
  try {
    const res = await fetchCartList();
    const productId = product.value.id;
    cartItems.value = (res.data?.items || []).filter((item) => item.productId === productId);
  } catch {
    cartItems.value = [];
  }
}

function goLogin() {
  uni.navigateTo({ url: "/pages/login/index" });
}

async function refreshBadge() {
  try {
    const res = await fetchCartCount();
    const n = res.data?.totalQuantity || 0;
    if (n > 0) {
      uni.setTabBarBadge({ index: 2, text: n > 99 ? "99+" : String(n) });
    } else {
      uni.removeTabBarBadge({ index: 2 });
    }
  } catch {
    uni.removeTabBarBadge({ index: 2 });
  }
}

function toast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}

async function ensureReady() {
  if (!selectedSku.value) {
    toast(attrs.value.length ? "请选择完整属性" : "请选择规格");
    return false;
  }
  if (sellUnits.value.length > 0 && !selectedUnit.value) {
    toast("请选择售卖单位");
    return false;
  }
  if (!canAdd.value) {
    toast("已售罄");
    return false;
  }
  if (!userStore.isLogin) {
    goLogin();
    return false;
  }
  if (qty.value > maxQty.value) {
    toast(maxQty.value <= 0 ? "购物车已达可购上限" : `最多可购 ${maxQty.value}`);
    return false;
  }
  return true;
}

async function onAddCart() {
  if (!(await ensureReady()) || !selectedSku.value) {
    return;
  }
  adding.value = true;
  try {
    if (editingCart.value) {
      await updateCartQty(fromCartId.value, qty.value);
      toast("已更新购物车");
    } else {
      await addCart(selectedSku.value.id, qty.value, undefined, selectedUnit.value?.id);
      toast("已加入购物车");
    }
    await loadCartOccupancy();
    await refreshBadge();
  } catch (e: unknown) {
    if (e instanceof ApiError && e.code === 401) {
      goLogin();
      return;
    }
    toast(e instanceof Error ? e.message : "加购失败");
  } finally {
    adding.value = false;
  }
}

async function onBuyNow() {
  if (!(await ensureReady()) || !selectedSku.value) {
    return;
  }
  buying.value = true;
  try {
    const unitId = selectedUnit.value?.id;
    const existing = cartItems.value.find(
      (item) =>
        item.skuId === selectedSku.value?.id &&
        (unitId == null || item.sellUnitId == null || item.sellUnitId === unitId),
    );
    let cartId = existing?.id || (editingCart.value ? fromCartId.value : 0);
    if (cartId) {
      await updateCartQty(cartId, qty.value);
    } else {
      const res = await addCart(selectedSku.value.id, qty.value, undefined, unitId);
      cartId = res.data?.id || 0;
    }
    if (!cartId) {
      toast("下单失败");
      return;
    }
    await loadCartOccupancy();
    await refreshBadge();
    uni.navigateTo({ url: `/pages/order/confirm?cartIds=${cartId}` });
  } catch (e: unknown) {
    if (e instanceof ApiError && e.code === 401) {
      goLogin();
      return;
    }
    toast(e instanceof Error ? e.message : "下单失败");
  } finally {
    buying.value = false;
  }
}

function preview(index: number) {
  uni.previewImage({ current: gallery.value[index], urls: gallery.value });
}

function previewDetail(index: number) {
  uni.previewImage({ current: detailImages.value[index], urls: detailImages.value });
}

async function onCopyShare() {
  if (!product.value?.id) {
    return;
  }
  try {
    const res = await createShareLink(product.value.id);
    const text = res.data?.urlLink || res.data?.miniPath || "";
    if (!text) {
      uni.showToast({ title: "暂无链接", icon: "none" });
      return;
    }
    uni.setClipboardData({
      data: text,
      success: () => uni.showToast({ title: "已复制", icon: "success" }),
    });
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : "复制失败", icon: "none" });
  }
}

function initSelection(skuId: number, sellUnitId: number) {
  const matchSku = skuId ? skus.value.find((sku) => sku.id === skuId) : null;
  const sku = matchSku || skus.value[0];
  if (sku?.attrValueIds?.length && attrs.value.length) {
    for (const attr of attrs.value) {
      const hit = (attr.values || []).find((v) => sku.attrValueIds!.includes(v.id));
      if (hit) {
        selectedValueByAttr[attr.attrId] = hit.id;
      } else if (attr.values?.[0]) {
        selectedValueByAttr[attr.attrId] = attr.values[0].id;
      }
    }
  } else {
    for (const attr of attrs.value) {
      if (attr.values?.[0]) {
        selectedValueByAttr[attr.attrId] = attr.values[0].id;
      }
    }
  }
  const matchUnit = sellUnitId ? sellUnits.value.find((u) => u.id === sellUnitId) : null;
  const preferred =
    matchUnit ||
    sellUnits.value.find((u) => u.isBase === 1) ||
    sellUnits.value[0];
  selectedSellUnitId.value = preferred?.id ?? null;
}

onLoad((query) => {
  const id = Number((query && query.id) || 0);
  const skuId = Number((query && query.skuId) || 0);
  const sellUnitId = Number((query && query.sellUnitId) || 0);
  const queryQty = Number((query && query.qty) || 0);
  fromCartId.value = Number((query && query.cartId) || 0);
  fromCartSkuId.value = skuId;
  fromCartSellUnitId.value = sellUnitId;
  if (!id) {
    error.value = "商品不存在";
    return;
  }
  fetchProductDetail(id)
    .then(async (res) => {
      product.value = res.data;
      if (product.value) {
        await prefetchImageField(product.value, "coverUrl");
        await prefetchImageField(product.value, "galleryUrls");
        await prefetchImageField(product.value, "detailImageUrls");
        for (const sku of product.value.skus || []) {
          await prefetchImageField(sku as Record<string, unknown>, "coverUrl");
        }
      }
      initSelection(skuId, sellUnitId);
      await loadCartOccupancy();
      if (queryQty > 0) {
        const max = maxQty.value || queryQty;
        qty.value = Math.min(queryQty, Math.max(1, max));
      }
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

.cover-box {
  position: relative;
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

.share-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
}

.share-chip {
  margin: 0;
  padding: 8rpx 24rpx;
  height: auto;
  min-height: 0;
  line-height: 1.5;
  font-size: 24rpx;
  color: #fff;
  background: #ff5a3d;
  border-radius: 28rpx;
}

.share-chip::after {
  border: none;
}

.share-chip.ghost {
  color: #ff5a3d;
  background: #fff1ed;
}

.ship-tag {
  display: inline-block;
  margin-top: 12rpx;
  padding: 4rpx 12rpx;
  font-size: 22rpx;
  color: #4b5563;
  background: #f3f4f6;
  border-radius: 8rpx;
}

.ship-tag.self {
  color: #ff5a3d;
  background: #fff1ed;
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
  display: flex;
  gap: 16rpx;
}

.cart-btn,
.buy-btn {
  flex: 1;
  margin: 0;
  border-radius: 44rpx;
  font-size: 28rpx;
}

.cart-btn {
  background: #fff1ee;
  color: #ff5a3d;
}

.buy-btn {
  background: #ff5a3d;
  color: #fff;
}

.cart-btn[disabled],
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
