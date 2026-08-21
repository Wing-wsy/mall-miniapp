<template>
  <view class="page" v-if="detail">
    <view class="status">
      <text class="status-text">{{ detail.statusText }}</text>
      <text class="sub">{{ detail.typeText }} · {{ detail.afterSaleNo }}</text>
    </view>
    <view v-if="detail.returnAddress && detail.status === 20" class="card">
      <text class="label">退货地址</text>
      <text class="addr">{{ detail.returnName }} {{ detail.returnPhone }}</text>
      <text class="addr">{{ detail.returnAddress }}</text>
    </view>
    <view v-if="detail.returnExpressNo" class="card">
      <text class="label">退货物流</text>
      <text>{{ detail.returnExpressCompanyName }} {{ detail.returnExpressNo }}</text>
    </view>
    <view class="card">
      <text class="label">售后信息</text>
      <text class="line">原因 {{ detail.reasonText }}</text>
      <text v-if="detail.remark" class="line">说明 {{ detail.remark }}</text>
      <text v-if="detail.rejectReason" class="line">拒绝 {{ detail.rejectReason }}</text>
      <text class="line">退款 {{ amountText }}</text>
      <view v-if="detail.images?.length" class="pics">
        <image
          v-for="url in detail.images"
          :key="url"
          class="thumb"
          :src="url"
          mode="aspectFill"
          @click="preview(url)"
        />
      </view>
    </view>
    <view class="card">
      <text class="label">订单 {{ detail.orderNo }}</text>
      <view v-for="item in detail.items" :key="item.id" class="goods">
        <image v-if="item.coverUrl" class="cover" :src="item.coverUrl" mode="aspectFill" />
        <view class="info">
          <text>{{ item.productName }}</text>
          <text class="spec">{{ item.specName }} x{{ item.quantity }}</text>
        </view>
      </view>
    </view>
    <view v-if="detail.logs?.length" class="card">
      <text class="label">进度</text>
      <view v-for="(log, idx) in reversedLogs" :key="idx" class="log">
        <text class="log-t">{{ log.actionText }}</text>
        <text class="log-d">{{ formatTime(log.createTime) }} {{ log.remark || "" }}</text>
      </view>
    </view>
    <view v-if="detail.canFillReturn" class="card">
      <text class="label">填写退货物流</text>
      <picker :range="companyLabels" @change="onCompany">
        <view class="pick">{{ companyLabel || "选择快递公司" }}</view>
      </picker>
      <input v-model="expressNo" class="input" placeholder="运单号" maxlength="64" />
    </view>
    <view v-if="detail.canCancel || detail.canFillReturn" class="footer">
      <button v-if="detail.canCancel" class="ghost" @click="onCancel">撤销申请</button>
      <button v-if="detail.canFillReturn" class="primary" @click="submitReturn">提交运单号</button>
    </view>
  </view>
  <view v-else class="state">{{ error || "加载中..." }}</view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { cancelAfterSale, fetchAfterSaleDetail, fillAfterSaleReturn, type AfterSaleVO } from "@/api/aftersale";

const detail = ref<AfterSaleVO | null>(null);
const error = ref("");
const id = ref(0);

const companies = [
  { value: "sf", label: "顺丰速运" },
  { value: "zto", label: "中通快递" },
  { value: "yto", label: "圆通速递" },
  { value: "yd", label: "韵达快递" },
  { value: "jd", label: "京东物流" },
  { value: "sto", label: "申通快递" },
];
const companyLabels = companies.map((c) => c.label);
const company = ref("");
const expressNo = ref("");
const companyLabel = computed(() => companies.find((c) => c.value === company.value)?.label || "");

const reversedLogs = computed(() => [...(detail.value?.logs || [])].reverse());

const amountText = computed(() => {
  if (!detail.value) {
    return "";
  }
  if (detail.value.orderType === 1) {
    return `${detail.value.refundPoints || 0} 积分`;
  }
  if (detail.value.orderType === 2) {
    return "兑换券";
  }
  return `¥${Number(detail.value.refundAmount || 0).toFixed(2)}`;
});

onLoad((query) => {
  id.value = Number((query && query.id) || 0);
  load();
});

async function load() {
  if (!id.value) {
    error.value = "售后单不存在";
    return;
  }
  try {
    const res = await fetchAfterSaleDetail(id.value);
    detail.value = res.data;
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  }
}

function formatTime(t?: string) {
  if (!t) {
    return "";
  }
  return String(t).replace("T", " ").slice(0, 16);
}

function preview(url: string) {
  uni.previewImage({ current: url, urls: detail.value?.images || [url] });
}

function onCancel() {
  uni.showModal({
    title: "撤销申请",
    content: "撤销后可在售后期内重新申请",
    success: async (res) => {
      if (!res.confirm) {
        return;
      }
      try {
        await cancelAfterSale(id.value);
        uni.showToast({ title: "已撤销", icon: "success" });
        await load();
      } catch (e: any) {
        uni.showToast({ title: e?.message || "操作失败", icon: "none" });
      }
    },
  });
}

function onCompany(e: { detail: { value: string | number } }) {
  const idx = Number(e.detail.value);
  company.value = companies[idx]?.value || "";
}

async function submitReturn() {
  if (!company.value) {
    uni.showToast({ title: "请选择快递公司", icon: "none" });
    return;
  }
  const no = expressNo.value.trim();
  if (!no) {
    uni.showToast({ title: "请填写运单号", icon: "none" });
    return;
  }
  try {
    await fillAfterSaleReturn(id.value, { expressCompany: company.value, expressNo: no });
    uni.showToast({ title: "已提交", icon: "success" });
    expressNo.value = "";
    await load();
  } catch (e: any) {
    uni.showToast({ title: e?.message || "提交失败", icon: "none" });
  }
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
  padding: 36rpx 28rpx 12rpx;
}
.status-text {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}
.sub {
  display: block;
  margin-top: 8rpx;
  color: #6b7280;
  font-size: 24rpx;
}
.card {
  margin: 16rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}
.label {
  display: block;
  font-weight: 700;
  margin-bottom: 12rpx;
}
.addr,
.line {
  display: block;
  font-size: 26rpx;
  color: #4b5563;
  margin-top: 8rpx;
}
.pics {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
}
.thumb {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
}
.goods {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 8rpx 0;
}
.cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
}
.info {
  flex: 1;
}
.spec {
  display: block;
  color: #9ca3af;
  font-size: 22rpx;
}
.log {
  padding: 10rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}
.log-t {
  display: block;
  font-size: 26rpx;
}
.log-d {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
.pick,
.input {
  margin-top: 12rpx;
  background: #f3f4f6;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 26rpx;
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
