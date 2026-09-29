<template>
  <view class="page">
    <view class="nav-wrap" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav">
        <view class="nav-back" @click="goBack">
          <text class="nav-back-icon">‹</text>
        </view>
        <text class="nav-title">方案详情</text>
        <view
          v-if="detail && detail.items.length"
          class="export-btn"
          :class="{ disabled: exporting || !canExport }"
          :style="{ right: exportRight + 'px' }"
          @click="onExportPpt"
        >
          <view class="export-icon" aria-label="导出PPT">
            <view class="export-tray" />
            <view class="export-arrow" />
          </view>
        </view>
      </view>
    </view>
    <view v-if="loading" class="state">加载中...</view>
    <view v-else-if="!detail" class="state">方案不存在</view>
    <template v-else>
      <view class="head">
        <text class="name">{{ detail.name }}</text>
        <view class="head-actions">
          <text class="rename" @click="onRename">改名</text>
          <text class="rename" @click="onDeletePlan">删除</text>
        </view>
      </view>

      <view v-if="!detail.items.length" class="empty">
        <text class="empty-title">方案里还没有商品</text>
        <text class="empty-desc">去首页选择商品，指定规格、单位和数量</text>
        <button class="primary" @click="continueAdd">去首页添加</button>
      </view>

      <view v-else class="items">
        <view v-for="item in detail.items" :key="item.id" class="goods" @click="goGoods(item)">
          <image v-if="item.coverUrl" class="cover" :src="item.coverUrl" mode="aspectFill" />
          <view v-else class="cover fallback">{{ (item.productName || "").slice(0, 2) }}</view>
          <view class="info">
            <text class="gname">{{ item.productName }}</text>
            <text class="spec">{{ item.specName || "默认规格" }}</text>
            <text v-if="item.invalidReason" class="warn">{{ item.invalidReason }}</text>
            <view class="row">
              <text class="price">¥{{ salePrice(item) }}</text>
              <view class="qty-box" @click.stop>
                <text class="qty-btn" @click="changeQty(item, -1)">−</text>
                <text class="qty-num">{{ item.quantity }}{{ item.sellUnitName || "" }}</text>
                <text class="qty-btn" @click="changeQty(item, 1)">+</text>
              </view>
            </view>
            <text class="remove" @click.stop="onRemove(item)">移出</text>
          </view>
        </view>
      </view>

      <view v-if="detail.items.length" class="bar">
        <view class="sum">
          <text class="sum-label">合计</text>
          <text class="sum-price">¥{{ money(detail.amount) }}</text>
        </view>
        <button class="bar-btn light" @click="continueAdd">继续添加</button>
        <button class="bar-btn" :disabled="!detail.canSubmit" @click="goOrder">去下单</button>
      </view>
      <text v-if="detail.items.length && !detail.canSubmit" class="block-tip">有商品无法结算，请先移出或等待恢复后再下单</text>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import {
  deletePlan,
  deletePlanItem,
  exportPlanPpt,
  fetchPlanDetail,
  renamePlan,
  updatePlanItem,
  type PlanDetailVO,
  type PlanItemVO,
} from "@/api/plan";
import { salePrice } from "@/utils/price";
import { ApiError, BASE_URL } from "@/utils/request";
import { prefetchImageField } from "@/utils/media";
import { setPickingPlan } from "@/utils/planPicking";

const planId = ref(0);
const detail = ref<PlanDetailVO | null>(null);
const loading = ref(false);
const qtyBusy = ref(false);
const exporting = ref(false);
const statusBarHeight = ref(20);
const exportRight = ref(96);

try {
  const sys = uni.getSystemInfoSync();
  statusBarHeight.value = sys.statusBarHeight || 20;
  const menu = uni.getMenuButtonBoundingClientRect?.();
  if (menu && menu.left) {
    exportRight.value = Math.max(12, sys.windowWidth - menu.left + 8);
  }
} catch {
  // ignore
}

const canExport = computed(() => (detail.value?.items || []).some((item) => !item.invalidReason));

onLoad((query) => {
  planId.value = Number((query && query.id) || 0);
});

onShow(() => {
  if (!planId.value) return;
  load();
});

async function load() {
  loading.value = !detail.value;
  try {
    const res = await fetchPlanDetail(planId.value);
    detail.value = res.data || null;
    await Promise.all((detail.value?.items || []).map((item) => prefetchImageField(item, "coverUrl")));
  } catch (e: unknown) {
    uni.showToast({ title: messageOf(e, "加载失败"), icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goBack() {
  uni.navigateBack({ fail: () => uni.navigateTo({ url: "/pages/plan/list" }) });
}

function goGoods(item: PlanItemVO) {
  if (!item.productId) {
    return;
  }
  const skuQuery = item.skuId ? `&skuId=${item.skuId}` : "";
  const unitQuery = item.sellUnitId ? `&sellUnitId=${item.sellUnitId}` : "";
  uni.navigateTo({ url: `/pages/goods/detail?id=${item.productId}${skuQuery}${unitQuery}` });
}

function continueAdd() {
  if (!planId.value) return;
  setPickingPlan(planId.value);
  uni.switchTab({ url: "/pages/index/index" });
}

function resolveDownloadUrl(url: string, objectKey?: string) {
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    return url;
  }
  if (objectKey) {
    return `${BASE_URL}/api/app/file/download?objectKey=${encodeURIComponent(objectKey)}`;
  }
  if (url?.startsWith("/")) {
    return `${BASE_URL}${url}`;
  }
  return url;
}

async function onExportPpt() {
  if (exporting.value || !planId.value) return;
  const exportable = (detail.value?.items || []).filter((item) => !item.invalidReason);
  if (!exportable.length) {
    uni.showToast({ title: "没有可导出的商品", icon: "none" });
    return;
  }
  exporting.value = true;
  uni.showLoading({ title: "生成中...", mask: true });
  try {
    const res = await exportPlanPpt(planId.value);
    const data = res.data;
    if (!data?.downloadUrl && !data?.objectKey) {
      throw new Error("未返回下载地址");
    }
    const downloadUrl = resolveDownloadUrl(data.downloadUrl, data.objectKey);
    const filePath = await new Promise<string>((resolve, reject) => {
      uni.downloadFile({
        url: downloadUrl,
        success: (r) => {
          if (r.statusCode === 200 && r.tempFilePath) {
            resolve(r.tempFilePath);
          } else {
            reject(new Error("下载失败"));
          }
        },
        fail: (err) => reject(new Error(err.errMsg || "下载失败")),
      });
    });
    await new Promise<void>((resolve, reject) => {
      uni.openDocument({
        filePath,
        showMenu: true,
        fileType: "pdf",
        success: () => resolve(),
        fail: (err) => reject(new Error(err.errMsg || "打开失败")),
      });
    });
  } catch (e: unknown) {
    if (e instanceof ApiError && e.maintenance) {
      return;
    }
    uni.showToast({ title: messageOf(e, "导出失败"), icon: "none" });
  } finally {
    exporting.value = false;
    uni.hideLoading();
  }
}

function goOrder() {
  if (!detail.value?.canSubmit) {
    uni.showToast({ title: "有商品无法结算", icon: "none" });
    return;
  }
  uni.navigateTo({ url: `/pages/order/confirm?planId=${planId.value}` });
}

function onDeletePlan() {
  uni.showModal({
    title: "删除方案",
    content: `删除「${detail.value?.name || "该方案"}」？方案里的商品会一起移除，不影响已下的订单。`,
    success: async (res) => {
      if (!res.confirm || !planId.value) return;
      try {
        await deletePlan(planId.value);
        uni.navigateBack();
      } catch (e: unknown) {
        uni.showToast({ title: messageOf(e, "删除失败"), icon: "none" });
      }
    },
  });
}

function onRename() {
  uni.showModal({
    title: "修改方案名称",
    editable: true,
    placeholderText: detail.value?.name || "请输入方案名称",
    success: async (res) => {
      if (!res.confirm || !planId.value) return;
      const name = String((res as { content?: string }).content || "").trim();
      if (!name) {
        uni.showToast({ title: "请填写方案名称", icon: "none" });
        return;
      }
      try {
        const updated = await renamePlan(planId.value, name);
        detail.value = updated.data || detail.value;
      } catch (e: unknown) {
        uni.showToast({ title: messageOf(e, "修改失败"), icon: "none" });
      }
    },
  });
}

async function changeQty(item: PlanItemVO, delta: number) {
  if (qtyBusy.value) return;
  const convert = item.convertQty && item.convertQty > 0 ? item.convertQty : 1;
  const minOrder = item.minOrderQty && item.minOrderQty > 0 ? item.minOrderQty : 1;
  const floor = Math.max(1, Math.ceil(minOrder / convert));
  const next = (item.quantity || 0) + delta;
  if (next < floor) {
    uni.showToast({ title: `起订量至少 ${floor}`, icon: "none" });
    return;
  }
  qtyBusy.value = true;
  try {
    await updatePlanItem(item.id, { quantity: next });
    await load();
  } catch (e: unknown) {
    uni.showToast({ title: messageOf(e, "修改数量失败"), icon: "none" });
  } finally {
    qtyBusy.value = false;
  }
}

function onRemove(item: PlanItemVO) {
  uni.showModal({
    title: "移出商品",
    content: `从方案中移出「${item.productName}」？`,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await deletePlanItem(item.id);
        await load();
      } catch (e: unknown) {
        uni.showToast({ title: messageOf(e, "移出失败"), icon: "none" });
      }
    },
  });
}

function money(value?: number | string) {
  return Number(value || 0).toFixed(2);
}

function messageOf(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}
</script>

<style scoped>
.nav-wrap {
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
}
.nav {
  position: relative;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-back {
  position: absolute;
  left: 8rpx;
  top: 0;
  bottom: 0;
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-back-icon {
  font-size: 56rpx;
  line-height: 1;
  color: #111827;
  margin-top: -8rpx;
}
.nav-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #111827;
}
.export-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.export-btn.disabled {
  opacity: 0.35;
}
.export-icon {
  position: relative;
  width: 36rpx;
  height: 36rpx;
}
.export-tray {
  position: absolute;
  left: 4rpx;
  right: 4rpx;
  bottom: 2rpx;
  height: 16rpx;
  border: 3rpx solid #374151;
  border-top: none;
  border-radius: 0 0 4rpx 4rpx;
  box-sizing: border-box;
}
.export-arrow {
  position: absolute;
  left: 50%;
  top: 0;
  width: 3rpx;
  height: 18rpx;
  margin-left: -1.5rpx;
  background: #374151;
}
.export-arrow::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  width: 12rpx;
  height: 12rpx;
  margin-left: -6rpx;
  border-left: 3rpx solid #374151;
  border-top: 3rpx solid #374151;
  transform: rotate(45deg);
  box-sizing: border-box;
}
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 0 0 180rpx;
  box-sizing: border-box;
}
.head,
.empty,
.items,
.state {
  margin-left: 24rpx;
  margin-right: 24rpx;
}
.head {
  margin-top: 24rpx;
}
.state,
.empty {
  padding: 80rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #9ca3af;
}
.empty-title {
  color: #1f2937;
  font-size: 32rpx;
  font-weight: 700;
}
.empty-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  text-align: center;
  line-height: 1.6;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}
.name {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}
.head-actions {
  display: flex;
  gap: 24rpx;
  flex-shrink: 0;
}
.rename {
  color: #ff5a3d;
  font-size: 26rpx;
}
.goods {
  display: flex;
  gap: 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.cover {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  background: #f3f4f6;
  flex-shrink: 0;
}
.fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 28rpx;
}
.info {
  flex: 1;
  min-width: 0;
}
.gname {
  display: block;
  font-size: 28rpx;
  color: #1f2937;
  font-weight: 600;
}
.spec {
  display: block;
  margin-top: 8rpx;
  color: #6b7280;
  font-size: 24rpx;
}
.warn {
  display: block;
  margin-top: 8rpx;
  color: #ff5a3d;
  font-size: 22rpx;
}
.row {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.price {
  color: #ff5a3d;
  font-size: 30rpx;
  font-weight: 700;
}
.qty-box {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.qty-btn {
  width: 44rpx;
  height: 44rpx;
  border-radius: 22rpx;
  background: #f3f4f6;
  text-align: center;
  line-height: 44rpx;
  font-size: 32rpx;
}
.qty-num {
  font-size: 26rpx;
  min-width: 48rpx;
  text-align: center;
}
.remove {
  display: inline-block;
  margin-top: 8rpx;
  color: #9ca3af;
  font-size: 22rpx;
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
}
.sum {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.sum-label {
  font-size: 22rpx;
  color: #9ca3af;
}
.sum-price {
  color: #ff5a3d;
  font-size: 32rpx;
  font-weight: 700;
}
.bar-btn {
  margin: 0;
  background: #ff5a3d;
  color: #fff;
  font-size: 28rpx;
  border-radius: 40rpx;
  padding: 0 28rpx;
}
.bar-btn.light {
  background: #fff;
  color: #ff5a3d;
  border: 1px solid #ff5a3d;
}
.bar-btn[disabled] {
  background: #f3b5a8;
  color: #fff;
}
.block-tip {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  text-align: center;
  color: #ff5a3d;
  font-size: 22rpx;
}
.primary {
  margin-top: 32rpx;
  width: 80%;
  background: #ff5a3d;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
}
</style>
