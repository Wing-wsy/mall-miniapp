<template>
  <view class="page" v-if="order">
    <view class="card">
      <view v-for="item in order.items" :key="item.id" class="goods">
        <image v-if="item.coverUrl" class="cover" :src="item.coverUrl" mode="aspectFill" />
        <view v-else class="cover fallback">{{ (item.productName || "").slice(0, 1) }}</view>
        <view class="info">
          <text class="gname">{{ item.productName }}</text>
          <text class="spec">{{ item.specName }} x{{ item.quantity }}</text>
        </view>
      </view>
      <text class="amt">整单 {{ amountText }}</text>
    </view>
    <view class="card">
      <text class="label">售后类型</text>
      <view class="types">
        <text
          v-for="t in types"
          :key="t.value"
          class="chip"
          :class="{ on: type === t.value }"
          @click="onType(t.value)"
        >
          {{ t.label }}
        </text>
      </view>
    </view>
    <view class="card">
      <text class="label">原因</text>
      <view class="types">
        <text
          v-for="item in reasons"
          :key="item.code"
          class="chip"
          :class="{ on: reason === item.code }"
          @click="reason = item.code"
        >
          {{ item.label }}
        </text>
      </view>
    </view>
    <view class="card">
      <text class="label">说明（选填）</text>
      <textarea v-model="remark" class="area" maxlength="200" placeholder="补充说明，最多200字" />
    </view>
    <view class="card">
      <text class="label">凭证（选填，最多3张）</text>
      <view class="pics">
        <view v-for="(url, idx) in images" :key="url" class="pic" @click="preview(idx)">
          <image :src="url" mode="aspectFill" class="img" />
          <text class="del" @click.stop="images.splice(idx, 1)">×</text>
        </view>
        <button
          v-if="images.length < 3"
          class="pic add"
          hover-class="add-on"
          :disabled="uploading"
          @tap="pickImages"
        >
          {{ uploading ? "..." : "+" }}
        </button>
      </view>
    </view>
    <view class="footer">
      <button class="primary" :disabled="submitting" @click="submit">提交申请</button>
    </view>
  </view>
  <view v-else class="state">{{ error || "加载中..." }}</view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { applyAfterSale, fetchAfterSaleReasons, type AfterSaleReasonVO } from "@/api/aftersale";
import { fetchOrderDetail, type OrderVO } from "@/api/order";
import { uploadAppFile } from "@/api/file";

const order = ref<OrderVO | null>(null);
const error = ref("");
const type = ref(1);
const reason = ref("");
const remark = ref("");
const images = ref<string[]>([]);
const reasons = ref<AfterSaleReasonVO[]>([]);
const submitting = ref(false);
const uploading = ref(false);

const types = computed(() => {
  const allowed = order.value?.allowedAfterSaleTypes || [];
  const all = [
    { value: 1, label: "仅退款" },
    { value: 2, label: "退货退款" },
  ];
  return all.filter((t) => allowed.includes(t.value));
});

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
    const allowed = res.data?.allowedAfterSaleTypes || [];
    if (!allowed.length) {
      error.value = "当前订单不可申请售后";
      order.value = null;
      return;
    }
    type.value = allowed.includes(Number(query?.type)) ? Number(query?.type) : allowed[0];
    await loadReasons();
  } catch (e: any) {
    error.value = e?.message || "加载失败";
  }
});

async function loadReasons() {
  const res = await fetchAfterSaleReasons(type.value);
  reasons.value = res.data || [];
  if (!reasons.value.some((r) => r.code === reason.value)) {
    reason.value = reasons.value[0]?.code || "";
  }
}

async function onType(value: number) {
  type.value = value;
  await loadReasons();
}

function pickImages() {
  if (uploading.value) {
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
    uni.showToast({ title: msg.replace(/^chooseMedia:fail\s*/i, "").replace(/^chooseImage:fail\s*/i, "") || "无法选择图片", icon: "none" });
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
      const uploaded = await uploadAppFile(path, "aftersale");
      if (uploaded.url) {
        images.value.push(uploaded.url);
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

function preview(idx: number) {
  uni.previewImage({ current: images.value[idx], urls: images.value });
}

async function submit() {
  if (!order.value || submitting.value) {
    return;
  }
  if (!reason.value) {
    uni.showToast({ title: "请选择原因", icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    const res = await applyAfterSale({
      orderId: order.value.id,
      type: type.value,
      reason: reason.value,
      remark: remark.value.trim() || undefined,
      images: images.value,
    });
    uni.showToast({ title: "已提交", icon: "success" });
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/aftersale/detail?id=${res.data.id}` });
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
.label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 26rpx;
  font-weight: 700;
}
.types {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.chip {
  padding: 10rpx 20rpx;
  border-radius: 28rpx;
  background: #f3f4f6;
  font-size: 24rpx;
  color: #374151;
}
.chip.on {
  background: #ffe8e2;
  color: #ff5a3d;
  font-weight: 700;
}
.area {
  width: 100%;
  min-height: 140rpx;
  font-size: 26rpx;
}
.pics {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}
.pic {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  position: relative;
  overflow: hidden;
  background: #f3f4f6;
}
.img {
  width: 100%;
  height: 100%;
}
.add {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  color: #9ca3af;
  margin: 0;
  padding: 0;
  line-height: 160rpx;
  border: none;
}
.add::after {
  border: none;
}
.add-on {
  background: #e5e7eb;
}
.del {
  position: absolute;
  top: 0;
  right: 8rpx;
  color: #fff;
  font-size: 32rpx;
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
}
.primary {
  margin: 0;
  height: 80rpx;
  line-height: 80rpx;
  background: #ff5a3d;
  color: #fff;
  border-radius: 40rpx;
}
</style>
