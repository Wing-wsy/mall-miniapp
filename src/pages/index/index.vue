<template>
  <view class="page" :style="pageStyle">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav">
      <text class="brand" :style="{ color: themeStore.primary }">{{ themeStore.brandName }}</text>
      <view class="search" @click="goSearch">
        <text class="search-icon">⌕</text>
        <text class="search-placeholder">{{ themeStore.searchPlaceholder }}</text>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="scroll"
      :style="{ height: scrollHeight }"
      :scroll-top="scrollTop"
      :scroll-with-animation="scrollWithAnimation"
      lower-threshold="120"
      @scroll="onScroll"
      @scrolltolower="onScrollToLower"
    >
      <view v-if="picking" class="plan-bar-anchor" :style="planBarPx ? { height: planBarPx + 'px' } : undefined">
        <view
          class="plan-bar"
          :class="{ pinned: planPinned }"
          :style="planPinned ? { top: planPinTop + 'px' } : undefined"
        >
          <view class="plan-bar-main">
            <text class="plan-bar-label">正在添加到</text>
            <text class="plan-bar-name">{{ picking.name }}</text>
          </view>
          <text class="plan-bar-detail" @click="goCurrentPlan">详情</text>
          <text class="plan-bar-action" @click="switchPlanVisible = true">切换</text>
          <text class="plan-bar-action" @click="exitPicking">退出</text>
        </view>
      </view>
      <view v-if="notice" class="horn">
        <text class="horn-icon">📢</text>
        <view class="horn-body">
          <text class="horn-text">{{ notice }}</text>
        </view>
      </view>
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

      <view
        v-if="contact.companyName || contact.companyLogo"
        class="company-bar"
        @click="openCompanyContact"
      >
        <image
          v-if="contact.companyLogo"
          class="company-bar-logo"
          :src="contact.companyLogo"
          mode="aspectFit"
        />
        <view class="company-bar-name">{{ contact.companyName }}</view>
        <text class="company-bar-arrow">›</text>
      </view>

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
                  mode="aspectFit"
                />
              </view>
              <text class="entry-name">{{ item.title }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>

      <view v-if="claimEntry" class="coupon-entry" @click="goCouponCenter">
        <view class="coupon-entry-left">
          <text class="coupon-entry-tag">领券</text>
          <view class="coupon-entry-copy">
            <text class="coupon-entry-title">{{ claimEntry.benefitText }} 待领取</text>
            <text class="coupon-entry-sub">{{ claimCount > 1 ? `共 ${claimCount} 张可领` : claimEntry.name }}</text>
          </view>
        </view>
        <text class="coupon-entry-btn">去领取</text>
      </view>

      <view v-if="rootCategories.length" class="root-cats-anchor">
        <view
          class="root-cats-pin"
          :class="{ pinned: catsPinned }"
          :style="catsPinned ? { top: catsPinTop + 'px', background: themeStore.pageBg } : undefined"
        >
          <view class="root-cats-bar">
            <view
              class="root-cat root-cat-fixed"
              :class="{ active: !catHighlightId }"
              :style="!catHighlightId ? selectedCatStyle : { background: themeStore.pageBg }"
              @click="showHomeFeed"
            >
              <text :style="!catHighlightId ? { color: themeStore.primary } : undefined">推荐</text>
            </view>
            <scroll-view
              scroll-x
              enable-flex
              class="root-cats"
              :show-scrollbar="false"
              :style="{ width: catsScrollWidth }"
            >
              <view class="root-cats-row">
                <view
                  v-for="item in rootCategories"
                  :key="item.id"
                  class="root-cat"
                  :class="{ active: catHighlightId === item.id }"
                  :style="catHighlightId === item.id ? selectedCatStyle : undefined"
                  @click="onRootCategory(item)"
                >
                  <text :style="catHighlightId === item.id ? { color: themeStore.primary } : undefined">{{ item.name }}</text>
                </view>
              </view>
            </scroll-view>
          </view>
        </view>
      </view>

      <template v-if="selectedRootId">
        <view v-if="!categoryGoods.length" class="hot-empty">{{ categoryLoading ? "加载中..." : "暂无商品" }}</view>
        <view v-else class="goods-grid">
          <view
            v-for="item in categoryGoods"
            :key="'cat-' + item.id"
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
              <text v-if="publicShipFrom(item)" class="ship-badge" :class="{ self: item.selfOperated }">{{ publicShipFrom(item) }}</text>
              <product-share-btn :product-id="item.id" :visible="canShare" />
            </view>
            <view class="goods-body">
              <text class="goods-name">{{ item.name }}</text>
              <text v-if="item.brandName" class="goods-brand">{{ item.brandName }}</text>
              <view class="price-row">
                <view class="price-left">
                  <text class="price" :style="{ color: themeStore.tokens.price || themeStore.primary }">¥{{ salePrice(item) }}</text>
                  <text v-if="item.multiSpec" class="from">起</text>
                  <text v-if="linePrice(item)" class="origin">¥{{ linePrice(item) }}</text>
                </view>
                <view class="cart-btn" :class="{ picking: !!picking }" @click.stop="onCartOrPlan(item)">
                  <text v-if="picking" class="plan-add">加入方案</text>
                  <image v-else class="cart-icon" :src="cartIconSrc" mode="aspectFit" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
      <view class="section-head">
        <text class="section-title">热卖推荐</text>
        <text class="section-more" @click="goCategory">全部</text>
      </view>

      <view v-if="!goods.length" class="hot-empty">暂无热卖商品</view>
      <view v-else class="goods-grid">
        <view
          v-for="item in goods"
          :key="'hot-' + item.id"
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
            <text v-if="publicShipFrom(item)" class="ship-badge" :class="{ self: item.selfOperated }">{{ publicShipFrom(item) }}</text>
            <product-share-btn :product-id="item.id" :visible="canShare" />
          </view>
          <view class="goods-body">
            <text class="goods-name">{{ item.name }}</text>
            <text v-if="item.brandName" class="goods-brand">{{ item.brandName }}</text>
            <view class="price-row">
              <view class="price-left">
                <text class="price" :style="{ color: themeStore.tokens.price || themeStore.primary }">¥{{ salePrice(item) }}</text>
                <text v-if="item.multiSpec" class="from">起</text>
                <text v-if="linePrice(item)" class="origin">¥{{ linePrice(item) }}</text>
              </view>
              <view class="cart-btn" :class="{ picking: !!picking }" @click.stop="onCartOrPlan(item)">
                <text v-if="picking" class="plan-add">加入方案</text>
                <image v-else class="cart-icon" :src="cartIconSrc" mode="aspectFit" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="section-head">
        <text class="section-title">全部商品</text>
      </view>
      <view v-if="catalogLoading && !catalog.length" class="hot-empty">加载中...</view>
      <view v-else-if="!catalog.length" class="hot-empty">暂无商品</view>
      <view v-else class="goods-grid">
        <view
          v-for="item in catalog"
          :key="'all-' + item.id"
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
            <text v-if="publicShipFrom(item)" class="ship-badge" :class="{ self: item.selfOperated }">{{ publicShipFrom(item) }}</text>
            <product-share-btn :product-id="item.id" :visible="canShare" />
          </view>
          <view class="goods-body">
            <text class="goods-name">{{ item.name }}</text>
            <text v-if="item.brandName" class="goods-brand">{{ item.brandName }}</text>
            <view class="price-row">
              <view class="price-left">
                <text class="price" :style="{ color: themeStore.tokens.price || themeStore.primary }">¥{{ salePrice(item) }}</text>
                <text v-if="item.multiSpec" class="from">起</text>
                <text v-if="linePrice(item)" class="origin">¥{{ linePrice(item) }}</text>
              </view>
              <view class="cart-btn" :class="{ picking: !!picking }" @click.stop="onCartOrPlan(item)">
                <text v-if="picking" class="plan-add">加入方案</text>
                <image v-else class="cart-icon" :src="cartIconSrc" mode="aspectFit" />
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-if="catalog.length" class="feed-status">
        <text v-if="catalogLoadingMore">加载中...</text>
        <text v-else-if="catalogHasMore">上拉加载更多</text>
        <text v-else>没有更多了</text>
      </view>
      </template>
      <view class="safe-bottom" />
    </scroll-view>

    <view class="float-actions">
      <view v-if="showBackTop" class="float-btn" @click="backToTop">
        <view class="back-top-arrow" :style="{ borderColor: themeStore.primary }" />
      </view>
      <view class="float-btn" @click="onContact(false)">
        <view class="cs-icon">
          <view class="cs-band" :style="{ borderColor: themeStore.primary }" />
          <view class="cs-ears">
            <view class="cs-ear" :style="{ background: themeStore.primary }" />
            <view class="cs-ear" :style="{ background: themeStore.primary }" />
          </view>
        </view>
      </view>
    </view>

    <view v-if="contactVisible" class="cs-mask" @click="contactVisible = false" @touchmove.stop.prevent>
      <view class="cs-dialog" @click.stop>
        <text class="cs-title">联系客服</text>
        <view v-if="contact.companyName || contact.companyLogo || contact.companyDesc" class="cs-company-block">
          <view v-if="contact.companyName || contact.companyLogo" class="cs-company">
            <image v-if="contact.companyLogo" class="cs-logo" :src="contact.companyLogo" mode="aspectFit" />
            <text v-if="contact.companyName" class="cs-company-name">{{ contact.companyName }}</text>
          </view>
          <text v-if="contactShowDesc && contact.companyDesc" class="cs-company-desc">{{ contact.companyDesc }}</text>
        </view>
        <view v-if="contact.phone" class="cs-row">
          <view class="cs-meta">
            <text class="cs-label">客服电话</text>
            <text class="cs-value">{{ contact.phone }}</text>
          </view>
          <text class="cs-action" :style="{ color: themeStore.primary }" @click="callPhone">拨打</text>
        </view>
        <view v-if="contact.email" class="cs-row">
          <view class="cs-meta">
            <text class="cs-label">客服邮箱</text>
            <text class="cs-value">{{ contact.email }}</text>
          </view>
          <text class="cs-action" :style="{ color: themeStore.primary }" @click="copyEmail">复制</text>
        </view>
        <button class="cs-close" @click="contactVisible = false">关闭</button>
      </view>
    </view>

    <view v-if="switchPlanVisible" class="cs-mask" @click="switchPlanVisible = false" @touchmove.stop.prevent>
      <view class="cs-dialog" @click.stop>
        <text class="cs-title">切换方案</text>
        <view
          v-for="item in planOptions"
          :key="item.id"
          class="plan-switch-row"
          @click="choosePlan(item)"
        >
          <text class="plan-switch-name">{{ item.name }}</text>
          <text v-if="picking && picking.id === item.id" class="plan-switch-on">当前</text>
        </view>
        <button class="cs-close" @click="switchPlanVisible = false">关闭</button>
      </view>
    </view>

    <plan-add-sheet
      :visible="sheetVisible"
      :product-id="sheetProductId"
      @close="sheetVisible = false"
      @confirm="onPlanConfirm"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { fetchBannerList, type BannerVO } from "@/api/banner";
import { fetchNavEntryList, type NavEntryVO } from "@/api/navEntry";
import { fetchHotProducts, fetchProductFeed, fetchProductListByCategory, type ProductCardVO } from "@/api/product";
import { fetchProductCategoryTree, type CategoryNodeVO } from "@/api/category";
import { fetchCouponActivities, type CouponActivityVO } from "@/api/coupon";
import { fetchShopContact } from "@/api/shop";
import { useThemeStore } from "@/stores/theme";
import { useUserStore } from "@/stores/user";
import { linePrice, salePrice } from "@/utils/price";
import { publicShipFrom } from "@/utils/supplier";
import { prefetchImage, prefetchImageField } from "@/utils/media";
import { guardMaintenanceNavigate, syncMaintenanceFromContact } from "@/utils/maintenance";
import ProductShareBtn from "@/components/product-share-btn.vue";
import { useProductShare } from "@/composables/useProductShare";
import { quickAddCart } from "@/composables/useQuickAddCart";
import { addPlanItem, fetchPlanDetail, fetchPlanList, type PlanSummaryVO } from "@/api/plan";
import { clearPickingPlan, getPickingPlan, setPickingPlan } from "@/utils/planPicking";
import PlanAddSheet from "@/components/plan-add-sheet.vue";

const themeStore = useThemeStore();
const userStore = useUserStore();
const pageInstance = getCurrentInstance();
const { canShare } = useProductShare();
const statusBarHeight = ref(20);
const scrollHeight = ref("100vh");
const scrollTop = ref<number | undefined>(undefined);
const scrollWithAnimation = ref(true);
const showBackTop = ref(false);
const catsPinned = ref(false);
const catsPinTop = ref(0);
const planPinned = ref(false);
const planPinTop = ref(0);
const planBarPx = ref(0);
const catsScrollWidth = ref("calc(100vw - 200rpx)");
let catsAnchorTop = 0;
let catsMeasured = false;
let catsMeasureAt = 0;
let currentScrollTop = 0;
let backTopThreshold = 500;
const banners = ref<BannerVO[]>([]);
const goods = ref<ProductCardVO[]>([]);
const catalog = ref<ProductCardVO[]>([]);
const catalogLoading = ref(false);
const catalogLoadingMore = ref(false);
const catalogHasMore = ref(true);
const catalogPage = ref(0);
const CATALOG_PAGE_SIZE = 10;
let catalogSeq = 0;
const rootCategories = ref<CategoryNodeVO[]>([]);
const selectedRootId = ref<number | null>(null);
const catHighlightId = ref<number | null>(null);
const categoryGoods = ref<ProductCardVO[]>([]);
const categoryLoading = ref(false);
let categorySeq = 0;
const entries = ref<NavEntryVO[]>([]);
const claimable = ref<CouponActivityVO[]>([]);
const notice = ref("");
const contact = ref({ phone: "", email: "", companyName: "", companyLogo: "", companyDesc: "" });
const contactVisible = ref(false);
const contactShowDesc = ref(false);
let contactLoading = false;
const voucherEnabled = ref(false);
const pointsEnabled = ref(false);
const couponEnabled = ref(false);

const claimEntry = computed(() => claimable.value[0] || null);
const claimCount = computed(() => claimable.value.length);

const FALLBACK_ENTRIES: NavEntryVO[] = [
  { id: -1, title: "分类", iconUrl: "", linkType: "category", linkValue: "" },
  { id: -2, title: "节日", iconUrl: "", linkType: "festival", linkValue: "" },
  { id: -3, title: "套餐", iconUrl: "", linkType: "page", linkValue: "/pages/coupon/activity" },
  { id: -4, title: "优惠", iconUrl: "", linkType: "page", linkValue: "/pages/coupon/activity" },
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

function mixWhite(hex: string, ratio: number) {
  const raw = hex.replace("#", "").trim();
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n) || full.length !== 6) {
    return hex;
  }
  const mix = (channel: number) => Math.round(channel * ratio + 255 * (1 - ratio));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  const channelHex = (channel: number) => channel.toString(16).padStart(2, "0");
  return `#${channelHex(r)}${channelHex(g)}${channelHex(b)}`;
}

const selectedCatStyle = computed(() => {
  const backgroundColor = mixWhite(themeStore.primary, 0.42);
  return {
    color: themeStore.primary,
    backgroundColor,
  };
});

const heroImageUrl = ref("");
const heroTag = computed(() => themeStore.copy.heroTag || "今日精选");
const heroTitle = computed(() => themeStore.copy.heroTitle || "品质好物 用心挑选");
const heroSub = computed(() => themeStore.copy.heroSub || "点击查看商品详情");

const TAB_ICON_PACKS: Record<string, string> = {
  default: "/static/tab",
  zhongqiu: "/static/tab/zhongqiu",
  duanwu: "/static/tab/duanwu",
};

/** 与底部 Tab「购物车」未选中态同款浅色图标 */
const cartIconSrc = computed(() => {
  const pack = TAB_ICON_PACKS[themeStore.theme.code] || TAB_ICON_PACKS.default;
  return `${pack}/cart.png`;
});

try {
  const info = uni.getSystemInfoSync();
  statusBarHeight.value = info.statusBarHeight || 20;
  scrollHeight.value = `calc(100vh - ${statusBarHeight.value + 56}px)`;
  backTopThreshold = Math.max(400, Math.round((info.windowHeight || 700) * 0.8));
} catch (e) {
  // ignore
}

function measureCatsAnchor() {
  const proxy = pageInstance?.proxy;
  const widthQuery = proxy ? uni.createSelectorQuery().in(proxy as never) : uni.createSelectorQuery();
  widthQuery
    .select(".root-cats-bar")
    .boundingClientRect()
    .select(".root-cat-fixed")
    .boundingClientRect()
    .exec((res) => {
      const bar = res?.[0] as { width?: number } | null;
      const fixed = res?.[1] as { width?: number } | null;
      if (!bar?.width || !fixed?.width) {
        return;
      }
      const gap = uni.upx2px(16);
      const width = Math.floor(bar.width - fixed.width - gap);
      if (width > 40) {
        catsScrollWidth.value = `${width}px`;
      }
    });
  if (catsPinned.value) {
    return;
  }
  const query = proxy ? uni.createSelectorQuery().in(proxy as never) : uni.createSelectorQuery();
  query
    .select(".scroll")
    .boundingClientRect()
    .select(".root-cats-anchor")
    .boundingClientRect()
    .exec((res) => {
      const scrollBox = res?.[0] as { top?: number } | null;
      const anchor = res?.[1] as { top?: number } | null;
      if (!scrollBox || !anchor || scrollBox.top == null || anchor.top == null) {
        return;
      }
      catsPinTop.value = scrollBox.top + planPinOffset();
      catsAnchorTop = anchor.top - scrollBox.top + currentScrollTop;
      catsMeasured = true;
      syncCatsPin();
    });
}

function planPinOffset() {
  return picking.value && planBarPx.value > 0 ? planBarPx.value : 0;
}

function measurePlanBar() {
  if (!picking.value) {
    return;
  }
  const proxy = pageInstance?.proxy;
  const query = proxy ? uni.createSelectorQuery().in(proxy as never) : uni.createSelectorQuery();
  query
    .select(".scroll")
    .boundingClientRect()
    .select(".plan-bar")
    .boundingClientRect()
    .exec((res) => {
      const scrollBox = res?.[0] as { top?: number } | null;
      const bar = res?.[1] as { height?: number } | null;
      if (scrollBox?.top != null) {
        planPinTop.value = scrollBox.top;
      }
      if (bar?.height) {
        planBarPx.value = bar.height;
      }
      syncPlanPin();
    });
}

function syncPlanPin() {
  const next = !!picking.value && currentScrollTop > 1;
  if (next !== planPinned.value) {
    planPinned.value = next;
  }
}

function syncCatsPin() {
  if (!catsMeasured) {
    return;
  }
  const next = currentScrollTop + 1 >= catsAnchorTop;
  if (next !== catsPinned.value) {
    catsPinned.value = next;
  }
}

function onScroll(e: { detail?: { scrollTop?: number } }) {
  currentScrollTop = Number(e.detail?.scrollTop || 0);
  const next = currentScrollTop > backTopThreshold;
  if (next !== showBackTop.value) {
    showBackTop.value = next;
  }
  const now = Date.now();
  if (!catsPinned.value && now - catsMeasureAt > 300) {
    catsMeasureAt = now;
    measurePlanBar();
    measureCatsAnchor();
    return;
  }
  syncPlanPin();
  syncCatsPin();
}

function backToTop() {
  showBackTop.value = false;
  scrollWithAnimation.value = true;
  scrollTop.value = currentScrollTop + 1;
  nextTick(() => {
    scrollTop.value = 0;
    setTimeout(() => {
      scrollTop.value = undefined;
    }, 350);
  });
}

function toast(msg: string) {
  uni.showToast({ title: msg, icon: "none" });
}

const addingId = ref<number | null>(null);
const picking = ref<{ id: number; name: string } | null>(null);
const planOptions = ref<PlanSummaryVO[]>([]);
const switchPlanVisible = ref(false);
const sheetVisible = ref(false);
const sheetProductId = ref(0);
const planAdding = ref(false);

async function loadPicking() {
  const id = getPickingPlan();
  if (!id || !userStore.isLogin) {
    picking.value = null;
    planOptions.value = [];
    return;
  }
  try {
    const [detail, list] = await Promise.all([fetchPlanDetail(id), fetchPlanList()]);
    if (!detail.data?.id) {
      clearPickingPlan();
      picking.value = null;
      return;
    }
    picking.value = { id: detail.data.id, name: detail.data.name };
    planOptions.value = list.data || [];
    nextTick(() => measurePlanBar());
  } catch {
    clearPickingPlan();
    picking.value = null;
    planOptions.value = [];
  }
}

function goCurrentPlan() {
  if (!picking.value) return;
  uni.navigateTo({ url: `/pages/plan/detail?id=${picking.value.id}` });
}

function exitPicking() {
  clearPickingPlan();
  picking.value = null;
  planPinned.value = false;
  switchPlanVisible.value = false;
  sheetVisible.value = false;
}

function choosePlan(item: PlanSummaryVO) {
  setPickingPlan(item.id);
  picking.value = { id: item.id, name: item.name };
  switchPlanVisible.value = false;
}

function onCartOrPlan(item: ProductCardVO) {
  if (picking.value) {
    if (!item?.id) return;
    sheetProductId.value = item.id;
    sheetVisible.value = true;
    return;
  }
  onQuickAdd(item);
}

async function onPlanConfirm(payload: { skuId: number; sellUnitId: number; quantity: number }) {
  if (!picking.value || planAdding.value) return;
  planAdding.value = true;
  try {
    await addPlanItem(picking.value.id, payload);
    sheetVisible.value = false;
    uni.showToast({ title: "已加入方案", icon: "success" });
  } catch (e: unknown) {
    uni.showToast({ title: e instanceof Error ? e.message : "加入失败", icon: "none" });
  } finally {
    planAdding.value = false;
  }
}

async function onQuickAdd(item: ProductCardVO) {
  if (!item?.id || addingId.value != null) return;
  addingId.value = item.id;
  try {
    await quickAddCart(item.id, !!item.multiSpec);
  } finally {
    addingId.value = null;
  }
}

function goCategory() {
  uni.switchTab({ url: "/pages/category/index" });
}

function goFestival() {
  uni.navigateTo({ url: "/pages/festival/index" });
}

function goSearch() {
  uni.navigateTo({ url: "/pages/goods/search" });
}

async function goDetail(id: number) {
  if (!id) {
    toast("商品不存在");
    return;
  }
  try {
    const res = await fetchShopContact();
    syncMaintenanceFromContact(res.data);
  } catch {
    // 用本地已同步状态
  }
  if (!guardMaintenanceNavigate()) {
    return;
  }
  uni.navigateTo({ url: `/pages/goods/detail?id=${id}` });
}

async function goGoodsList(query: string, title: string) {
  try {
    const res = await fetchShopContact();
    syncMaintenanceFromContact(res.data);
  } catch {
    // ignore
  }
  if (!guardMaintenanceNavigate()) {
    return;
  }
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

function goCouponCenter() {
  if (!couponEnabled.value) {
    uni.showToast({ title: "优惠券功能暂未开放", icon: "none" });
    return;
  }
  if (!userStore.isLogin) {
    uni.navigateTo({ url: "/pages/login/index" });
    return;
  }
  uni.navigateTo({ url: "/pages/coupon/activity" });
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
    if (value.split("?")[0] === "/pages/voucher/redeem" && !voucherEnabled.value) {
      uni.showToast({ title: "兑换功能暂未开放", icon: "none" });
      return;
    }
    const pagePath = value.split("?")[0];
    if (
      (pagePath === "/pages/points/list" ||
        pagePath === "/pages/points/detail" ||
        pagePath === "/pages/points/logs") &&
      !pointsEnabled.value
    ) {
      uni.showToast({ title: "积分功能暂未开放", icon: "none" });
      return;
    }
    if (
      (pagePath === "/pages/coupon/list" || pagePath === "/pages/coupon/activity") &&
      !couponEnabled.value
    ) {
      uni.showToast({ title: "优惠券功能暂未开放", icon: "none" });
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
  await Promise.all(banners.value.map((item) => prefetchImageField(item, "imageUrl")));
}

async function loadHot() {
  try {
    const res = await fetchHotProducts(8);
    goods.value = res.data || [];
  } catch (e) {
    goods.value = [];
  }
  await Promise.all(goods.value.map((item) => prefetchImageField(item, "coverUrl")));
}

async function loadCatalog(reset: boolean) {
  if (reset) {
    catalogSeq += 1;
    catalogPage.value = 0;
    catalogHasMore.value = true;
    catalogLoading.value = true;
    catalogLoadingMore.value = false;
  } else if (catalogLoading.value || catalogLoadingMore.value || !catalogHasMore.value) {
    return;
  } else {
    catalogLoadingMore.value = true;
  }
  const seq = catalogSeq;
  const page = catalogPage.value + 1;
  try {
    const res = await fetchProductFeed(page, CATALOG_PAGE_SIZE);
    if (seq !== catalogSeq) {
      return;
    }
    const chunk = res.data?.list || [];
    await Promise.all(chunk.map((item) => prefetchImageField(item, "coverUrl")));
    if (seq !== catalogSeq) {
      return;
    }
    catalog.value = reset ? chunk : catalog.value.concat(chunk);
    catalogPage.value = page;
    catalogHasMore.value = !!res.data?.hasMore;
  } catch {
    if (seq !== catalogSeq) {
      return;
    }
    if (reset) {
      catalog.value = [];
      catalogHasMore.value = false;
    }
  } finally {
    if (seq === catalogSeq) {
      catalogLoading.value = false;
      catalogLoadingMore.value = false;
    }
  }
}

function onScrollToLower() {
  if (selectedRootId.value) {
    return;
  }
  loadCatalog(false);
}

async function loadRootCategories() {
  try {
    const res = await fetchProductCategoryTree();
    rootCategories.value = res.data || [];
    nextTick(() => measureCatsAnchor());
    if (selectedRootId.value && !rootCategories.value.some((item) => item.id === selectedRootId.value)) {
      selectedRootId.value = null;
      catHighlightId.value = null;
      categoryGoods.value = [];
    }
  } catch {
    rootCategories.value = [];
  }
}

function showHomeFeed() {
  if (!selectedRootId.value && !catHighlightId.value) {
    return;
  }
  categorySeq += 1;
  catHighlightId.value = null;
  selectedRootId.value = null;
  categoryLoading.value = false;
}

async function onRootCategory(item: CategoryNodeVO) {
  if (catHighlightId.value === item.id) {
    showHomeFeed();
    return;
  }
  const seq = ++categorySeq;
  catHighlightId.value = item.id;
  categoryLoading.value = true;
  try {
    const res = await fetchProductListByCategory(item.id);
    if (seq !== categorySeq) {
      return;
    }
    const list = res.data || [];
    await Promise.all(list.map((goods) => prefetchImageField(goods, "coverUrl")));
    if (seq !== categorySeq) {
      return;
    }
    categoryGoods.value = list;
    categoryLoading.value = false;
    selectedRootId.value = item.id;
  } catch (e: unknown) {
    if (seq !== categorySeq) {
      return;
    }
    catHighlightId.value = selectedRootId.value;
    toast(e instanceof Error ? e.message : "加载失败");
  } finally {
    if (seq === categorySeq) {
      categoryLoading.value = false;
    }
  }
}

async function loadNavEntries() {
  try {
    const res = await fetchNavEntryList();
    entries.value = res.data?.length ? res.data : FALLBACK_ENTRIES;
  } catch (e) {
    entries.value = FALLBACK_ENTRIES;
  }
  await Promise.all(entries.value.map((item) => prefetchImageField(item, "iconUrl")));
}

async function loadClaimable() {
  if (!couponEnabled.value || !userStore.isLogin) {
    claimable.value = [];
    return;
  }
  try {
    const res = await fetchCouponActivities();
    claimable.value = (res.data || []).filter((item) => item.canClaim);
  } catch {
    claimable.value = [];
  }
}

async function openCompanyContact() {
  await onContact(true);
}

async function onContact(showDesc = false) {
  if (contactLoading) {
    return;
  }
  contactShowDesc.value = showDesc === true;
  let phone = contact.value.phone;
  let email = contact.value.email;
  if (!phone && !email) {
    contactLoading = true;
    try {
      const res = await fetchShopContact();
      phone = res.data?.phone || "";
      email = res.data?.email || "";
      contact.value = {
        phone,
        email,
        companyName: res.data?.companyName || "",
        companyLogo: res.data?.companyLogo || "",
        companyDesc: res.data?.companyDesc || "",
      };
    } catch {
      toast("客服信息加载失败");
      return;
    } finally {
      contactLoading = false;
    }
  }
  if (!phone && !email && !contact.value.companyName && !contact.value.companyLogo && !contact.value.companyDesc) {
    toast("暂未配置客服");
    return;
  }
  contactVisible.value = true;
}

function callPhone() {
  const phone = (contact.value.phone || "").trim();
  if (!phone) {
    return;
  }
  uni.makePhoneCall({ phoneNumber: phone });
}

function copyEmail() {
  const email = (contact.value.email || "").trim();
  if (!email) {
    return;
  }
  uni.setClipboardData({ data: email });
}

async function loadNotice() {
  try {
    const res = await fetchShopContact();
    notice.value = (res.data?.notice || "").trim();
    contact.value = {
      phone: res.data?.phone || "",
      email: res.data?.email || "",
      companyName: res.data?.companyName || "",
      companyLogo: res.data?.companyLogo || "",
      companyDesc: res.data?.companyDesc || "",
    };
    voucherEnabled.value = res.data?.voucherEnabled === true;
    pointsEnabled.value = res.data?.pointsEnabled === true;
    couponEnabled.value = res.data?.couponEnabled === true;
    syncMaintenanceFromContact(res.data);
  } catch {
    notice.value = "";
    contact.value = { phone: "", email: "", companyName: "", companyLogo: "", companyDesc: "" };
    voucherEnabled.value = false;
    pointsEnabled.value = false;
    couponEnabled.value = false;
    syncMaintenanceFromContact(null);
  }
}

onShow(async () => {
  await themeStore.loadCurrent();
  heroImageUrl.value = await prefetchImage(themeStore.assets.heroImageUrl || "");
  if (themeStore.copy.navTitle) {
    try {
      uni.setNavigationBarTitle({ title: themeStore.copy.navTitle });
    } catch (e) {
      // custom nav 首页可能无效，忽略
    }
  }
  loadBanners();
  loadNavEntries();
  loadRootCategories();
  loadHot();
  loadCatalog(true);
  await loadNotice();
  loadClaimable();
  loadPicking();
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

.horn {
  margin: 16rpx 28rpx 0;
  height: 64rpx;
  padding: 0 20rpx;
  border-radius: 32rpx;
  background: #fff4f0;
  display: flex;
  align-items: center;
  gap: 12rpx;
  overflow: hidden;
}

.horn-icon {
  flex-shrink: 0;
  font-size: 28rpx;
}

.horn-body {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.horn-text {
  display: inline-block;
  font-size: 24rpx;
  color: #c2410c;
  white-space: nowrap;
  padding-left: 100%;
  animation: horn-marquee 14s linear infinite;
}

@keyframes horn-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
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
  display: block;
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

.company-bar {
  margin: 20rpx 28rpx 0;
  padding: 20rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.company-bar-logo {
  width: 88rpx;
  height: 88rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
  background: #f7f8fa;
}

.company-bar-name {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2937;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.company-bar-arrow {
  flex-shrink: 0;
  font-size: 36rpx;
  line-height: 1;
  color: #c4c4c4;
}

.entry-swiper {
  margin: 20rpx 28rpx 8rpx;
  height: 340rpx;
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
  display: block;
  flex-shrink: 0;
}

.entry-icon.is-custom {
  background: transparent;
}

.entry-icon.is-custom .entry-icon-img {
  width: 88rpx;
  height: 88rpx;
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

.coupon-entry {
  margin: 0 28rpx 8rpx;
  padding: 22rpx 24rpx;
  border-radius: 20rpx;
  background: #fff4f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.coupon-entry-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 0;
}

.coupon-entry-tag {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.coupon-entry-copy {
  min-width: 0;
}

.coupon-entry-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #111827;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.coupon-entry-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #9ca3af;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.coupon-entry-btn {
  flex-shrink: 0;
  margin-left: 16rpx;
  padding: 10rpx 22rpx;
  border-radius: 28rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 24rpx;
}

.root-cats-anchor {
  height: 100rpx;
  margin-bottom: 8rpx;
}

.root-cats-pin.pinned {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 12;
}

.root-cats-bar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  width: 100%;
  height: 100rpx;
  padding-left: 28rpx;
  box-sizing: border-box;
}

.root-cat-fixed {
  flex: none;
  margin-right: 16rpx;
}

.root-cats {
  flex: none;
  height: 100rpx;
  white-space: nowrap;
}

.root-cats-row {
  display: inline-flex;
  align-items: center;
  height: 100rpx;
  padding-right: 28rpx;
  gap: 16rpx;
}

.root-cat {
  flex-shrink: 0;
  padding: 10rpx 28rpx;
  border-radius: 999rpx;
  font-size: 30rpx;
  color: #6b7280;
  line-height: 42rpx;
}

.root-cat.active {
  font-weight: 700;
  background-color: #f6c9a6;
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

.ship-badge {
  position: absolute;
  left: 8rpx;
  top: 8rpx;
  z-index: 1;
  padding: 4rpx 10rpx;
  font-size: 20rpx;
  color: #fff;
  background: rgba(17, 24, 39, 0.55);
  border-radius: 8rpx;
}

.ship-badge.self {
  background: #ff5a3d;
}

.goods-cover-img,
.cover-fallback {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: block;
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

.goods-brand {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #9ca3af;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.price-row {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.price-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10rpx;
}

.cart-btn {
  flex-shrink: 0;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-btn.picking {
  width: auto;
  height: 48rpx;
  padding: 0 16rpx;
  border-radius: 24rpx;
  background: #ff5a3d;
}

.plan-add {
  color: #fff;
  font-size: 22rpx;
  white-space: nowrap;
}

.plan-bar-anchor {
  height: 88rpx;
  margin-bottom: 16rpx;
}

.plan-bar {
  padding: 16rpx 24rpx;
  background: #fff1ee;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-sizing: border-box;
}

.plan-bar.pinned {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 13;
}

.plan-bar-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.plan-bar-label {
  color: #6b7280;
  font-size: 30rpx;
  flex-shrink: 0;
}

.plan-bar-name {
  color: #ff5a3d;
  font-size: 34rpx;
  font-weight: 700;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.plan-bar-detail {
  flex-shrink: 0;
  padding: 8rpx 22rpx;
  border-radius: 999rpx;
  background: #ff5a3d;
  color: #fff;
  font-size: 28rpx;
  line-height: 1.3;
}

.plan-bar-action {
  color: #ff5a3d;
  font-size: 30rpx;
  flex-shrink: 0;
}

.plan-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1px solid #f3f4f6;
}

.plan-switch-name {
  font-size: 28rpx;
  color: #1f2937;
}

.plan-switch-on {
  font-size: 22rpx;
  color: #ff5a3d;
}

.cart-icon {
  width: 48rpx;
  height: 48rpx;
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

.feed-status {
  padding: 12rpx 0 8rpx;
  text-align: center;
  font-size: 24rpx;
  color: #9ca3af;
}

.safe-bottom {
  height: 40rpx;
}

.float-actions {
  position: fixed;
  right: 28rpx;
  bottom: calc(32rpx + 100rpx + env(safe-area-inset-bottom));
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.float-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(31, 41, 55, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cs-icon {
  width: 40rpx;
  height: 36rpx;
}

.cs-band {
  width: 26rpx;
  height: 16rpx;
  margin: 0 auto;
  border: 4rpx solid #ff5a3d;
  border-bottom: none;
  border-radius: 16rpx 16rpx 0 0;
  box-sizing: border-box;
}

.cs-ears {
  display: flex;
  justify-content: space-between;
  margin-top: -4rpx;
}

.cs-ear {
  width: 10rpx;
  height: 16rpx;
  border-radius: 4rpx;
  background: #ff5a3d;
}

.cs-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.cs-dialog {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 36rpx 28rpx;
}

.cs-title {
  display: block;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
  margin-bottom: 28rpx;
}

.cs-company-block {
  padding: 4rpx 0 20rpx;
  margin-bottom: 8rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.cs-company {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.cs-logo {
  width: 112rpx;
  height: 112rpx;
  flex-shrink: 0;
  background: #f7f8fa;
  border-radius: 16rpx;
}

.cs-company-name {
  flex: 1;
  min-width: 0;
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.cs-company-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.5;
  color: #6b7280;
}

.cs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f3f4f6;
}

.cs-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.cs-label {
  font-size: 22rpx;
  color: #9ca3af;
}

.cs-value {
  font-size: 28rpx;
  color: #1f2937;
  word-break: break-all;
}

.cs-action {
  flex-shrink: 0;
  color: #ff5a3d;
  font-size: 26rpx;
}

.cs-close {
  margin-top: 28rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 38rpx;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 28rpx;
}

.back-top-arrow {
  width: 18rpx;
  height: 18rpx;
  margin-top: 8rpx;
  border-top: 4rpx solid #ff5a3d;
  border-left: 4rpx solid #ff5a3d;
  transform: rotate(45deg);
}
</style>
