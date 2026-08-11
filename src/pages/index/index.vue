<template>
  <view class="page">
    <view class="hero">
      <text class="title">Mall 小程序</text>
      <text class="desc">框架骨架：商品/分类/购物车/我的</text>
    </view>
    <button type="primary" @click="goPing">联调 app-api /ping</button>
  </view>
</template>

<script setup lang="ts">
function goPing() {
  uni.navigateTo({ url: "/pages/ping/index" });
}
</script>

<style scoped>
.page {
  padding: 48rpx;
}
.hero {
  margin-bottom: 48rpx;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #111827;
}
.desc {
  display: block;
  margin-top: 16rpx;
  color: #6b7280;
  font-size: 28rpx;
}
</style>
