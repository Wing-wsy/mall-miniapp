<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!festivals.length" class="empty">暂无进行中的节日专题</view>
    <view v-else>
      <view v-for="fest in festivals" :key="fest.id" class="block">
        <view class="block-head">
          <text class="block-title">{{ fest.name }}</text>
        </view>
        <view class="list">
          <view
            v-for="item in fest.children || []"
            :key="item.id"
            class="list-item"
            @click="goList(item)"
          >
            <view class="thumb">
              <text>{{ item.name.slice(0, 1) }}</text>
            </view>
            <text class="name">{{ item.name }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchFestivalCategoryTree, type CategoryNodeVO } from "@/api/category";

const festivals = ref<CategoryNodeVO[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const res = await fetchFestivalCategoryTree();
    festivals.value = res.data || [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goList(item: CategoryNodeVO) {
  uni.navigateTo({
    url: `/pages/goods/list?festivalId=${item.id}&title=${encodeURIComponent(item.name)}`,
  });
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

.block {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.block-head {
  margin-bottom: 20rpx;
}

.block-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.list {
  display: flex;
  flex-wrap: wrap;
}

.list-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16rpx;
}

.thumb {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  background: #fff1d6;
  color: #d97706;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  margin-bottom: 10rpx;
}

.name {
  font-size: 22rpx;
  color: #374151;
  text-align: center;
}

.empty {
  padding: 120rpx 40rpx;
  text-align: center;
  color: #9ca3af;
}
</style>
