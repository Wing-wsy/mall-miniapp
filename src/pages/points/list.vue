<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!list.length" class="empty">暂无可兑换商品</view>
    <view v-else class="goods-grid">
      <view v-for="item in list" :key="item.id" class="goods-card" @click="goDetail(item.id)">
        <view class="cover-wrap">
          <image v-if="item.coverUrl" class="cover-img" :src="item.coverUrl" mode="aspectFill" />
          <view v-else class="cover-fallback">
            <text>{{ (item.name || "").slice(0, 1) }}</text>
          </view>
        </view>
        <view class="body">
          <text class="name">{{ item.name }}</text>
          <view class="price-row">
            <text class="price">{{ item.points }} 积分</text>
            <text v-if="item.multiSpec" class="from">起</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchPointProducts, type PointProductCardVO } from "@/api/point";

const list = ref<PointProductCardVO[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const res = await fetchPointProducts();
    list.value = res.data || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/points/detail?id=${id}` });
}

onShow(load);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 24rpx;
  box-sizing: border-box;
}
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.goods-card {
  width: 48.5%;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}
.cover-wrap {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  overflow: hidden;
}
.cover-img,
.cover-fallback {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
.cover-fallback {
  background: #ffe8e2;
  color: #ff5a3d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-weight: 700;
}
.body {
  padding: 16rpx 18rpx 20rpx;
}
.name {
  font-size: 26rpx;
  color: #111827;
  line-height: 1.4;
  height: 72rpx;
  overflow: hidden;
}
.price-row {
  margin-top: 8rpx;
  display: flex;
  align-items: baseline;
  gap: 10rpx;
}
.price {
  color: #ff5a3d;
  font-size: 30rpx;
  font-weight: 700;
}
.from {
  color: #ff5a3d;
  font-size: 22rpx;
}
.empty {
  padding-top: 200rpx;
  text-align: center;
  color: #9ca3af;
}
</style>
