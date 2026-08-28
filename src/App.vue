<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";
import { useThemeStore } from "@/stores/theme";
import { fetchCartCount } from "@/api/cart";

const themeStore = useThemeStore();
const INVITE_CODE_KEY = "mall_level_invite_code";
const SHARE_SC_KEY = "mall_share_sc";
const SHARE_PID_KEY = "mall_share_pid";
let lastInviteCode = "";
let lastShareKey = "";

function consumeInviteCode(options?: { path?: string; query?: Record<string, any> }) {
  const code = String(options?.query?.code || "").trim();
  if (!code || code === lastInviteCode) {
    return;
  }
  const path = String(options?.path || "");
  if (path.includes("pages/invite/level")) {
    return;
  }
  lastInviteCode = code;
  uni.setStorageSync(INVITE_CODE_KEY, code);
  uni.reLaunch({ url: `/pages/invite/level?code=${encodeURIComponent(code)}` });
}

function consumeShare(options?: { path?: string; query?: Record<string, any> }) {
  const sc = String(options?.query?.sc || "").trim();
  if (!sc) {
    return;
  }
  const pid = String(options?.query?.pid || "").trim();
  const key = `${sc}|${pid}`;
  if (key === lastShareKey) {
    return;
  }
  const path = String(options?.path || "");
  if (path.includes("pages/share/enter")) {
    return;
  }
  lastShareKey = key;
  uni.setStorageSync(SHARE_SC_KEY, sc);
  if (pid) {
    uni.setStorageSync(SHARE_PID_KEY, pid);
  } else {
    uni.removeStorageSync(SHARE_PID_KEY);
  }
  let url = `/pages/share/enter?sc=${encodeURIComponent(sc)}`;
  if (pid) {
    url += `&pid=${encodeURIComponent(pid)}`;
  }
  uni.reLaunch({ url });
}

onLaunch(async (options) => {
  consumeInviteCode(options);
  consumeShare(options);
  await themeStore.loadCurrent();
});

onShow(async (options) => {
  consumeInviteCode(options);
  consumeShare(options);
  await themeStore.loadCurrent();
  const token = uni.getStorageSync("mall_app_token");
  if (!token) {
    uni.removeTabBarBadge({ index: 2 });
    return;
  }
  try {
    const res = await fetchCartCount();
    const n = res.data?.totalQuantity || 0;
    if (n > 0) {
      uni.setTabBarBadge({ index: 2, text: n > 99 ? "99+" : String(n) });
    } else {
      uni.removeTabBarBadge({ index: 2 });
    }
  } catch {
    uni.removeTabBarBadge({ index: 2 });
  }
});
</script>

<style>
page {
  background: #f7f7f7;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue",
    "Microsoft YaHei", sans-serif;
}

button::after {
  border: none;
}

image {
  display: block;
}
</style>
