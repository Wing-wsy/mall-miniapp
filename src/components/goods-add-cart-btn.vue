<template>
  <view
    class="add-cart"
    :class="{ disabled: busy }"
    hover-class="add-cart-hover"
    @click.stop="onTap"
  >
    <image class="cart-icon" :src="cartIconSrc" mode="aspectFit" />
  </view>
</template>

<script lang="ts">
export default {
  options: {
    virtualHost: true,
    styleIsolation: "apply-shared",
  },
};
</script>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useThemeStore } from "@/stores/theme";
import { quickAddCart } from "@/composables/useQuickAddCart";

const props = defineProps<{
  productId: number;
  multiSpec?: boolean;
  source?: string;
}>();

const themeStore = useThemeStore();
const busy = ref(false);

const TAB_ICON_PACKS: Record<string, string> = {
  default: "/static/tab",
  zhongqiu: "/static/tab/zhongqiu",
  duanwu: "/static/tab/duanwu",
};

const cartIconSrc = computed(() => {
  const pack = TAB_ICON_PACKS[themeStore.theme.code] || TAB_ICON_PACKS.default;
  return `${pack}/cart.png`;
});

async function onTap() {
  if (busy.value) return;
  busy.value = true;
  try {
    await quickAddCart(props.productId, props.multiSpec, props.source || "list");
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.add-cart {
  flex-shrink: 0;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.add-cart-hover {
  opacity: 0.7;
}

.add-cart.disabled {
  opacity: 0.5;
}

.cart-icon {
  width: 48rpx;
  height: 48rpx;
}
</style>
