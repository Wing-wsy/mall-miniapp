<template>
  <view class="page" v-if="order">
    <view class="card">
      <view v-for="item in order.items" :key="item.id" class="goods">
        <image v-if="item.coverUrl" class="cover" :src="item.coverUrl" mode="aspectFill" />
        <view v-else class="cover fallback">{{ (item.productName || "").slice(0, 1) }}</view>
        <view class="info">
          <text class="gname">{{ item.productName }}</text>
          <text class="spec">
            {{ item.itemType === 2 ? "礼盒" : item.specName }} x{{ item.quantity }}{{ item.itemType === 2 ? "盒" : "" }}
          </text>
        </view>
      </view>
      <text class="amt">整单 {{ amountText }}</text>
      <text class="no">订单号 {{ order.orderNo }}</text>
    </view>

    <view class="card">
      <text class="label">评分<span class="req">*</span></text>
      <view class="stars">
        <text
          v-for="n in 5"
          :key="n"
          class="star"
          :class="{ on: n <= rating, disabled: readonly }"
          @click="onStar(n)"
        >
          ★
        </text>
      </view>
    </view>

    <view class="card">
      <text class="label">评价内容（选填）</text>
      <textarea
        v-if="!readonly"
        v-model="content"
        class="area"
        maxlength="500"
        placeholder="说说这次购物体验，最多500字"
      />
      <text v-else class="content-ro">{{ content || "未填写文字评价" }}</text>
    </view>

    <view class="card">
      <text class="label">晒图（选填，最多3张）</text>
      <view class="pics">
        <view v-for="(url, idx) in previewUrls" :key="`${images[idx] || url}-${idx}`" class="pic" @click="preview(idx)">
          <image :src="url" mode="aspectFill" class="img" />
          <text v-if="!readonly" class="del" @click.stop="removeImage(idx)">×</text>
        </view>
        <button
          v-if="!readonly && images.length < 3"
          class="pic add"
          hover-class="add-on"
          :disabled="uploading"
          @tap="pickImages"
        >
          {{ uploading ? "..." : "+" }}
        </button>
      </view>
      <text v-if="readonly && !previewUrls.length" class="hint">未上传图片</text>
    </view>

    <view v-if="!readonly" class="footer">
      <button class="primary" :disabled="submitting" @click="submit">提交评价</button>
    </view>
  </view>
  <view v-else class="state">{{ error || "加载中..." }}</view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  fetchOrderDetail,
  fetchOrderReview,
  submitOrderReview,
  type OrderVO,
} from "@/api/order";
import { uploadAppFile } from "@/api/file";
import { prefetchCoverUrls, prefetchImage } from "@/utils/media";

const order = ref<OrderVO | null>(null);
const error = ref("");
const rating = ref(0);
const content = ref("");
/** 提交用的远端 URL */
const images = ref<string[]>([]);
/** 页面回显用（真机预取后的本地路径 / 选图临时路径） */
const previewUrls = ref<string[]>([]);
const submitting = ref(false);
const uploading = ref(false);
const readonly = ref(false);

const amountText = computed(() => {
  if (!order.value) {
    return "";
  }
  if (order.value.orderType === 1) {
    return `${order.value.pointsAmount || 0} 积分`;
  }
  if (order.value.orderType === 2) {
    return "兑换券";
  }
  return `¥${Number(order.value.payAmount || 0).toFixed(2)}`;
});

onLoad(async (query) => {
  const id = Number((query && query.id) || 0);
  if (!id) {
    error.value = "订单不存在";
    return;
  }
  try {
    const res = await fetchOrderDetail(id);
    order.value = res.data;
    await prefetchCoverUrls(order.value?.items);
    if (order.value?.reviewed) {
      readonly.value = true;
      const reviewRes = await fetchOrderReview(id);
      const review = reviewRes.data;
      rating.value = review?.rating || 0;
      content.value = review?.content || "";
      images.value = [...(review?.images || [])];
      previewUrls.value = await Promise.all(images.value.map((url) => prefetchImage(url)));
      return;
    }
    if (!order.value?.canReview) {
      error.value = "当前订单不可评价";
      order.value = null;
      return;
    }
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  }
});

function onStar(n: number) {
  if (readonly.value) {
    return;
  }
  rating.value = n;
}

function pickImages() {
  if (uploading.value || readonly.value) {
    return;
  }
  const remain = 3 - images.value.length;
  if (remain <= 0) {
    return;
  }
  const fail = (err: { errMsg?: string }) => {
    const msg = String(err?.errMsg || "");
    if (msg.includes("cancel") || msg.includes("取消")) {
      return;
    }
    uni.showToast({
      title: msg.replace(/^chooseMedia:fail\s*/i, "").replace(/^chooseImage:fail\s*/i, "") || "无法选择图片",
      icon: "none",
    });
  };
  const onPicked = (paths: string[]) => {
    void uploadPicked(paths.slice(0, remain));
  };
  const chooseMedia = (uni as any).chooseMedia as
    | ((options: {
        count: number;
        mediaType: string[];
        sourceType: string[];
        success: (res: { tempFiles?: Array<{ tempFilePath?: string }> }) => void;
        fail: (err: { errMsg?: string }) => void;
      }) => void)
    | undefined;
  if (typeof chooseMedia === "function") {
    chooseMedia({
      count: remain,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res: { tempFiles?: Array<{ tempFilePath?: string }> }) => {
        onPicked((res.tempFiles || []).map((f) => f.tempFilePath || "").filter(Boolean));
      },
      fail,
    });
    return;
  }
  uni.chooseImage({
    count: remain,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => onPicked(res.tempFilePaths || []),
    fail,
  });
}

async function uploadPicked(paths: string[]) {
  if (!paths.length) {
    uni.showToast({ title: "未选择图片", icon: "none" });
    return;
  }
  uploading.value = true;
  uni.showLoading({ title: "上传中", mask: true });
  try {
    for (const path of paths) {
      const uploaded = await uploadAppFile(path, "review");
      if (uploaded.url) {
        images.value.push(uploaded.url);
        // 优先用本地临时路径回显；远端 URL 再预取一份兜底
        const local = path || (await prefetchImage(uploaded.url));
        previewUrls.value.push(local);
      }
    }
  } catch (e: unknown) {
    const raw = e instanceof Error ? e.message : "上传失败";
    const title = /invalid url|uploadFile/i.test(raw) ? "上传失败，请重新编译后再试" : raw;
    setTimeout(() => {
      uni.showToast({ title, icon: "none" });
    }, 80);
  } finally {
    uploading.value = false;
    uni.hideLoading();
  }
}

function removeImage(idx: number) {
  images.value.splice(idx, 1);
  previewUrls.value.splice(idx, 1);
}

function preview(idx: number) {
  const urls = previewUrls.value.length ? previewUrls.value : images.value;
  uni.previewImage({ current: urls[idx], urls });
}

async function submit() {
  if (!order.value || submitting.value || readonly.value) {
    return;
  }
  if (!rating.value) {
    uni.showToast({ title: "请选择评分", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    await submitOrderReview(order.value.id, {
      rating: rating.value,
      content: content.value.trim() || undefined,
      images: images.value,
    });
    uni.showToast({ title: "评价成功", icon: "success" });
    setTimeout(() => {
      uni.navigateBack();
    }, 400);
  } catch (e: any) {
    uni.showToast({ title: e?.message || "提交失败", icon: "none" });
  } finally {
    submitting.value = false;
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
.card {
  margin: 16rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}
.goods {
  display: flex;
  gap: 16rpx;
  align-items: center;
  padding: 8rpx 0;
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
}
.spec {
  display: block;
  margin-top: 6rpx;
  color: #9ca3af;
  font-size: 22rpx;
}
.amt {
  display: block;
  margin-top: 12rpx;
  font-weight: 700;
}
.no {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
.label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 26rpx;
}
.req {
  color: #ff5a3d;
  margin-left: 4rpx;
}
.stars {
  display: flex;
  gap: 16rpx;
}
.star {
  font-size: 56rpx;
  color: #e5e7eb;
  line-height: 1;
}
.star.on {
  color: #f59e0b;
}
.star.disabled {
  pointer-events: none;
}
.area {
  width: 100%;
  min-height: 180rpx;
  font-size: 26rpx;
  line-height: 1.5;
}
.content-ro {
  display: block;
  font-size: 26rpx;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
}
.pics {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.pic {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
  padding: 0;
  margin: 0;
  background: #f3f4f6;
}
.img {
  width: 100%;
  height: 100%;
}
.del {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 28rpx;
}
.add {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #9ca3af;
  border: 2rpx dashed #d1d5db;
  background: #fafafa;
}
.add::after {
  border: none;
}
.add-on {
  opacity: 0.7;
}
.hint {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9ca3af;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
}
.primary {
  background: #ff5a3d;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
}
.primary::after {
  border: none;
}
.primary[disabled] {
  opacity: 0.6;
}
</style>
