<template>
  <view class="page">
    <view v-if="loading" class="state">加载中...</view>
    <view v-else>
      <view class="card address" @click="goAddress">
        <view v-if="address">
          <view class="addr-top">
            <text class="name">{{ address.receiverName }}</text>
            <text class="phone">{{ address.receiverPhone }}</text>
          </view>
          <text class="addr">{{ address.fullAddress }}</text>
        </view>
        <view v-else class="addr-empty">
          <text>请添加收货地址</text>
        </view>
        <text class="arrow">›</text>
      </view>

      <view class="card">
        <view v-for="item in items" :key="item.id" class="goods">
          <image v-if="item.coverUrl" class="cover" :src="item.coverUrl" mode="aspectFill" />
          <view v-else class="cover fallback">{{ (item.productName || "").slice(0, 2) }}</view>
          <view class="info">
            <text class="gname">{{ item.productName }}</text>
            <text class="spec">{{ item.specName }}</text>
            <text v-if="item.invalidReason" class="warn">{{ item.invalidReason }}</text>
            <view class="row">
              <text class="price">¥{{ money(item.price) }}</text>
              <text class="qty">x{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="card form">
        <view class="line">
          <text>商品金额</text>
          <text>¥{{ money(goodsAmount) }}</text>
        </view>
        <view class="line">
          <text>运费</text>
          <text>免运费</text>
        </view>
        <view class="line">
          <text>优惠券</text>
          <text class="coupon-val">{{ couponLabel }}</text>
        </view>
        <view v-if="coupons.length" class="coupon-list">
          <view
            class="coupon-card"
            :class="{ on: selectedCouponId === 0 }"
            @click="pickCoupon(0)"
          >
            <view class="coupon-bar none" />
            <view class="coupon-body">
              <text class="coupon-name">不使用优惠券</text>
              <text class="coupon-desc">按原价结算</text>
            </view>
            <text v-if="selectedCouponId === 0" class="coupon-check">✓</text>
          </view>
          <view
            v-for="c in coupons"
            :key="c.id"
            class="coupon-card"
            :class="{ on: selectedCouponId === c.id, off: !c.usable }"
            @click="pickCoupon(c.id)"
          >
            <view class="coupon-bar" />
            <view class="coupon-body">
              <text class="coupon-benefit">{{ c.benefitText }}</text>
              <text class="coupon-name">{{ c.name }}</text>
              <text class="coupon-desc">{{ c.usable ? `可减 ¥${money(c.couponAmount)}` : c.reason || "不可用" }}</text>
            </view>
            <text v-if="selectedCouponId === c.id" class="coupon-check">✓</text>
          </view>
        </view>
        <view v-if="Number(couponAmount) > 0" class="line">
          <text>优惠</text>
          <text class="off">-¥{{ money(couponAmount) }}</text>
        </view>
        <view class="remark">
          <text class="label">备注</text>
          <input v-model="remark" class="input" placeholder="选填，给商家的留言" maxlength="200" />
        </view>
      </view>
    </view>

    <view class="footer">
      <view class="total">
        <text>应付</text>
        <text class="amount">¥{{ money(payAmount) }}</text>
      </view>
      <button class="submit" :disabled="submitting || !canSubmit" @click="onSubmit">提交订单</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { fetchAddressDetail, type AddressVO } from "@/api/address";
import { createOrder, previewOrder, type OrderItemVO } from "@/api/order";
import { fetchCartCount } from "@/api/cart";
import type { CouponVO } from "@/api/coupon";

const cartIds = ref<number[]>([]);
const loading = ref(true);
const submitting = ref(false);
const address = ref<AddressVO | null>(null);
const items = ref<OrderItemVO[]>([]);
const goodsAmount = ref("0.00");
const payAmount = ref("0.00");
const couponAmount = ref("0.00");
const selectedCouponId = ref<number | null>(null);
const coupons = ref<CouponVO[]>([]);
const remark = ref("");
const previewOk = ref(false);

const canSubmit = computed(() => previewOk.value && !!address.value && items.value.length > 0);
const couponLabel = computed(() => {
  if (selectedCouponId.value == null || selectedCouponId.value === 0) {
    if (selectedCouponId.value === 0) {
      return coupons.value.some((c) => c.usable) ? "未使用" : "暂无可用";
    }
    return coupons.value.some((c) => c.usable) ? "请选择" : "暂无可用";
  }
  const hit = coupons.value.find((c) => c.id === selectedCouponId.value);
  return hit ? hit.benefitText : "已选";
});

onLoad((query) => {
  const raw = (query && query.cartIds) || "";
  cartIds.value = String(raw)
    .split(",")
    .map((id) => Number(id))
    .filter((id) => id > 0);
});

onShow(() => {
  loadPreview();
});

async function loadPreview(silent = false) {
  if (!cartIds.value.length) {
    uni.showToast({ title: "请选择商品", icon: "none" });
    return;
  }
  if (!silent) {
    loading.value = true;
  }
  try {
    const res = await previewOrder(cartIds.value, selectedCouponId.value);
    items.value = res.data?.items || [];
    goodsAmount.value = money(res.data?.goodsAmount);
    payAmount.value = money(res.data?.payAmount);
    couponAmount.value = money(res.data?.couponAmount);
    coupons.value = res.data?.coupons || [];
    selectedCouponId.value = res.data?.selectedCouponId ?? 0;
    previewOk.value = !!res.data?.canSubmit;
    const stored = Number(uni.getStorageSync("mall_order_address_id") || 0);
    if (stored) {
      try {
        const addr = await fetchAddressDetail(stored);
        address.value = addr.data;
      } catch {
        address.value = res.data?.address || null;
      }
    } else {
      address.value = res.data?.address || null;
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goAddress() {
  uni.navigateTo({ url: "/pages/address/list?from=order" });
}

async function onSubmit() {
  if (!address.value) {
    uni.showToast({ title: "请选择收货地址", icon: "none" });
    return;
  }
  if (!previewOk.value) {
    uni.showToast({ title: "有商品无法结算，请返回购物车", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    const res = await createOrder({
      cartIds: cartIds.value,
      addressId: address.value.id,
      remark: remark.value || undefined,
      couponId: selectedCouponId.value ?? 0,
    });
    uni.removeStorageSync("mall_order_address_id");
    try {
      const countRes = await fetchCartCount();
      const n = countRes.data?.totalQuantity || 0;
      if (n > 0) {
        uni.setTabBarBadge({ index: 2, text: n > 99 ? "99+" : String(n) });
      } else {
        uni.removeTabBarBadge({ index: 2 });
      }
    } catch {
      // ignore
    }
    uni.redirectTo({ url: `/pages/order/detail?id=${res.data.id}` });
  } catch (e: any) {
    uni.showToast({ title: e?.message || "下单失败", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

function pickCoupon(id: number) {
  if (id !== 0) {
    const hit = coupons.value.find((c) => c.id === id);
    if (hit && !hit.usable) {
      uni.showToast({ title: hit.reason || "优惠券不可用", icon: "none" });
      return;
    }
  }
  selectedCouponId.value = id;
  loadPreview(true);
}

function money(v: unknown) {
  return Number(v || 0).toFixed(2);
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: 140rpx;
}
.state {
  padding-top: 200rpx;
  text-align: center;
  color: #9ca3af;
}
.card {
  margin: 20rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}
.address {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.addr-top {
  display: flex;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.name {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}
.phone {
  font-size: 28rpx;
  color: #4b5563;
}
.addr,
.addr-empty {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}
.arrow {
  margin-left: auto;
  color: #d1d5db;
  font-size: 40rpx;
}
.goods {
  display: flex;
  gap: 16rpx;
  padding: 12rpx 0;
}
.cover {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}
.fallback {
  background: #ffe8e2;
  color: #ff5a3d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.gname {
  font-size: 28rpx;
  color: #1f2937;
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
.row {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
}
.price {
  color: #ff5a3d;
  font-weight: 700;
}
.qty {
  color: #6b7280;
}
.form .line {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: #374151;
}
.coupon-val {
  color: #ff5a3d;
}
.off {
  color: #ff5a3d;
}
.coupon-list {
  padding: 8rpx 0 16rpx;
}
.coupon-card {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  padding: 20rpx 20rpx 20rpx 0;
  border-radius: 16rpx;
  background: #fff7f5;
  border: 2rpx solid transparent;
}
.coupon-card.on {
  border-color: #ff5a3d;
  background: #fff1ed;
}
.coupon-card.off {
  opacity: 0.5;
  background: #f3f4f6;
}
.coupon-bar {
  width: 8rpx;
  align-self: stretch;
  margin-right: 20rpx;
  border-radius: 0 8rpx 8rpx 0;
  background: #ff5a3d;
}
.coupon-bar.none {
  background: #d1d5db;
}
.coupon-body {
  flex: 1;
  min-width: 0;
}
.coupon-benefit {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #ff5a3d;
}
.coupon-name {
  display: block;
  margin-top: 4rpx;
  font-size: 26rpx;
  color: #374151;
}
.coupon-desc {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
.coupon-check {
  margin-left: 12rpx;
  color: #ff5a3d;
  font-size: 32rpx;
  font-weight: 700;
}
.remark {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-top: 12rpx;
}
.label {
  font-size: 26rpx;
  color: #374151;
}
.input {
  flex: 1;
  font-size: 26rpx;
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
  justify-content: space-between;
  padding: 0 28rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}
.total {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  font-size: 26rpx;
  color: #6b7280;
}
.amount {
  color: #ff5a3d;
  font-size: 36rpx;
  font-weight: 700;
}
.submit {
  margin: 0;
  width: 240rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 38rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 28rpx;
}
</style>
