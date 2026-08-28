<template>
  <button
    v-if="visible"
    class="share-btn"
    hover-class="none"
    open-type="share"
    :data-pid="String(productId)"
    @click.stop
  >
    分享
  </button>
</template>

<script setup lang="ts">
defineProps<{
  productId: number;
  visible: boolean;
}>();
</script>

<style scoped>
.share-btn {
  position: absolute;
  right: 8rpx;
  top: 8rpx;
  z-index: 2;
  width: auto;
  min-width: 0;
  height: auto;
  min-height: 0;
  margin: 0;
  padding: 4rpx 14rpx;
  line-height: 1.4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: #fff;
  background: rgba(255, 90, 61, 0.92);
  border-radius: 20rpx;
}
.share-btn::after {
  border: none;
}
</style>
