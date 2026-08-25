<template>
  <view class="page">
    <view v-if="needLogin" class="empty">
      <text class="empty-title">登录后查看购物车</text>
      <text class="empty-desc">登录后同步商品，方便下单</text>
      <button class="go-btn" @click="goLogin">去登录</button>
    </view>

    <view v-else-if="loading" class="empty">
      <text class="empty-desc">加载中...</text>
    </view>

    <view v-else-if="cartItems.length" class="list">
      <view
        v-for="item in cartItems"
        :key="item.id"
        class="card"
        :class="{ invalid: !!item.invalidReason }"
        @click="goDetail(item)"
      >
        <view
          class="check"
          :class="{ on: isSelected(item), disabled: !!item.invalidReason }"
          @click.stop="toggleSelect(item)"
        >
          <text v-if="isSelected(item)">✓</text>
        </view>
        <image v-if="item.coverUrl" class="cover-img" :src="item.coverUrl" mode="aspectFill" />
        <view v-else class="cover">
          <text>{{ (item.productName || "").slice(0, 2) }}</text>
        </view>
        <view class="info">
          <text class="name">{{ item.productName }}</text>
          <text class="spec">{{ item.specName }}</text>
          <text v-if="item.invalidReason" class="warn">{{ item.invalidReason }}</text>
          <view class="bottom">
            <text class="price">¥{{ salePrice(item) }}</text>
            <view class="qty" @click.stop>
              <text class="btn" @click="changeQty(item, -1)">−</text>
              <text class="num">{{ item.quantity }}</text>
              <text class="btn" @click="changeQty(item, 1)">+</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="empty">
      <text class="empty-title">购物车还是空的</text>
      <text class="empty-desc">去首页挑几件心仪的商品吧</text>
      <button class="go-btn" @click="goHome">去逛逛</button>
    </view>

    <view v-if="!needLogin && cartItems.length" class="footer">
      <view class="check-all" @click="toggleAll">
        <view class="check" :class="{ on: allSelected }">
          <text v-if="allSelected">✓</text>
        </view>
        <text class="check-all-text">全选</text>
      </view>
      <view class="total">
        <text class="label">合计</text>
        <text class="amount">¥{{ total }}</text>
      </view>
      <button
        class="checkout"
        :class="{ disabled: !selectedItems.length }"
        @click="checkout"
      >
        {{ selectedItems.length ? `去结算(${selectedItems.length})` : "去结算" }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  deleteCart,
  fetchCartList,
  updateCartQty,
  type CartItemVO,
} from "@/api/cart";
import { salePrice } from "@/utils/price";
import { prefetchCoverUrls } from "@/utils/media";
import { ApiError } from "@/utils/request";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const cartItems = ref<CartItemVO[]>([]);
const selectedIds = ref<Set<number>>(new Set());
const loading = ref(false);
const needLogin = ref(false);

const validItems = computed(() => cartItems.value.filter((item) => !item.invalidReason));

const selectedItems = computed(() =>
  validItems.value.filter((item) => selectedIds.value.has(item.id)),
);

const allSelected = computed(
  () => validItems.value.length > 0 && selectedItems.value.length === validItems.value.length,
);

const total = computed(() => {
  const amount = selectedItems.value.reduce(
    (sum, item) => sum + Number(salePrice(item)) * item.quantity,
    0,
  );
  return amount.toFixed(2);
});

async function refreshBadge(n?: number) {
  const count = n ?? cartItems.value.reduce((sum, item) => sum + (item.quantity || 0), 0);
  try {
    if (count > 0) {
      uni.setTabBarBadge({ index: 2, text: count > 99 ? "99+" : String(count) });
    } else {
      uni.removeTabBarBadge({ index: 2 });
    }
  } catch {
    // tab 未就绪时忽略
  }
}

async function load() {
  if (!userStore.isLogin) {
    needLogin.value = true;
    cartItems.value = [];
    selectedIds.value = new Set();
    refreshBadge(0);
    return;
  }
  needLogin.value = false;
  loading.value = true;
  try {
    const res = await fetchCartList();
    const prevIds = new Set(cartItems.value.map((item) => item.id));
    const prevSelected = selectedIds.value;
    const next = res.data?.items || [];
    const nextSelected = new Set<number>();
    for (const item of next) {
      if (item.invalidReason) {
        continue;
      }
      if (!prevIds.size || prevSelected.has(item.id) || !prevIds.has(item.id)) {
        nextSelected.add(item.id);
      }
    }
    cartItems.value = next;
    selectedIds.value = nextSelected;
    await prefetchCoverUrls(cartItems.value);
    await refreshBadge(res.data?.totalQuantity || 0);
  } catch (e: unknown) {
    if (e instanceof ApiError && e.code === 401) {
      needLogin.value = true;
      cartItems.value = [];
      selectedIds.value = new Set();
      refreshBadge(0);
      return;
    }
    toast(e instanceof Error ? e.message : "加载失败");
  } finally {
    loading.value = false;
  }
}

async function changeQty(item: CartItemVO, delta: number) {
  const next = item.quantity + delta;
  if (next <= 0) {
    try {
      await deleteCart(item.id);
      cartItems.value = cartItems.value.filter((x) => x.id !== item.id);
      const nextSelected = new Set(selectedIds.value);
      nextSelected.delete(item.id);
      selectedIds.value = nextSelected;
      await refreshBadge();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "删除失败");
    }
    return;
  }
  try {
    const res = await updateCartQty(item.id, next);
    const idx = cartItems.value.findIndex((x) => x.id === item.id);
    if (idx >= 0) {
      cartItems.value[idx] = res.data;
      if (res.data.invalidReason) {
        const nextSelected = new Set(selectedIds.value);
        nextSelected.delete(item.id);
        selectedIds.value = nextSelected;
      }
    }
    await refreshBadge();
  } catch (e: unknown) {
    toast(e instanceof Error ? e.message : "修改失败");
  }
}

function isSelected(item: CartItemVO) {
  return selectedIds.value.has(item.id);
}

function toggleSelect(item: CartItemVO) {
  if (item.invalidReason) {
    toast(item.invalidReason);
    return;
  }
  const next = new Set(selectedIds.value);
  if (next.has(item.id)) {
    next.delete(item.id);
  } else {
    next.add(item.id);
  }
  selectedIds.value = next;
}

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set();
    return;
  }
  selectedIds.value = new Set(validItems.value.map((item) => item.id));
}

function checkout() {
  if (!selectedItems.value.length) {
    toast("请选择要结算的商品");
    return;
  }
  const ids = selectedItems.value.map((item) => item.id).join(",");
  uni.navigateTo({ url: `/pages/order/confirm?cartIds=${ids}` });
}

function goDetail(item: CartItemVO) {
  if (!item.productId) {
    toast("商品不存在");
    return;
  }
  const skuQuery = item.skuId ? `&skuId=${item.skuId}` : "";
  const qtyQuery = item.quantity > 0 ? `&qty=${item.quantity}` : "";
  const cartQuery = item.id ? `&cartId=${item.id}` : "";
  uni.navigateTo({ url: `/pages/goods/detail?id=${item.productId}${skuQuery}${qtyQuery}${cartQuery}` });
}

function goHome() {
  uni.switchTab({ url: "/pages/index/index" });
}

function goLogin() {
  uni.navigateTo({ url: "/pages/login/index" });
}

function toast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}

onShow(() => {
  load();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 140rpx;
}

.list {
  padding: 24rpx;
}

.card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid #d1d5db;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: #fff;
  box-sizing: border-box;
}

.check.on {
  background: #ff5a3d;
  border-color: #ff5a3d;
}

.check.disabled {
  opacity: 0.35;
}

.card.invalid {
  opacity: 0.7;
}

.cover,
.cover-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.cover {
  background: #ffe8e2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff5a3d;
  font-weight: 700;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.name {
  font-size: 28rpx;
  color: #1f2937;
  line-height: 1.4;
}

.spec {
  font-size: 24rpx;
  color: #9ca3af;
  margin-top: 6rpx;
}

.warn {
  font-size: 22rpx;
  color: #ff5a3d;
  margin-top: 6rpx;
}

.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price {
  color: #ff5a3d;
  font-size: 32rpx;
  font-weight: 700;
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

.empty {
  padding-top: 220rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.empty-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #9ca3af;
}

.go-btn {
  margin-top: 40rpx;
  width: 280rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 28rpx;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 110rpx;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 20rpx 0 28rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.check-all {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
  margin-right: 16rpx;
}

.check-all-text {
  font-size: 26rpx;
  color: #374151;
}

.total {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.label {
  color: #6b7280;
  font-size: 26rpx;
}

.amount {
  color: #ff5a3d;
  font-size: 36rpx;
  font-weight: 700;
}

.checkout {
  margin: 0;
  width: 220rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 38rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 28rpx;
  flex-shrink: 0;
}

.checkout.disabled {
  opacity: 0.45;
}
</style>
