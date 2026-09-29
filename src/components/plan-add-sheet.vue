<template>
  <view v-if="visible" class="mask" @click="emit('close')" @touchmove.stop.prevent>
    <view class="sheet" @click.stop>
      <view class="sheet-head">
        <text class="sheet-title">加入方案</text>
        <text class="sheet-close" @click="emit('close')">关闭</text>
      </view>
      <view v-if="loading" class="sheet-state">加载中...</view>
      <view v-else-if="error" class="sheet-state">{{ error }}</view>
      <template v-else-if="product">
        <text class="product-name">{{ product.name }}</text>
        <text class="product-price">¥{{ displayPrice }}</text>
        <view v-for="attr in attrs" :key="attr.attrId" class="block">
          <text class="label">{{ attr.attrName }}</text>
          <view class="chips">
            <view
              v-for="val in attr.values || []"
              :key="val.id"
              class="chip"
              :class="{ on: selectedValueByAttr[attr.attrId] === val.id }"
              @click="selectedValueByAttr[attr.attrId] = val.id"
            >
              <text>{{ val.valueName }}</text>
            </view>
          </view>
        </view>
        <view v-if="sellUnits.length" class="block">
          <text class="label">售卖单位</text>
          <view class="chips">
            <view
              v-for="unit in sellUnits"
              :key="unit.id"
              class="chip"
              :class="{ on: selectedSellUnitId === unit.id }"
              @click="selectUnit(unit.id)"
            >
              <text>{{ unit.name }}</text>
            </view>
          </view>
        </view>
        <view class="qty-row">
          <text class="label">数量</text>
          <view class="qty">
            <text class="qty-btn" @click="changeQty(-1)">−</text>
            <text class="qty-num">{{ qty }}</text>
            <text class="qty-btn" @click="changeQty(1)">+</text>
          </view>
        </view>
        <text v-if="hint" class="hint">{{ hint }}</text>
        <button class="confirm" :disabled="!canConfirm" @click="onConfirm">
          {{ canConfirm ? "加入方案" : "请选择规格" }}
        </button>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  fetchProductDetail,
  type ProductDetailVO,
  type ProductSellUnitVO,
  type ProductSkuVO,
} from "@/api/product";
import { salePrice } from "@/utils/price";

const props = defineProps<{ visible: boolean; productId: number }>();
const emit = defineEmits<{
  close: [];
  confirm: [payload: { skuId: number; sellUnitId: number; quantity: number }];
}>();

const product = ref<ProductDetailVO | null>(null);
const loading = ref(false);
const error = ref("");
const qty = ref(1);
const selectedSellUnitId = ref<number | null>(null);
const selectedValueByAttr = reactive<Record<number, number>>({});

const attrs = computed(() => product.value?.attrs || []);
const skus = computed<ProductSkuVO[]>(() =>
  (product.value?.skus || []).filter((sku) => sku.status == null || sku.status === 1)
);
const sellUnits = computed<ProductSellUnitVO[]>(() =>
  (product.value?.sellUnits || []).filter((unit) => unit.status == null || unit.status === 1)
);

function sameValueIds(a: number[] = [], b: number[] = []) {
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((value, index) => value === right[index]);
}

const selectedSku = computed(() => {
  if (!skus.value.length) return undefined;
  if (!attrs.value.length) return skus.value[0];
  const ids = attrs.value
    .map((attr) => selectedValueByAttr[attr.attrId])
    .filter((id): id is number => id != null);
  if (ids.length !== attrs.value.length) return undefined;
  return skus.value.find((sku) => sameValueIds(sku.attrValueIds || [], ids));
});

const selectedUnit = computed(
  () => sellUnits.value.find((unit) => unit.id === selectedSellUnitId.value) || sellUnits.value[0]
);

function convertOf(unit?: ProductSellUnitVO) {
  return unit?.convertQty && unit.convertQty > 0 ? unit.convertQty : 1;
}

const priceSource = computed(() => {
  const sku = selectedSku.value;
  const unit = selectedUnit.value;
  if (!sku) return product.value;
  if (unit && unit.price != null && unit.price !== "") {
    return {
      price: unit.price,
      originPrice: unit.originPrice ?? undefined,
      memberPrice: unit.memberPrice,
      sharePrice: unit.sharePrice,
    };
  }
  const convert = convertOf(unit);
  if (!unit || unit.isBase === 1 || convert === 1) return sku;
  const mul = (value?: number | string | null) =>
    value == null || value === "" ? value : Number((Number(value) * convert).toFixed(2));
  return {
    price: mul(sku.price) as number,
    originPrice: mul(sku.originPrice) as number | undefined,
    memberPrice: mul(sku.memberPrice),
    sharePrice: mul(sku.sharePrice),
  };
});

const displayPrice = computed(() => salePrice(priceSource.value));

const floorQty = computed(() => {
  const minOrder = product.value?.minOrderQty && product.value.minOrderQty > 0 ? product.value.minOrderQty : 1;
  return Math.max(1, Math.ceil(minOrder / convertOf(selectedUnit.value)));
});

const hint = computed(() => {
  if (!selectedSku.value) return "请选择规格";
  if (!selectedUnit.value) return "暂无可用售卖单位";
  const minOrder = product.value?.minOrderQty;
  if (minOrder && minOrder > 1) return `起订量 ${minOrder} 个库存单位`;
  return "";
});

const canConfirm = computed(() => !!selectedSku.value?.id && !!selectedUnit.value?.id && qty.value >= floorQty.value);

watch(
  () => [props.visible, props.productId] as const,
  ([visible, productId]) => {
    if (!visible || !productId) return;
    load(productId);
  }
);

async function load(productId: number) {
  loading.value = true;
  error.value = "";
  product.value = null;
  qty.value = 1;
  selectedSellUnitId.value = null;
  Object.keys(selectedValueByAttr).forEach((key) => delete selectedValueByAttr[Number(key)]);
  try {
    const res = await fetchProductDetail(productId);
    product.value = res.data || null;
    if (!product.value) {
      error.value = "商品不存在";
      return;
    }
    for (const attr of product.value.attrs || []) {
      const first = attr.values?.[0]?.id;
      if (first) selectedValueByAttr[attr.attrId] = first;
    }
    const base = (product.value.sellUnits || []).find((unit) => unit.isBase === 1 && unit.status !== 0);
    const unit = base || (product.value.sellUnits || []).find((item) => item.status !== 0);
    selectedSellUnitId.value = unit?.id || null;
    qty.value = floorQty.value;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "加载失败";
  } finally {
    loading.value = false;
  }
}

function selectUnit(id: number) {
  selectedSellUnitId.value = id;
  if (qty.value < floorQty.value) qty.value = floorQty.value;
}

function changeQty(delta: number) {
  const next = qty.value + delta;
  if (next < floorQty.value) {
    uni.showToast({ title: `起订量至少 ${floorQty.value}`, icon: "none" });
    return;
  }
  qty.value = next;
}

function onConfirm() {
  const skuId = selectedSku.value?.id;
  const sellUnitId = selectedUnit.value?.id;
  if (!skuId || !sellUnitId) return;
  emit("confirm", { skuId, sellUnitId, quantity: qty.value });
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 40;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
  overflow: auto;
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sheet-title {
  font-size: 32rpx;
  font-weight: 700;
}
.sheet-close,
.sheet-state {
  color: #9ca3af;
  font-size: 26rpx;
}
.sheet-state {
  padding: 48rpx 0;
  text-align: center;
}
.product-name {
  display: block;
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #1f2937;
}
.product-price {
  display: block;
  margin-top: 8rpx;
  color: #ff5a3d;
  font-size: 32rpx;
  font-weight: 700;
}
.block {
  margin-top: 24rpx;
}
.label {
  font-size: 24rpx;
  color: #6b7280;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 12rpx;
}
.chip {
  padding: 10rpx 22rpx;
  border-radius: 28rpx;
  background: #f3f4f6;
  font-size: 24rpx;
  color: #374151;
}
.chip.on {
  background: #fff1ee;
  color: #ff5a3d;
}
.qty-row {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.qty {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.qty-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #f3f4f6;
  text-align: center;
  line-height: 48rpx;
}
.hint {
  display: block;
  margin-top: 16rpx;
  color: #9ca3af;
  font-size: 22rpx;
}
.confirm {
  margin-top: 28rpx;
  background: #ff5a3d;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
}
.confirm[disabled] {
  background: #f3b5a8;
}
</style>
