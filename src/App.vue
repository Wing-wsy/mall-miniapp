<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";
import { useThemeStore } from "@/stores/theme";
import { fetchCartCount } from "@/api/cart";

const themeStore = useThemeStore();
const INVITE_CODE_KEY = "mall_level_invite_code";
let lastInviteCode = "";

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

onLaunch(async (options) => {
  consumeInviteCode(options);
  await themeStore.loadCurrent();
});

onShow(async (options) => {
  consumeInviteCode(options);
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
