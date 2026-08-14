<template>
  <view class="page" :style="pageStyle">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav">
      <text class="brand" :style="{ color: themeStore.primary }">{{ themeStore.brandName }}</text>
      <view class="search" @click="toast('搜索稍后开放')">
        <text class="search-icon">⌕</text>
        <text class="search-placeholder">{{ themeStore.searchPlaceholder }}</text>
      </view>
    </view>

    <scroll-view scroll-y class="scroll" :style="{ height: scrollHeight }">
      <!-- 皮肤主视觉优先 -->
      <view v-if="heroImageUrl" class="banner-swiper hero-wrap" @click="goFestival">
        <image class="banner-img" :src="heroImageUrl" mode="aspectFill" />
      </view>
      <swiper
        v-else
        class="banner-swiper"
        circular
        autoplay
        indicator-dots
        indicator-color="rgba(255,255,255,0.45)"
        indicator-active-color="#ffffff"
      >
        <swiper-item v-for="item in banners" :key="item.id" @click="goDetail(item.productId)">
          <view v-if="item.imageUrl" class="banner-img-wrap">
            <image class="banner-img" :src="item.imageUrl" mode="aspectFill" />
          </view>
          <view v-else class="banner-fallback" :style="{ background: themeStore.primary }">
            <text class="banner-tag">{{ heroTag }}</text>
            <text class="banner-title">{{ item.title || heroTitle }}</text>
            <text class="banner-sub">{{ heroSub }}</text>
          </view>
        </swiper-item>
      </swiper>

      <swiper
        v-if="entryPages.length"
        class="entry-swiper"
        :indicator-dots="entryPages.length > 1"
        indicator-color="#e5e7eb"
        indicator-active-color="#9ca3af"
      >
        <swiper-item v-for="(page, pageIndex) in entryPages" :key="pageIndex">
          <view class="entry-grid">
            <view
              v-for="item in page"
              :key="item.id"
              class="entry"
              @click="onEntry(item)"
            >
              <view
                class="entry-icon"
                :class="{ 'is-custom': !!item.iconUrl }"
                :style="item.iconUrl ? undefined : { background: themeStore.tokens.primarySoft, color: themeStore.primary }"
              >
                <image
                  class="entry-icon-img"
                  :src="entryIcon(item)"
                  :mode="item.iconUrl ? 'aspectFill' : 'aspectFit'"
                />
              </view>
              <text class="entry-name">{{ item.title }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>

      <view class="section-head">
        <text class="section-title">热卖推荐</text>
        <text class="section-more" @click="goCategory">全部</text>
      </view>

      <view v-if="!goods.length" class="hot-empty">暂无热卖商品</view>
      <view v-else class="goods-grid">
        <view
          v-for="item in goods"
          :key="item.id"
          class="goods-card"
          @click="goDetail(item.id)"
        >
          <view class="goods-cover" :style="{ background: themeStore.tokens.primarySoft }">
            <image
              v-if="item.coverUrl"
              class="goods-cover-img"
              :src="item.coverUrl"
              mode="aspectFill"
            />
            <view v-else class="cover-fallback">
              <text class="cover-text">{{ (item.name || "").slice(0, 2) }}</text>
            </view>
          </view>
          <view class="goods-body">
            <text class="goods-name">{{ item.name }}</text>
            <view class="price-row">
              <text class="price" :style="{ color: themeStore.tokens.price || themeStore.primary }">¥{{ item.price }}</text>
              <text v-if="item.multiSpec" class="from">起</text>
              <text v-if="item.originPrice" class="origin">¥{{ item.originPrice }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="safe-bottom" />
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchBannerList, type BannerVO } from "@/api/banner";
import { fetchNavEntryList, type NavEntryVO } from "@/api/navEntry";
import { fetchHotProducts, type ProductCardVO } from "@/api/product";
import { useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();
const statusBarHeight = ref(20);
const scrollHeight = ref("100vh");
const banners = ref<BannerVO[]>([]);
const goods = ref<ProductCardVO[]>([]);
const entries = ref<NavEntryVO[]>([]);

const FALLBACK_ENTRIES: NavEntryVO[] = [
  { id: -1, title: "分类", iconUrl: "", linkType: "category", linkValue: "" },
  { id: -2, title: "节日", iconUrl: "", linkType: "festival", linkValue: "" },
  { id: -3, title: "套餐", iconUrl: "", linkType: "none", linkValue: "" },
  { id: -4, title: "优惠", iconUrl: "", linkType: "none", linkValue: "" },
];

const TYPE_ICONS: Record<string, string> = {
  category: "/static/nav/category.png",
  festival: "/static/nav/festival.png",
  goodsList: "/static/nav/goodsList.png",
  festivalGoods: "/static/nav/festivalGoods.png",
  product: "/static/nav/product.png",
  page: "/static/nav/page.png",
  none: "/static/nav/none.png",
};

function entryIcon(item: NavEntryVO) {
  return item.iconUrl || TYPE_ICONS[item.linkType] || TYPE_ICONS.none;
}

const PAGE_SIZE = 10;
const TAB_PAGES = [
  "/pages/index/index",
  "/pages/category/index",
  "/pages/cart/index",
  "/pages/mine/index",
];

const entryPages = computed(() => {
  const list = entries.value;
  if (!list.length) {
    return [];
  }
  const pages: NavEntryVO[][] = [];
  for (let i = 0; i < list.length; i += PAGE_SIZE) {
    pages.push(list.slice(i, i + PAGE_SIZE));
  }
  return pages;
});

const pageStyle = computed(() => ({
  background: themeStore.pageBg,
}));

const heroImageUrl = computed(() => themeStore.assets.heroImageUrl || "");
const heroTag = computed(() => themeStore.copy.heroTag || "今日精选");
const heroTitle = computed(() => themeStore.copy.heroTitle || "品质好物 用心挑选");
const heroSub = computed(() => themeStore.copy.heroSub || "点击查看商品详情");

try {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 20;
  scrollHeight.value = `calc(100vh - ${statusBarHeight.value + 56}px)`;
} catch (e) {
  // ignore
}

function toast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}

function goCategory() {
  uni.switchTab({ url: "/pages/category/index" });
}

function goFestival() {
  uni.navigateTo({ url: "/pages/festival/index" });
}

function goDetail(id: number) {
  if (!id) {
    toast("商品不存在");
    return;
  }
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` });
}

function goGoodsList(query: string, title: string) {
  uni.navigateTo({
    url: `/pages/goods/list?${query}&title=${encodeURIComponent(title || "商品列表")}`,
  });
}

function goPage(path: string) {
  const url = path.startsWith("/") ? path : `/${path}`;
  if (TAB_PAGES.includes(url.split("?")[0])) {
    uni.switchTab({ url: url.split("?")[0] });
    return;
  }
  uni.navigateTo({ url });
}

function onEntry(item: NavEntryVO) {
  const value = (item.linkValue || "").trim();
  if (item.linkType === "category") {
    goCategory();
    return;
  }
  if (item.linkType === "festival") {
    goFestival();
    return;
  }
  if (item.linkType === "product") {
    goDetail(Number(value));
    return;
  }
  if (item.linkType === "goodsList") {
    if (!value) {
      toast("分类不存在");
      return;
    }
    goGoodsList(`categoryId=${value}`, item.title);
    return;
  }
  if (item.linkType === "festivalGoods") {
    if (!value) {
      toast("分类不存在");
      return;
    }
    goGoodsList(`festivalId=${value}`, item.title);
    return;
  }
  if (item.linkType === "page") {
    if (!value.startsWith("/pages/")) {
      toast("页面不存在");
      return;
    }
    goPage(value);
    return;
  }
  toast(`${item.title}即将上线`);
}

async function loadBanners() {
  try {
    const res = await fetchBannerList();
    banners.value = res.data?.length
      ? res.data
      : [{ id: 0, title: heroTitle.value, imageUrl: "", productId: 1 }];
  } catch (e) {
    banners.value = [{ id: 0, title: heroTitle.value, imageUrl: "", productId: 1 }];
  }
}

async function loadHot() {
  try {
    const res = await fetchHotProducts(8);
    goods.value = res.data || [];
  } catch (e) {
    goods.value = [];
  }
}

async function loadNavEntries() {
  try {
    const res = await fetchNavEntryList();
    entries.value = res.data?.length ? res.data : FALLBACK_ENTRIES;
  } catch (e) {
    entries.value = FALLBACK_ENTRIES;
  }
}

onShow(async () => {
  await themeStore.loadCurrent();
  if (themeStore.copy.navTitle) {
    try {
      uni.setNavigationBarTitle({ title: themeStore.copy.navTitle });
    } catch (e) {
      // custom nav 首页可能无效，忽略
    }
  }
  loadBanners();
  loadNavEntries();
  loadHot();
});
</script>

<style scoped>
.page {
  min-height: 100vh;
}

.nav {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 12rpx 28rpx 20rpx;
  background: #fff;
}

.brand {
  font-size: 40rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
}

.search {
  flex: 1;
  height: 68rpx;
  border-radius: 34rpx;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  gap: 10rpx;
}

.search-icon {
  color: #9ca3af;
  font-size: 28rpx;
}

.search-placeholder {
  color: #9ca3af;
  font-size: 26rpx;
}

.scroll {
  box-sizing: border-box;
}

.banner-swiper,
.hero-wrap {
  margin: 24rpx 28rpx 0;
  height: 280rpx;
  border-radius: 24rpx;
  overflow: hidden;
}

.banner-img-wrap,
.banner-fallback {
  width: 100%;
  height: 280rpx;
}

.banner-img {
  width: 100%;
  height: 280rpx;
}

.banner-fallback {
  padding: 48rpx 40rpx;
  box-sizing: border-box;
  color: #fff;
}

.banner-tag {
  display: inline-block;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.22);
  margin-bottom: 16rpx;
}

.banner-title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}

.banner-sub {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

.entry-swiper {
  margin: 28rpx;
  height: 360rpx;
  background: #fff;
  border-radius: 24rpx;
}

.entry-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx 0 8rpx;
}

.entry {
  width: 20%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 16rpx;
}

.entry-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  overflow: hidden;
}

.entry-icon-img {
  width: 56rpx;
  height: 56rpx;
}

.entry-icon.is-custom {
  background: transparent;
}

.entry-icon.is-custom .entry-icon-img {
  width: 140%;
  height: 140%;
  flex-shrink: 0;
}

.entry-name {
  font-size: 22rpx;
  color: #4b5563;
  max-width: 100%;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.section-head {
  margin: 8rpx 28rpx 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.section-more {
  font-size: 24rpx;
  color: #9ca3af;
}

.hot-empty {
  margin: 0 28rpx 24rpx;
  padding: 48rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #9ca3af;
  background: #fff;
  border-radius: 20rpx;
}

.goods-grid {
  margin: 0 20rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.goods-card {
  width: 48.5%;
  margin-bottom: 16rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.goods-cover {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  overflow: hidden;
}

.goods-cover-img,
.cover-fallback {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.cover-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-text {
  font-size: 36rpx;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.28);
}

.goods-body {
  padding: 20rpx;
}

.goods-name {
  font-size: 26rpx;
  color: #1f2937;
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
  font-size: 32rpx;
  font-weight: 700;
}

.origin {
  color: #c0c4cc;
  font-size: 22rpx;
  text-decoration: line-through;
}

.from {
  font-size: 22rpx;
}

.safe-bottom {
  height: 40rpx;
}
</style>
