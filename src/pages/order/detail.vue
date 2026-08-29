<template>
  <view class="page" v-if="order">
    <view class="status">
      <text class="status-text">{{ order.statusText }}</text>
      <view v-if="order.refundReason" class="refund-reason">退款原因：{{ order.refundReason }}</view>
      <text v-if="payCountdown" class="countdown">剩余 {{ payCountdown }} 自动取消</text>
      <text v-if="recvCountdown" class="countdown">剩余 {{ recvCountdown }} 自动确认收货</text>
    </view>
    <view v-if="showExpress" class="card express" @click="goExpress">
      <text class="ex-latest">{{ order.latestTrace?.context || "包裹运输中" }}</text>
      <text v-if="order.latestTrace?.time" class="ex-time">{{ formatTime(order.latestTrace.time) }}</text>
      <view class="ex-meta">
        <text class="ex-no">{{ order.expressCompanyName }} {{ order.expressNo }}</text>
        <text class="ex-link">查看物流</text>
      </view>
    </view>
    <view class="card">
      <view class="addr-top">
        <text class="name">{{ order.receiverName }}</text>
        <text class="phone">{{ order.receiverPhone }}</text>
      </view>
      <text class="addr">{{ order.receiverAddress }}</text>
    </view>
    <view class="card">
      <view v-for="item in order.items" :key="item.id" class="goods" @click="goGoods(item)">
        <image v-if="item.coverUrl" class="cover" :src="item.coverUrl" mode="aspectFill" />
        <view v-else class="cover fallback">{{ (item.productName || "").slice(0, 1) }}</view>
        <view class="info">
          <text class="gname">{{ item.productName }}</text>
          <text class="spec">{{ item.specName }} x{{ item.quantity }}</text>
        </view>
        <text class="price">{{ isPoints ? `${item.points || 0} 积分` : isVoucher ? "兑换券" : `¥${money(item.amount)}` }}</text>
      </view>
      <view class="line">
        <text>{{ isPoints ? "兑换积分" : "商品金额" }}</text>
        <text>{{ isPoints ? `${order.pointsAmount || 0} 积分` : `¥${money(order.goodsAmount)}` }}</text>
      </view>
      <view class="line">
        <text>运费</text>
        <text>{{ freightText(order) }}</text>
      </view>
        <view v-if="!isPoints && !isVoucher && order.memberDiscountAmount && Number(order.memberDiscountAmount) > 0" class="line">
          <text>会员折扣{{ order.memberLevelName ? `（${order.memberLevelName}）` : "" }}</text>
          <text class="off">-¥{{ money(order.memberDiscountAmount) }}</text>
        </view>
        <view v-if="!isPoints && !isVoucher && order.couponName" class="line">
          <text>优惠券</text>
          <text>{{ order.couponName }}</text>
        </view>
        <view v-if="!isPoints && !isVoucher && order.couponAmount && Number(order.couponAmount) > 0" class="line">
          <text>优惠</text>
          <text class="off">-¥{{ money(order.couponAmount) }}</text>
        </view>
        <view v-if="isVoucher" class="line">
          <text>支付方式</text>
          <text>实体兑换券</text>
        </view>
        <view class="line strong">
        <text>{{ isPoints ? "实付" : isVoucher ? "实付" : "应付" }}</text>
        <text class="pay">{{ isPoints ? `${order.pointsAmount || 0} 积分` : isVoucher ? "兑换券" : `¥${money(order.payAmount)}` }}</text>
      </view>
    </view>
    <view class="card meta">
      <text>订单号 {{ order.orderNo }}</text>
      <text v-if="order.refundReason">退款原因 {{ order.refundReason }}</text>
      <text v-if="publicShipFrom(order)">{{ publicShipFrom(order) }}</text>
      <text v-if="order.buyerRemark">备注 {{ order.buyerRemark }}</text>
      <text v-if="order.cancelReason">取消原因 {{ order.cancelReason }}</text>
    </view>
    <view v-if="order.canPay || order.canCancel || order.canConfirm || order.canAfterSale || showAfterSaleProgress" class="footer">
      <button v-if="order.canCancel" class="ghost" @click="onCancel">取消订单</button>
      <button v-if="showAfterSaleProgress" class="ghost" @click="goAfterSale">售后进度</button>
      <button v-else-if="order.canAfterSale" class="ghost" @click="goApply">申请售后</button>
      <button v-if="order.canConfirm" class="primary" @click="onConfirm">确认收货</button>
      <button v-if="order.canPay" class="primary" @click="onPay">立即支付</button>
    </view>
  </view>
  <view v-else class="state">{{ error || "加载中..." }}</view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onHide, onLoad, onShow, onUnload } from "@dcloudio/uni-app";
import { cancelOrder, confirmOrder, fetchOrderDetail, prepayOrder, type OrderItemVO, type OrderVO } from "@/api/order";
import { prefetchCoverUrls } from "@/utils/media";
import { publicShipFrom } from "@/utils/supplier";

const order = ref<OrderVO | null>(null);
const error = ref("");
const orderId = ref(0);
const remainMs = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
let closingExpired = false;

const isPoints = computed(() => order.value?.orderType === 1);
const isVoucher = computed(() => order.value?.orderType === 2);

const payCountdown = computed(() => {
  if (!order.value || order.value.status !== 10 || !order.value.expireTime) {
    return "";
  }
  const total = Math.max(0, Math.floor(remainMs.value / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

const recvCountdown = computed(() => {
  if (!order.value || order.value.status !== 30 || !order.value.autoConfirmTime) {
    return "";
  }
  const total = Math.max(0, Math.floor(remainMs.value / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) {
    return `${d}天${String(h).padStart(2, "0")}小时`;
  }
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
});

const showExpress = computed(() => {
  if (!order.value?.expressNo) {
    return false;
  }
  return order.value.status === 30 || order.value.status === 40;
});

const showAfterSaleProgress = computed(() => {
  const s = order.value?.afterSaleStatus;
  return !!order.value?.afterSaleId && [10, 20, 21, 30, 60].includes(Number(s));
});

onLoad((query) => {
  orderId.value = Number((query && query.id) || 0);
  load();
});

onShow(() => {
  if (orderId.value) {
    load();
    return;
  }
  if (order.value?.status === 10 || (order.value?.status === 30 && order.value.autoConfirmTime)) {
    startTimer();
  }
});

onHide(stopTimer);
onUnload(stopTimer);

async function load() {
  if (!orderId.value) {
    error.value = "订单不存在";
    return;
  }
  try {
    const res = await fetchOrderDetail(orderId.value);
    order.value = res.data;
    await prefetchCoverUrls(order.value?.items);
    startTimer();
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "加载失败";
  }
}

function parseExpire(t?: string) {
  if (!t) {
    return 0;
  }
  const s = String(t).trim().replace("T", " ").replace(/-/g, "/");
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? 0 : ms;
}

function deadlineMs() {
  if (order.value?.status === 10) {
    return parseExpire(order.value.expireTime);
  }
  if (order.value?.status === 30) {
    return parseExpire(order.value.autoConfirmTime);
  }
  return 0;
}

function tick() {
  const at = deadlineMs();
  if (!at) {
    remainMs.value = 0;
    stopTimer();
    return;
  }
  remainMs.value = Math.max(0, at - Date.now());
  if (remainMs.value <= 0) {
    stopTimer();
    closeIfExpired();
  }
}

function startTimer() {
  stopTimer();
  const at = deadlineMs();
  if (!at) {
    remainMs.value = 0;
    closingExpired = false;
    return;
  }
  remainMs.value = Math.max(0, at - Date.now());
  if (remainMs.value > 0) {
    closingExpired = false;
    timer = setInterval(tick, 1000);
    return;
  }
  closeIfExpired();
}

function closeIfExpired() {
  if (closingExpired) {
    return;
  }
  closingExpired = true;
  load();
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function onPay() {
  if (!order.value) {
    return;
  }
  const doPay = async () => {
    try {
      const res = await prepayOrder(order.value!.id, "wechat");
      const data = res.data;
      if (!data) {
        throw new Error("支付失败");
      }
      if (data.status === "success") {
        uni.showToast({ title: "支付成功", icon: "success" });
        await load();
        return;
      }
      if (data.status === "pending" && data.clientParams) {
        const p = data.clientParams;
        await new Promise<void>((resolve, reject) => {
          uni.requestPayment({
            provider: "wxpay",
            timeStamp: String(p.timeStamp || ""),
            nonceStr: String(p.nonceStr || ""),
            package: String(p.package || ""),
            signType: String(p.signType || "RSA") as "RSA" | "MD5",
            paySign: String(p.paySign || ""),
            success: () => resolve(),
            fail: (err) => reject(new Error(err?.errMsg || "支付取消")),
          });
        });
        uni.showToast({ title: "支付成功", icon: "success" });
        await load();
        return;
      }
      throw new Error("暂不支持的支付结果");
    } catch (e: any) {
      uni.showToast({ title: e?.message || "支付失败", icon: "none" });
    }
  };
  uni.showModal({
    title: "确认支付",
    content: "确认支付该订单？",
    success: (res) => {
      if (res.confirm) {
        void doPay();
      }
    },
  });
}

function onCancel() {
  uni.showModal({
    title: "取消订单",
    content: "取消后将释放库存，确定取消吗？",
    success: async (res) => {
      if (!res.confirm || !order.value) {
        return;
      }
      try {
        await cancelOrder(order.value.id);
        uni.showToast({ title: "已取消", icon: "success" });
        await load();
      } catch (e: any) {
        uni.showToast({ title: e?.message || "取消失败", icon: "none" });
      }
    },
  });
}

function onConfirm() {
  uni.showModal({
    title: "确认收货",
            content: "确认已收到商品吗？未确认将在物流签收 3 天后自动确认收货。",
    success: async (res) => {
      if (!res.confirm || !order.value) {
        return;
      }
      try {
        await confirmOrder(order.value.id);
        uni.showToast({ title: "已完成", icon: "success" });
        await load();
      } catch (e: any) {
        uni.showToast({ title: e?.message || "操作失败", icon: "none" });
      }
    },
  });
}

function freightText(row: OrderVO) {
  if (row.orderType === 1 || row.orderType === 2 || Number(row.freightAmount) === 0) {
    return "免运费";
  }
  return `¥${money(row.freightAmount)}`;
}

function money(v: unknown) {
  return Number(v || 0).toFixed(2);
}

function formatTime(t?: string) {
  if (!t) {
    return "";
  }
  return String(t).replace("T", " ").slice(0, 16);
}

function goGoods(item: OrderItemVO) {
  if (!item.productId) {
    return;
  }
  if (isPoints.value) {
    uni.navigateTo({ url: `/pages/points/detail?id=${item.productId}` });
    return;
  }
  const skuQuery = item.skuId ? `&skuId=${item.skuId}` : "";
  uni.navigateTo({ url: `/pages/goods/detail?id=${item.productId}${skuQuery}` });
}

function goExpress() {
  if (!order.value?.id) {
    return;
  }
  uni.navigateTo({
    url: `/pages/order/express?id=${order.value.id}`,
    fail: (err) => {
      uni.showToast({ title: err?.errMsg || "打开物流失败", icon: "none" });
    },
  });
}

function goApply() {
  if (!order.value?.id) {
    return;
  }
  uni.navigateTo({ url: `/pages/aftersale/apply?id=${order.value.id}` });
}

function goAfterSale() {
  if (!order.value?.afterSaleId) {
    return;
  }
  uni.navigateTo({ url: `/pages/aftersale/detail?id=${order.value.afterSaleId}` });
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
.status {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 36rpx 28rpx 12rpx;
}
.status-text {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}
.countdown {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  font-weight: 400;
  color: #ff5a3d;
}
.refund-reason {
  font-size: 26rpx;
  font-weight: 400;
  color: #ff5a3d;
  line-height: 1.5;
}
.express {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.ex-latest {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}
.ex-time {
  font-size: 22rpx;
  color: #9ca3af;
}
.ex-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8rpx;
}
.ex-no {
  font-size: 24rpx;
  color: #6b7280;
}
.ex-link {
  font-size: 24rpx;
  color: #ff5a3d;
}
.card {
  margin: 16rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}
.addr-top {
  display: flex;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.name {
  font-weight: 700;
  font-size: 30rpx;
}
.phone,
.addr {
  color: #6b7280;
  font-size: 26rpx;
}
.goods {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 12rpx 0;
}
.cover {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
}
.fallback {
  background: #ffe8e2;
  color: #ff5a3d;
  display: flex;
  align-items: center;
  justify-content: center;
}
.info {
  flex: 1;
}
.gname {
  font-size: 26rpx;
  color: #111827;
}
.spec {
  display: block;
  margin-top: 6rpx;
  color: #9ca3af;
  font-size: 22rpx;
}
.line {
  display: flex;
  justify-content: space-between;
  padding-top: 12rpx;
  font-size: 26rpx;
  color: #4b5563;
}
.strong {
  font-weight: 700;
  color: #111827;
}
.pay {
  color: #ff5a3d;
}
.off {
  color: #ff5a3d;
}
.meta {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  font-size: 24rpx;
  color: #9ca3af;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
}
.ghost,
.primary {
  margin: 0;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 36rpx;
  border-radius: 36rpx;
  font-size: 26rpx;
}
.ghost {
  background: #f3f4f6;
  color: #374151;
}
.primary {
  background: #ff5a3d;
  color: #fff;
}
</style>
