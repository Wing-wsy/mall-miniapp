<template>
  <view class="page">
    <button type="primary" :loading="loading" @click="runPing">请求 /ping</button>
    <view v-if="error" class="error">{{ error }}</view>
    <view v-if="result" class="result">{{ result }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { pingAppApi } from "@/api/system";

const loading = ref(false);
const result = ref("");
const error = ref("");

async function runPing() {
  loading.value = true;
  error.value = "";
  result.value = "";
  try {
    const data = await pingAppApi();
    result.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    error.value = e?.message || "请求失败，请确认 mall-app-api 已启动（9081）";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page {
  padding: 48rpx;
}
.error {
  margin-top: 24rpx;
  color: #dc2626;
  font-size: 26rpx;
}
.result {
  margin-top: 24rpx;
  padding: 24rpx;
  background: #0b1020;
  color: #d1fae5;
  font-size: 24rpx;
  white-space: pre-wrap;
  border-radius: 12rpx;
}
</style>
