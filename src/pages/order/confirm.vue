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

      <template v-if="!isPoints && !isVoucher && groups.length">
        <view v-for="g in groups" :key="groupKey(g.supplierId)" class="card">
        <text class="group-title">{{ publicShipFrom(g) }}</text>
        <view v-for="item in g.items || []" :key="item.id || item.skuId" class="goods" @click="goGoods(item)">
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
        <view class="line">
          <text>运费</text>
          <text>{{ groupFreight(g) }}</text>
        </view>
        <view v-if="Number(g.memberDiscountAmount) > 0" class="line">
          <text>会员折扣</text>
          <text class="off">-¥{{ money(g.memberDiscountAmount) }}</text>
        </view>
        <view class="line">
          <text>优惠券</text>
          <text class="coupon-val">{{ groupCouponLabel(g) }}</text>
        </view>
        <view v-if="(g.coupons || []).length" class="coupon-list">
          <view
            class="coupon-card"
            :class="{ on: couponIdOf(g) === 0 }"
            @click="pickGroupCoupon(g.supplierId, 0)"
          >
            <view class="coupon-bar none" />
            <view class="coupon-body">
              <text class="coupon-name">不使用优惠券</text>
              <text class="coupon-desc">{{ g.memberDiscountApplied ? "享受会员折扣" : "按原价结算" }}</text>
            </view>
            <text v-if="couponIdOf(g) === 0" class="coupon-check">✓</text>
          </view>
          <view
            v-for="c in g.coupons || []"
            :key="c.id"
            class="coupon-card"
            :class="{ on: couponIdOf(g) === c.id, off: !c.usable }"
            @click="pickGroupCoupon(g.supplierId, c.id, c)"
          >
            <view class="coupon-bar" />
            <view class="coupon-body">
              <text class="coupon-benefit">{{ c.benefitText }}</text>
              <text class="coupon-name">{{ c.name }}</text>
              <text class="coupon-desc">{{ c.usable ? `可减 ¥${money(c.couponAmount)}${c.tip ? " · " + c.tip : ""}` : c.reason || "不可用" }}</text>
            </view>
            <text v-if="couponIdOf(g) === c.id" class="coupon-check">✓</text>
          </view>
        </view>
        <view v-if="Number(g.couponAmount) > 0" class="line">
          <text>优惠</text>
          <text class="off">-¥{{ money(g.couponAmount) }}</text>
        </view>
        <view class="line">
          <text>小计</text>
          <text class="price">¥{{ money(g.payAmount) }}</text>
        </view>
        </view>
      </template>

      <view v-else class="card">
        <view v-for="item in items" :key="item.id || item.skuId" class="goods" @click="goGoods(item)">
          <image v-if="item.coverUrl" class="cover" :src="item.coverUrl" mode="aspectFill" />
          <view v-else class="cover fallback">{{ (item.productName || "").slice(0, 2) }}</view>
          <view class="info">
            <text class="gname">{{ item.productName }}</text>
            <text class="spec">{{ item.specName }}</text>
            <text v-if="item.invalidReason" class="warn">{{ item.invalidReason }}</text>
            <view class="row">
              <text class="price">{{ isPoints ? `${item.points || 0} 积分` : isVoucher ? "兑换券" : `¥${money(item.price)}` }}</text>
              <text class="qty">x{{ item.quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="card form">
        <view class="line">
          <text>{{ isPoints ? "兑换积分" : "商品金额" }}</text>
          <text>{{ isPoints ? `${pointsAmount} 积分` : `¥${money(goodsAmount)}` }}</text>
        </view>
        <view class="line">
          <text>运费</text>
          <text>{{ freightLabel }}</text>
        </view>
        <view v-if="isPoints" class="line">
          <text>当前积分</text>
          <text>{{ memberPoints }}</text>
        </view>
        <view v-if="isVoucher" class="line">
          <text>支付方式</text>
          <text>实体兑换券</text>
        </view>
        <view v-if="!isPoints && !isVoucher && !groups.length && Number(memberDiscountAmount) > 0" class="line">
          <text>会员折扣{{ memberLevelName ? `（${memberLevelName}）` : "" }}</text>
          <text class="off">-¥{{ money(memberDiscountAmount) }}</text>
        </view>
        <view v-if="!isPoints && !isVoucher && !groups.length" class="line">
          <text>优惠券</text>
          <text class="coupon-val">{{ couponLabel }}</text>
        </view>
        <view v-if="!isPoints && !isVoucher && !groups.length && coupons.length" class="coupon-list">
          <view
            class="coupon-card"
            :class="{ on: selectedCouponId === 0 }"
            @click="pickCoupon(0)"
          >
            <view class="coupon-bar none" />
            <view class="coupon-body">
              <text class="coupon-name">不使用优惠券</text>
              <text class="coupon-desc">{{ memberDiscountApplied ? "享受会员折扣" : "按原价结算" }}</text>
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
              <text class="coupon-desc">{{ c.usable ? `可减 ¥${money(c.couponAmount)}${c.tip ? " · " + c.tip : ""}` : c.reason || "不可用" }}</text>
            </view>
            <text v-if="selectedCouponId === c.id" class="coupon-check">✓</text>
          </view>
        </view>
        <view v-if="!isPoints && !isVoucher && !groups.length && Number(couponAmount) > 0" class="line">
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
        <text>{{ isPoints ? "应付" : "应付" }}</text>
        <text class="amount">{{ isPoints ? `${pointsAmount} 积分` : isVoucher ? "兑换券" : `¥${money(payAmount)}` }}</text>
      </view>
      <button class="submit" :disabled="submitting || !canSubmit" @click="onSubmit">
        {{ isPoints || isVoucher ? "确认兑换" : "提交订单" }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { fetchAddressDetail, type AddressVO } from "@/api/address";
import {
  createOrder,
  createPointsOrder,
  previewOrder,
  previewPointsOrder,
  type OrderItemVO,
  type OrderPreviewGroupVO,
} from "@/api/order";
import { previewVoucher, redeemVoucher } from "@/api/voucher";
import { fetchCartCount } from "@/api/cart";
import type { CouponVO } from "@/api/coupon";
import { prefetchCoverUrls } from "@/utils/media";
import { publicShipFrom } from "@/utils/supplier";

const cartIds = ref<number[]>([]);
const isPoints = ref(false);
const isVoucher = ref(false);
const voucherCode = ref("");
const productId = ref(0);
const skuId = ref(0);
const quantity = ref(1);
const loading = ref(true);
const submitting = ref(false);
const address = ref<AddressVO | null>(null);
const items = ref<OrderItemVO[]>([]);
const goodsAmount = ref("0.00");
const freightAmount = ref("0.00");
const freightFree = ref(false);
const freightHint = ref("");
const payAmount = ref("0.00");
const couponAmount = ref("0.00");
const memberDiscountAmount = ref("0.00");
const memberLevelName = ref("");
const memberDiscountApplied = ref(false);
const pointsAmount = ref(0);
const memberPoints = ref(0);
const selectedCouponId = ref<number | null>(null);
const coupons = ref<CouponVO[]>([]);
const groups = ref<OrderPreviewGroupVO[]>([]);
const couponBySupplier = ref<Record<string, number>>({});
const remark = ref("");
const previewOk = ref(false);

const canSubmit = computed(() => items.value.length > 0);
const freightLabel = computed(() => {
  if (isPoints.value || isVoucher.value) {
    return "免运费";
  }
  if (!address.value) {
    return freightHint.value || "请选择收货地址";
  }
  if (Number(freightAmount.value) === 0) {
    return freightFree.value ? "包邮" : "免运费";
  }
  return `¥${money(freightAmount.value)}`;
});
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
  const mode = String((query && query.mode) || "");
  isPoints.value = mode === "points";
  isVoucher.value = mode === "voucher";
  if (isPoints.value) {
    uni.setNavigationBarTitle({ title: "确认兑换" });
    productId.value = Number((query && query.productId) || 0);
    skuId.value = Number((query && query.skuId) || 0);
    quantity.value = Math.max(1, Number((query && query.qty) || 1));
    return;
  }
  if (isVoucher.value) {
    uni.setNavigationBarTitle({ title: "确认兑换" });
    voucherCode.value = String(uni.getStorageSync("mall_voucher_code") || (query && query.code) || "");
    return;
  }
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
  if (isPoints.value) {
    if (!productId.value || !skuId.value) {
      uni.showToast({ title: "请选择兑换商品", icon: "none" });
      return;
    }
  } else if (isVoucher.value) {
    if (!voucherCode.value) {
      uni.showToast({ title: "请先输入验证码", icon: "none" });
      return;
    }
  } else if (!cartIds.value.length) {
    uni.showToast({ title: "请选择商品", icon: "none" });
    return;
  }
  if (!silent) {
    loading.value = true;
  }
  try {
    const stored = Number(uni.getStorageSync("mall_order_address_id") || 0);
    const res = isPoints.value
      ? await previewPointsOrder({
          productId: productId.value,
          skuId: skuId.value,
          quantity: quantity.value,
          addressId: stored || undefined,
        })
      : isVoucher.value
        ? await previewVoucher({
            code: voucherCode.value,
            addressId: stored || undefined,
          })
        : await previewOrder(
            cartIds.value,
            selectedCouponId.value,
            stored || undefined,
            groupCouponsPayload()
          );
    items.value = res.data?.items || [];
    groups.value = res.data?.groups || [];
    for (const g of groups.value) {
      const key = groupKey(g.supplierId);
      if (couponBySupplier.value[key] == null && g.selectedCouponId != null) {
        couponBySupplier.value[key] = Number(g.selectedCouponId);
      }
    }
    await prefetchCoverUrls(items.value);
    goodsAmount.value = money(res.data?.goodsAmount);
    freightAmount.value = money(res.data?.freightAmount);
    freightFree.value = !!res.data?.freightFree;
    freightHint.value = res.data?.freightHint || "";
    payAmount.value = money(res.data?.payAmount);
    couponAmount.value = money(res.data?.couponAmount);
    memberDiscountAmount.value = money(res.data?.memberDiscountAmount);
    memberLevelName.value = res.data?.memberLevelName || "";
    memberDiscountApplied.value = !!res.data?.memberDiscountApplied;
    pointsAmount.value = Number(res.data?.pointsAmount || 0);
    memberPoints.value = Number(res.data?.memberPoints || 0);
    coupons.value = res.data?.coupons || [];
    if (!isPoints.value && !isVoucher.value) {
      selectedCouponId.value = res.data?.selectedCouponId ?? 0;
    }
    previewOk.value = !!res.data?.canSubmit;
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

function goGoods(item: OrderItemVO) {
  if (!item.productId) {
    return;
  }
  const skuQuery = item.skuId ? `&skuId=${item.skuId}` : "";
  uni.navigateTo({ url: `/pages/goods/detail?id=${item.productId}${skuQuery}` });
}

async function onSubmit() {
  if (!address.value) {
    uni.showModal({
      title: "请填写收货地址",
      content: "提交订单前需要先填写收货地址",
      confirmText: "去填写",
      success: (res) => {
        if (res.confirm) {
          goAddress();
        }
      },
    });
    return;
  }
  if (!previewOk.value) {
    uni.showToast({ title: isPoints.value || isVoucher.value ? "暂无法兑换，请返回重试" : "有商品无法结算，请返回购物车", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    const res = isPoints.value
      ? await createPointsOrder({
          productId: productId.value,
          skuId: skuId.value,
          quantity: quantity.value,
          addressId: address.value.id,
          remark: remark.value || undefined,
        })
      : isVoucher.value
        ? await redeemVoucher({
            code: voucherCode.value,
            addressId: address.value.id,
            remark: remark.value || undefined,
          })
        : await createOrder({
          cartIds: cartIds.value,
          addressId: address.value.id,
          remark: remark.value || undefined,
          couponId: selectedCouponId.value ?? 0,
          groupCoupons: groupCouponsPayload(),
        });
    uni.removeStorageSync("mall_order_address_id");
    if (isVoucher.value) {
      uni.removeStorageSync("mall_voucher_code");
    }
    if (!isPoints.value && !isVoucher.value) {
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
    }
    const created = isPoints.value || isVoucher.value
      ? [res.data]
      : res.data?.orders || [];
    const first = created[0];
    if (!first?.id) {
      throw new Error("下单失败");
    }
    if (!isPoints.value && !isVoucher.value && created.length > 1) {
      uni.showToast({ title: `已拆成${created.length}笔订单，请分别支付`, icon: "none" });
    }
    uni.redirectTo({ url: `/pages/order/detail?id=${first.id}` });
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

function groupKey(supplierId?: number | null) {
  return String(supplierId ?? 0);
}

function couponIdOf(g: OrderPreviewGroupVO) {
  const stored = couponBySupplier.value[groupKey(g.supplierId)];
  if (stored != null) {
    return stored;
  }
  return g.selectedCouponId ?? 0;
}

function groupCouponsPayload() {
  if (!groups.value.length) {
    return undefined;
  }
  return groups.value.map((g) => ({
    supplierId: g.supplierId ?? null,
    couponId: couponIdOf(g),
  }));
}

function groupFreight(g: OrderPreviewGroupVO) {
  if (!address.value) {
    return g.freightHint || "请选择收货地址";
  }
  if (Number(g.freightAmount || 0) === 0) {
    return g.freightFree ? "包邮" : "免运费";
  }
  return `¥${money(g.freightAmount)}`;
}

function groupCouponLabel(g: OrderPreviewGroupVO) {
  const id = couponIdOf(g);
  const list = g.coupons || [];
  if (id == null || id === 0) {
    return list.some((c) => c.usable) ? "未使用" : "暂无可用";
  }
  const hit = list.find((c) => c.id === id);
  return hit ? hit.benefitText : "已选";
}

function pickGroupCoupon(supplierId: number | null | undefined, id: number, coupon?: CouponVO) {
  if (id !== 0 && coupon && !coupon.usable) {
    uni.showToast({ title: coupon.reason || "优惠券不可用", icon: "none" });
    return;
  }
  couponBySupplier.value = { ...couponBySupplier.value, [groupKey(supplierId)]: id };
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
.group-title {
  display: block;
  margin-bottom: 12rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
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
.form .line,
.card .line {
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
