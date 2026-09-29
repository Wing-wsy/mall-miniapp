const STORAGE_KEY = "mall_cart_badge_unread";
const TAB_INDEX = 2;

function readCount() {
  const n = Number(uni.getStorageSync(STORAGE_KEY) || 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function writeCount(n: number) {
  const count = Math.max(0, Math.floor(n));
  if (count > 0) {
    uni.setStorageSync(STORAGE_KEY, count);
  } else {
    uni.removeStorageSync(STORAGE_KEY);
  }
  return count;
}

function render(count: number) {
  if (count > 0) {
    uni.setTabBarBadge({
      index: TAB_INDEX,
      text: count > 99 ? "99+" : String(count),
      fail() {},
    });
    return;
  }
  uni.removeTabBarBadge({ index: TAB_INDEX, fail() {} });
}

/** 按本地未读加购次数显示角标。未登录不显示。 */
export function showCartBadge() {
  const token = uni.getStorageSync("mall_app_token");
  if (!token) {
    writeCount(0);
    render(0);
    return;
  }
  render(readCount());
}

/** 一次「加入购物车」成功后 +1，与本次加购件数无关。 */
export function bumpCartBadge() {
  if (!uni.getStorageSync("mall_app_token")) {
    return;
  }
  render(writeCount(readCount() + 1));
}

/** 进入购物车后清掉，下次加购从 1 重新计。 */
export function clearCartBadge() {
  writeCount(0);
  render(0);
}
