<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!festivals.length" class="empty">暂无进行中的节日专题</view>
    <view v-else>
      <view v-for="fest in festivals" :key="fest.id" class="block">
        <view class="block-head">
          <text class="block-title">{{ fest.name }}</text>
          <text v-if="(trails[fest.id] || []).length" class="back" @click="popDrill(fest.id)">返回</text>
        </view>
        <view v-if="isLeaf(viewingOf(fest))" class="list">
          <view class="list-item" @click="goList(viewingOf(fest)!)">
            <view class="thumb">
              <text>{{ viewingOf(fest)!.name.slice(0, 1) }}</text>
            </view>
            <text class="name">查看商品</text>
          </view>
        </view>
        <view v-else class="list">
          <view
            v-for="item in viewingOf(fest)?.children || []"
            :key="item.id"
            class="list-item"
            @click="onTap(fest, item)"
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
const trails = ref<Record<number, CategoryNodeVO[]>>({});
const loading = ref(false);

function isLeaf(node?: CategoryNodeVO) {
  if (!node) return false;
  if (node.leaf === true) return true;
  return !(node.children && node.children.length);
}

function viewingOf(fest: CategoryNodeVO) {
  const trail = trails.value[fest.id] || [];
  return trail.length ? trail[trail.length - 1] : fest;
}

function popDrill(id: number) {
  const trail = trails.value[id] || [];
  trails.value = { ...trails.value, [id]: trail.slice(0, -1) };
}

function onTap(fest: CategoryNodeVO, item: CategoryNodeVO) {
  if (isLeaf(item)) {
    goList(item);
    return;
  }
  const trail = trails.value[fest.id] || [];
  trails.value = { ...trails.value, [fest.id]: [...trail, item] };
}

async function load() {
  loading.value = true;
  try {
    const res = await fetchFestivalCategoryTree();
    festivals.value = res.data || [];
    trails.value = {};
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.block-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.back {
  font-size: 24rpx;
  color: #d97706;
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
