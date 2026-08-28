import { computed } from "vue";
import { onShareAppMessage } from "@dcloudio/uni-app";
import { useUserStore } from "@/stores/user";

export function useProductShare() {
  const userStore = useUserStore();
  const canShare = computed(
    () => !!userStore.userInfo?.canShare && !!userStore.userInfo?.shareActive && !!userStore.userInfo?.shareCode
  );

  onShareAppMessage((res) => {
    if (!canShare.value) {
      return { title: "Mall精选", path: "/pages/index/index" };
    }
    const sc = userStore.userInfo?.shareCode || "";
    const dataset = (res as { target?: { dataset?: Record<string, string> } })?.target?.dataset || {};
    const pid = dataset.pid || dataset.id || "";
    const query = pid ? `sc=${encodeURIComponent(sc)}&pid=${encodeURIComponent(pid)}` : `sc=${encodeURIComponent(sc)}`;
    return {
      title: pid ? "给你推荐一件商品" : "Mall精选",
      path: `/pages/share/enter?${query}`,
    };
  });

  return { canShare };
}
