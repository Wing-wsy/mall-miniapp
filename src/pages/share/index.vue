<template>
  <view class="page">
    <view class="card">
      <text class="title">分享功能</text>
      <text class="tip">允许范围 {{ rangeText }}（含两端）</text>
      <view class="row">
        <text class="label">分享比例</text>
        <input class="input" type="digit" v-model="rateText" placeholder="例如 120" />
        <text class="unit">%</text>
      </view>
      <button class="btn" :loading="saving" @click="onSave">保存比例</button>
      <button class="btn ghost" open-type="share" :disabled="!shareActive">分享到首页</button>
      <button class="btn ghost" :loading="copying" :disabled="!shareActive" @click="onCopy">复制首页链接</button>
    </view>

    <view class="card">
      <text class="title">我的下线</text>
      <view v-if="!downlines.length" class="empty">暂无下线</view>
      <view v-for="item in downlines" :key="item.memberNo" class="down">
        <view class="meta">
          <text class="name">{{ item.nickname || "微信用户" }}</text>
          <text class="sub">{{ item.phone || "-" }} · {{ item.createTime || "" }}</text>
        </view>
      </view>
      <text v-if="hasMore" class="more" @click="loadMore">加载更多</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow, onShareAppMessage } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";
import {
  createShareLink,
  fetchShareDownlines,
  fetchShareMe,
  saveShareRate,
  type ShareDownlineVO,
} from "@/api/share";

const userStore = useUserStore();
const saving = ref(false);
const copying = ref(false);
const rateText = ref("");
const minRate = ref(120);
const maxRate = ref(150);
const shareActive = ref(false);
const shareCode = ref("");
const downlines = ref<ShareDownlineVO[]>([]);
const total = ref(0);
const page = ref(1);

const rangeText = computed(() => `${strip(minRate.value)}%~${strip(maxRate.value)}%`);
const hasMore = computed(() => downlines.value.length < total.value);

onShareAppMessage(() => {
  const sc = shareCode.value || userStore.userInfo?.shareCode || "";
  return {
    title: "Mall精选",
    path: `/pages/share/enter?sc=${encodeURIComponent(sc)}`,
  };
});

onShow(() => {
  void loadMe();
  page.value = 1;
  void loadDownlines(true);
});

async function loadMe() {
  const res = await fetchShareMe();
  const me = res.data;
  if (!me?.canShare) {
    uni.showToast({ title: "当前等级没有分享特权", icon: "none" });
    setTimeout(() => uni.navigateBack(), 400);
    return;
  }
  minRate.value = Number(me.shareRateMin ?? 120);
  maxRate.value = Number(me.shareRateMax ?? 150);
  shareActive.value = !!me.shareActive;
  shareCode.value = me.shareCode || "";
  rateText.value = me.shareRate == null || me.shareRate === "" ? "" : strip(me.shareRate);
  await userStore.refreshProfile().catch(() => undefined);
}

async function onSave() {
  const rate = Number(rateText.value);
  if (!Number.isFinite(rate)) {
    uni.showToast({ title: "请填写分享比例", icon: "none" });
    return;
  }
  saving.value = true;
  try {
    const res = await saveShareRate(rate);
    shareActive.value = !!res.data?.shareActive;
    shareCode.value = res.data?.shareCode || "";
    rateText.value = res.data?.shareRate == null ? String(rate) : strip(res.data.shareRate);
    await userStore.refreshProfile().catch(() => undefined);
    uni.showToast({ title: "已保存", icon: "success" });
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : "保存失败", icon: "none" });
  } finally {
    saving.value = false;
  }
}

async function onCopy() {
  copying.value = true;
  try {
    const res = await createShareLink();
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
  } finally {
    copying.value = false;
  }
}

async function loadDownlines(reset: boolean) {
  const next = reset ? 1 : page.value + 1;
  const res = await fetchShareDownlines(next, 20);
  total.value = res.data?.total || 0;
  const list = res.data?.list || [];
  downlines.value = reset ? list : downlines.value.concat(list);
  page.value = next;
}

function loadMore() {
  void loadDownlines(false);
}

function strip(value: number | string) {
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return n.toString().replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 24rpx;
  box-sizing: border-box;
}
.card {
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}
.title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}
.tip {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #6b7280;
}
.row {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  gap: 12rpx;
}
.label {
  font-size: 28rpx;
  color: #374151;
}
.input {
  flex: 1;
  height: 72rpx;
  padding: 0 20rpx;
  background: #f3f4f6;
  border-radius: 12rpx;
  font-size: 28rpx;
}
.unit {
  font-size: 28rpx;
  color: #6b7280;
}
.btn {
  margin-top: 24rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: #ff5a3d;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
}
.btn.ghost {
  background: #fff;
  color: #ff5a3d;
  border: 1rpx solid #ff5a3d;
}
.btn[disabled] {
  opacity: 0.45;
}
.empty {
  margin-top: 24rpx;
  font-size: 26rpx;
  color: #9ca3af;
}
.down {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}
.name {
  display: block;
  font-size: 28rpx;
  color: #111827;
}
.sub {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #9ca3af;
}
.more {
  display: block;
  margin-top: 16rpx;
  text-align: center;
  font-size: 26rpx;
  color: #ff5a3d;
}
</style>
