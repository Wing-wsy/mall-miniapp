import { fetchShopContact } from "@/api/shop";

/** 积分 C 端未开放时提示并返回；开放返回 true */
export async function assertPointsOpen(): Promise<boolean> {
  try {
    const res = await fetchShopContact();
    if (res.data?.pointsEnabled) {
      return true;
    }
  } catch {
    // treat as closed
  }
  uni.showToast({ title: "积分功能暂未开放", icon: "none" });
  setTimeout(() => {
    uni.navigateBack({ fail: () => uni.switchTab({ url: "/pages/mine/index" }) });
  }, 400);
  return false;
}

/** 优惠券 C 端未开放时提示并返回；开放返回 true */
export async function assertCouponOpen(): Promise<boolean> {
  try {
    const res = await fetchShopContact();
    if (res.data?.couponEnabled) {
      return true;
    }
  } catch {
    // treat as closed
  }
  uni.showToast({ title: "优惠券功能暂未开放", icon: "none" });
  setTimeout(() => {
    uni.navigateBack({ fail: () => uni.switchTab({ url: "/pages/mine/index" }) });
  }, 400);
  return false;
}
