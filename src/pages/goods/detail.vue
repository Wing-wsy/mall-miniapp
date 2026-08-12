<template>
  <view class="page" v-if="product">
    <view class="cover-wrap">
      <image v-if="product.coverUrl" class="cover" :src="product.coverUrl" mode="aspectFill" />
      <view v-else class="cover-fallback">
        <text>{{ product.name }}</text>
      </view>
    </view>
    <view class="panel">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text v-if="product.originPrice" class="origin">¥{{ product.originPrice }}</text>
      </view>
      <text class="name">{{ product.name }}</text>
      <text v-if="product.subtitle" class="subtitle">{{ product.subtitle }}</text>
    </view>
    <view class="panel">
      <text class="section">商品详情</text>
      <text class="detail">{{ product.detailHtml || "暂无详情" }}</text>
    </view>
    <view class="bottom-bar">
      <button class="buy-btn" @click="toast('加购即将上线')">加入购物车</button>
    </view>
  </view>
  <view v-else class="loading">
    <text>{{ error || "加载中..." }}</text>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { fetchProductDetail, type ProductDetailVO } from "@/api/product";

const product = ref<ProductDetailVO | null>(null);
const error = ref("");

function toast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}

onLoad((query) => {
  const id = Number((query && query.id) || 0);
  if (!id) {
    error.value = "商品不存在";
    return;
  }
  fetchProductDetail(id)
    .then((res) => {
      product.value = res.data;
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

.cover-wrap {
  width: 100%;
  height: 680rpx;
  background: #fff;
}

.cover {
  width: 100%;
  height: 680rpx;
}

.cover-fallback {
  width: 100%;
  height: 680rpx;
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

.subtitle {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #6b7280;
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

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 28rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.buy-btn {
  background: #ff5a3d;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
}

.loading {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}
</style>
