<template>
  <view class="page">
    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="!categories.length" class="empty">暂无分类</view>
    <template v-else>
      <scroll-view scroll-y class="side">
        <view
          v-for="(item, index) in categories"
          :key="item.id"
          class="side-item"
          :class="{ active: index === active }"
          @click="selectRoot(index)"
        >
          <view v-if="index === active" class="active-bar" />
          <text>{{ item.name }}</text>
        </view>
      </scroll-view>

      <scroll-view scroll-y class="main">
        <view class="main-title">{{ viewing?.name }}</view>
        <view v-if="trail.length" class="crumb">
          <text class="crumb-link" @click="trail = []">{{ current?.name }}</text>
          <template v-for="(node, i) in trail" :key="node.id">
            <text class="crumb-sep">/</text>
            <text class="crumb-link" @click="trail = trail.slice(0, i + 1)">{{ node.name }}</text>
          </template>
        </view>
        <view v-if="viewing && isLeaf(viewing)" class="list">
          <view class="list-item" @click="goList(viewing)">
            <view class="thumb">
              <text>{{ viewing.name.slice(0, 1) }}</text>
            </view>
            <text class="name">查看商品</text>
          </view>
        </view>
        <view v-else class="list">
          <view
            v-for="item in viewing?.children || []"
            :key="item.id"
            class="list-item"
            @click="onTapChild(item)"
          >
            <view class="thumb">
              <text>{{ item.name.slice(0, 1) }}</text>
            </view>
            <text class="name">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchProductCategoryTree, type CategoryNodeVO } from "@/api/category";

const categories = ref<CategoryNodeVO[]>([]);
const active = ref(0);
const trail = ref<CategoryNodeVO[]>([]);
const loading = ref(false);

const current = computed(() => categories.value[active.value]);
const viewing = computed(() => {
  if (!current.value) return undefined;
  return trail.value.length ? trail.value[trail.value.length - 1] : current.value;
});

function isLeaf(node?: CategoryNodeVO) {
  if (!node) return false;
  if (node.leaf === true) return true;
  return !(node.children && node.children.length);
}

async function load() {
  loading.value = true;
  try {
    const res = await fetchProductCategoryTree();
    categories.value = res.data || [];
    if (active.value >= categories.value.length) {
      active.value = 0;
    }
    trail.value = [];
  } catch (e: any) {
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function selectRoot(index: number) {
  active.value = index;
  trail.value = [];
  const item = categories.value[index];
  if (isLeaf(item)) {
    goList(item);
  }
}

function onTapChild(item: CategoryNodeVO) {
  if (isLeaf(item)) {
    goList(item);
    return;
  }
  trail.value = [...trail.value, item];
}

function goList(item: CategoryNodeVO) {
  uni.navigateTo({
    url: `/pages/goods/list?categoryId=${item.id}&title=${encodeURIComponent(item.name)}`,
  });
}

onShow(load);
</script>

<style scoped>
.page {
  display: flex;
  height: 100vh;
  background: #f7f7f7;
}

.side {
  width: 180rpx;
  background: #f3f4f6;
  height: 100%;
}

.side-item {
  position: relative;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #6b7280;
}

.side-item.active {
  background: #fff;
  color: #111827;
  font-weight: 600;
}

.active-bar {
  position: absolute;
  left: 0;
  top: 30rpx;
  width: 6rpx;
  height: 40rpx;
  border-radius: 0 6rpx 6rpx 0;
  background: #ff5a3d;
}

.main {
  flex: 1;
  background: #fff;
  height: 100%;
  padding: 24rpx 28rpx;
  box-sizing: border-box;
}

.main-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16rpx;
}

.crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.crumb-link {
  color: #ff5a3d;
}

.crumb-sep {
  margin: 0 8rpx;
  color: #d1d5db;
}

.list {
  display: flex;
  flex-wrap: wrap;
}

.list-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
}

.thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  background: #ffe8e2;
  color: #ff5a3d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.name {
  font-size: 24rpx;
  color: #374151;
}

.empty {
  padding: 80rpx 40rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 28rpx;
}
</style>
