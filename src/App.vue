<script setup lang="ts">
import { onLaunch, onShow } from "@dcloudio/uni-app";
import { useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();

onLaunch(async () => {
  await themeStore.loadCurrent();
});

onShow(async () => {
  // 回前台刷新皮肤；Tab 切换需在 tab 页生效
  await themeStore.loadCurrent();
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
</style>
