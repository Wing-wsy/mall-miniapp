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
          <text class="crumb-link" @click="backToRoot">{{ current?.name }}</text>
          <template v-for="(node, i) in trail" :key="node.id">
            <text class="crumb-sep">/</text>
            <text class="crumb-link" @click="trail = trail.slice(0, i + 1)">{{ node.name }}</text>
          </template>
        </view>

        <!-- 叶子分类：直接展示商品 -->
        <template v-if="viewing && isLeaf(viewing)">
          <view v-if="goodsLoading" class="empty-inline">加载中...</view>
          <view v-else-if="!goods.length" class="empty-inline">暂无商品</view>
          <view v-else class="goods-grid">
            <view
              v-for="item in goods"
              :key="item.id"
              class="goods-card"
              @click="goDetail(item.id)"
            >
              <view class="cover-wrap">
                <image
                  v-if="item.coverUrl"
                  class="cover-img"
                  :src="item.coverUrl"
                  mode="aspectFill"
                />
                <view v-else class="cover-fallback">
                  <text>{{ (item.name || "").slice(0, 1) }}</text>
                </view>
                <text
                  v-if="publicShipFrom(item)"
                  class="ship-badge"
                  :class="{ self: item.selfOperated }"
                >
                  {{ publicShipFrom(item) }}
                </text>
              </view>
              <view class="body">
                <text class="name">{{ item.name }}</text>
                <view class="price-row">
                  <view class="price-left">
                    <text class="price">¥{{ salePrice(item) }}</text>
                    <text v-if="item.multiSpec" class="from">起</text>
                    <text v-if="linePrice(item)" class="origin">¥{{ linePrice(item) }}</text>
                  </view>
                  <goods-add-cart-btn :product-id="item.id" :multi-spec="!!item.multiSpec" />
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 非叶子：展示子分类 -->
        <view v-else class="list">
          <view
            v-for="item in viewing?.children || []"
            :key="item.id"
            class="list-item"
            @click="onTapChild(item)"
          >
            <view class="thumb" :class="{ 'has-icon': !!item.iconUrl }">
              <image
                v-if="item.iconUrl"
                class="thumb-img"
                :src="item.iconUrl"
                mode="aspectFill"
              />
              <text v-else>{{ item.name.slice(0, 1) }}</text>
            </view>
            <text class="name">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchProductCategoryTree, type CategoryNodeVO } from "@/api/category";
import { fetchProductListByCategory, type ProductCardVO } from "@/api/product";
import { linePrice, salePrice } from "@/utils/price";
import { publicShipFrom } from "@/utils/supplier";
import { prefetchImageField } from "@/utils/media";
import { guardMaintenanceNavigate, syncMaintenanceFromContact } from "@/utils/maintenance";
import { fetchShopContact } from "@/api/shop";
import GoodsAddCartBtn from "@/components/goods-add-cart-btn.vue";

const categories = ref<CategoryNodeVO[]>([]);
const active = ref(0);
const trail = ref<CategoryNodeVO[]>([]);
const loading = ref(false);
const goods = ref<ProductCardVO[]>([]);
const goodsLoading = ref(false);
let goodsReq = 0;

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

async function prefetchChildIcons(nodes: CategoryNodeVO[]) {
  const tasks: Promise<unknown>[] = [];
  function walk(list: CategoryNodeVO[], depth: number) {
    for (const node of list || []) {
      if (depth >= 1) {
        tasks.push(prefetchImageField(node, "iconUrl"));
      }
      if (node.children?.length) {
        walk(node.children, depth + 1);
      }
    }
  }
  walk(nodes, 0);
  if (tasks.length) {
    await Promise.all(tasks);
  }
}

async function loadGoods(categoryId: number) {
  const req = ++goodsReq;
  goodsLoading.value = true;
  goods.value = [];
  try {
    const res = await fetchProductListByCategory(categoryId);
    if (req !== goodsReq) return;
    goods.value = res.data || [];
    await Promise.all(goods.value.map((item) => prefetchImageField(item, "coverUrl")));
  } catch (e: any) {
    if (req !== goodsReq) return;
    uni.showToast({ title: e?.message || "加载失败", icon: "none" });
  } finally {
    if (req === goodsReq) {
      goodsLoading.value = false;
    }
  }
}

watch(
  viewing,
  (node) => {
    if (node && isLeaf(node)) {
      loadGoods(node.id);
    } else {
      goodsReq += 1;
      goods.value = [];
      goodsLoading.value = false;
    }
  },
  { immediate: true },
);

async function load() {
  loading.value = true;
  try {
    const res = await fetchProductCategoryTree();
    const tree = res.data || [];
    await prefetchChildIcons(tree);
    categories.value = tree;
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
}

function backToRoot() {
  trail.value = [];
}

function onTapChild(item: CategoryNodeVO) {
  trail.value = [...trail.value, item];
}

async function goDetail(id: number) {
  try {
    const res = await fetchShopContact();
    syncMaintenanceFromContact(res.data);
  } catch {
    // ignore
  }
  if (!guardMaintenanceNavigate()) {
    return;
  }
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` });
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
  padding: 24rpx 20rpx;
  box-sizing: border-box;
}

.main-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 16rpx;
  padding: 0 8rpx;
}

.crumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 0 8rpx;
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
  overflow: hidden;
}

.thumb.has-icon {
  background: #f3f4f6;
}

.thumb-img {
  width: 100%;
  height: 100%;
  display: block;
}

.name {
  font-size: 24rpx;
  color: #374151;
}

.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.goods-card {
  width: 48.5%;
  background: #f9fafb;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.cover-wrap {
  position: relative;
  width: 100%;
  height: 220rpx;
  overflow: hidden;
  background: #f3f4f6;
}

.cover-img,
.cover-fallback {
  width: 100%;
  height: 100%;
}

.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffe8e2;
  color: #ff5a3d;
  font-size: 40rpx;
  font-weight: 700;
}

.ship-badge {
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  padding: 4rpx 10rpx;
  font-size: 20rpx;
  color: #fff;
  background: rgba(17, 24, 39, 0.55);
  border-radius: 8rpx;
}

.ship-badge.self {
  background: #ff5a3d;
}

.body {
  padding: 12rpx 14rpx 16rpx;
}

.body .name {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 24rpx;
  color: #111827;
  line-height: 1.35;
  min-height: 64rpx;
}

.price-row {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  gap: 8rpx;
}

.price-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.price {
  font-size: 28rpx;
  font-weight: 700;
  color: #ff5a3d;
}

.from {
  margin-left: 4rpx;
  font-size: 20rpx;
  color: #ff5a3d;
}

.origin {
  margin-left: 8rpx;
  font-size: 20rpx;
  color: #9ca3af;
  text-decoration: line-through;
}

.empty,
.empty-inline {
  padding: 80rpx 40rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 28rpx;
}

.empty-inline {
  padding: 48rpx 20rpx;
}
</style>
