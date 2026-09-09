import { addCart, fetchCartCount } from "@/api/cart";
import { fetchProductDetail } from "@/api/product";
import { ApiError } from "@/utils/request";
import { isMaintenanceError } from "@/utils/maintenance";
import { useUserStore } from "@/stores/user";

async function refreshBadge() {
  try {
    const res = await fetchCartCount();
    const n = res.data?.totalQuantity || 0;
    if (n > 0) {
      uni.setTabBarBadge({ index: 2, text: n > 99 ? "99+" : String(n) });
    } else {
      uni.removeTabBarBadge({ index: 2 });
    }
  } catch {
    // ignore
  }
}

function goLogin() {
  uni.navigateTo({ url: "/pages/login/index" });
}

function toast(title: string, icon: "none" | "success" = "none") {
  uni.showToast({ title, icon });
}

/** 列表页快捷加购：默认规格/单位直接加购，留在当前页 */
export async function quickAddCart(productId: number, _multiSpec?: boolean) {
  if (!productId) {
    return;
  }
  const userStore = useUserStore();
  if (!userStore.isLogin) {
    goLogin();
    return;
  }

  try {
    const res = await fetchProductDetail(productId);
    const detail = res.data;
    if (!detail) {
      toast("商品不存在");
      return;
    }
    const skus = (detail.skus || []).filter((sku) => sku.status !== 0);
    const sku = skus[0];
    if (!sku?.id) {
      toast("暂无可用规格");
      return;
    }
    const units = detail.sellUnits || [];
    const unit = units.find((u) => u.isBase === 1) || units[0];
    if (!unit?.id) {
      toast("暂无可用售卖单位");
      return;
    }
    if ((sku.stock ?? 0) <= 0) {
      toast("已售罄");
      return;
    }
    await addCart(sku.id, 1, undefined, unit.id);
    toast("已添加购物车", "success");
    await refreshBadge();
  } catch (e: unknown) {
    if (e instanceof ApiError && e.code === 401) {
      goLogin();
      return;
    }
    if (!isMaintenanceError(e)) {
      toast(e instanceof Error ? e.message : "加购失败");
    }
  }
}
